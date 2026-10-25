import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SPOTIFY_SETTINGS_ID, SpotifySettings } from './spotify-settings.entity';
import {
  FetchFn,
  SpotifyApiError,
  SpotifyConfig,
  SpotifyPlaylist,
  SpotifyTrack,
  buildAuthUrl,
  exchangeCode,
  mapPlaylist,
  mapTrack,
  refreshAccessToken,
  signState,
  spotifyGet,
  verifyState,
} from './spotify-client';

export const SPOTIFY_FETCH = Symbol('SPOTIFY_FETCH');
export const SPOTIFY_CONFIG = Symbol('SPOTIFY_CONFIG');

/** Visitors share one Spotify call per window, which keeps us far below rate limits. */
export const NOW_PLAYING_TTL_MS = 10_000;
export const RECENT_TTL_MS = 60_000;
const TOKEN_SKEW_MS = 30_000;
const MAX_PLAYLIST_PAGES = 4;

export interface SpotifyStatus {
  configured: boolean;
  connected: boolean;
  selectedIds: string[];
  playlistsSyncedAt: Date | null;
}

export interface NowPlaying {
  isPlaying: boolean;
  /** The current track while playing, otherwise the last one played. */
  track: SpotifyTrack | null;
}

const IDLE: NowPlaying = { isPlaying: false, track: null };

interface Cached<T> {
  at: number;
  value: Promise<T>;
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private token: { value: string; expiresAt: number } | null = null;
  private nowCache: Cached<NowPlaying> | null = null;
  private recentCache: Cached<SpotifyTrack | null> | null = null;
  private lastGood: NowPlaying = IDLE;

  constructor(
    @InjectRepository(SpotifySettings)
    private readonly settingsRepo: Repository<SpotifySettings>,
    @Inject(SPOTIFY_FETCH) private readonly fetchFn: FetchFn,
    @Inject(SPOTIFY_CONFIG) private readonly config: SpotifyConfig | null,
  ) {}

  private async loadSettings(): Promise<SpotifySettings> {
    const existing = await this.settingsRepo.findOneBy({ id: SPOTIFY_SETTINGS_ID });
    if (existing) return existing;
    return this.settingsRepo.save(
      this.settingsRepo.create({
        id: SPOTIFY_SETTINGS_ID,
        refreshToken: null,
        selectedIds: [],
        playlists: [],
        playlistsSyncedAt: null,
      }),
    );
  }

  private requireConfig(): SpotifyConfig {
    if (!this.config) {
      throw new ServiceUnavailableException(
        'Spotify is not configured (set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REDIRECT_URI)',
      );
    }
    return this.config;
  }

  async getStatus(): Promise<SpotifyStatus> {
    const s = await this.loadSettings();
    return {
      configured: this.config !== null,
      connected: s.refreshToken !== null,
      selectedIds: s.selectedIds,
      playlistsSyncedAt: s.playlistsSyncedAt,
    };
  }

  // --- connection -----------------------------------------------------------

  getAuthUrl(): { url: string } {
    const cfg = this.requireConfig();
    return { url: buildAuthUrl(cfg, signState(cfg.clientSecret)) };
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const cfg = this.requireConfig();
    if (!verifyState(cfg.clientSecret, state)) {
      throw new BadRequestException('Invalid or expired Spotify authorization state');
    }
    const grant = await exchangeCode(this.fetchFn, cfg, code).catch((err) => {
      throw new BadGatewayException(err instanceof Error ? err.message : 'Spotify error');
    });
    if (!grant.refreshToken) throw new BadGatewayException('Spotify returned no refresh token');
    const settings = await this.loadSettings();
    settings.refreshToken = grant.refreshToken;
    await this.settingsRepo.save(settings);
    this.token = { value: grant.accessToken, expiresAt: Date.now() + grant.expiresInSec * 1000 };
    this.resetCaches();
    await this.syncPlaylists().catch(() => undefined);
  }

  async disconnect(): Promise<SpotifyStatus> {
    const settings = await this.loadSettings();
    settings.refreshToken = null;
    settings.selectedIds = [];
    settings.playlists = [];
    settings.playlistsSyncedAt = null;
    await this.settingsRepo.save(settings);
    this.token = null;
    this.resetCaches();
    return this.getStatus();
  }

  private resetCaches() {
    this.nowCache = null;
    this.recentCache = null;
    this.lastGood = IDLE;
  }

  /** Returns a valid access token, refreshing it when needed; null if not connected. */
  private async getAccessToken(): Promise<string | null> {
    if (this.token && this.token.expiresAt - TOKEN_SKEW_MS > Date.now()) return this.token.value;
    const cfg = this.config;
    const settings = await this.loadSettings();
    if (!cfg || !settings.refreshToken) return null;
    try {
      const grant = await refreshAccessToken(this.fetchFn, cfg, settings.refreshToken);
      this.token = { value: grant.accessToken, expiresAt: Date.now() + grant.expiresInSec * 1000 };
      if (grant.refreshToken && grant.refreshToken !== settings.refreshToken) {
        settings.refreshToken = grant.refreshToken;
        await this.settingsRepo.save(settings);
      }
      return this.token.value;
    } catch (err) {
      if (err instanceof SpotifyApiError && err.status === 400) {
        // Revoked or expired grant: forget it so the admin panel asks to reconnect.
        this.logger.warn(`Spotify refresh token rejected: ${err.message}`);
        settings.refreshToken = null;
        await this.settingsRepo.save(settings);
        this.token = null;
      }
      throw err;
    }
  }

  private async get<T>(path: string): Promise<T | null> {
    const token = await this.getAccessToken();
    if (!token) throw new ServiceUnavailableException('Spotify is not connected');
    return spotifyGet<T>(this.fetchFn, token, path);
  }

  // --- playlists ------------------------------------------------------------

  /** Every playlist on the connected account (admin picker). */
  async listAvailable(): Promise<SpotifyPlaylist[]> {
    const out: SpotifyPlaylist[] = [];
    let next: string | null = '/me/playlists?limit=50';
    for (let page = 0; next && page < MAX_PLAYLIST_PAGES; page++) {
      const body: { items?: unknown[]; next?: string | null } | null = await this.wrapped(() =>
        this.get(next as string),
      );
      for (const raw of body?.items ?? []) {
        const playlist = mapPlaylist(raw);
        if (playlist) out.push(playlist);
      }
      next = body?.next ?? null;
    }
    return out;
  }

  async setSelected(ids: string[]): Promise<SpotifyStatus> {
    const available = await this.listAvailable();
    const unknown = ids.filter((id) => !available.some((p) => p.id === id));
    if (unknown.length) {
      throw new BadRequestException(`Not a playlist of the connected account: ${unknown.join(', ')}`);
    }
    const settings = await this.loadSettings();
    settings.selectedIds = ids;
    this.applySnapshot(settings, available);
    await this.settingsRepo.save(settings);
    return this.getStatus();
  }

  private applySnapshot(settings: SpotifySettings, available: SpotifyPlaylist[]) {
    const byId = new Map(available.map((p) => [p.id, p]));
    settings.playlists = settings.selectedIds
      .map((id) => byId.get(id))
      .filter((p): p is SpotifyPlaylist => p !== undefined);
    settings.playlistsSyncedAt = new Date();
  }

  /** Refreshes names, covers and counts of the picked playlists. */
  async syncPlaylists(): Promise<void> {
    const settings = await this.loadSettings();
    if (!settings.refreshToken || settings.selectedIds.length === 0) return;
    this.applySnapshot(settings, await this.listAvailable());
    await this.settingsRepo.save(settings);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync(): Promise<void> {
    try {
      await this.syncPlaylists();
    } catch (err) {
      this.logger.warn(`Playlist sync failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** Public: the stored snapshot, no Spotify call. */
  async getPlaylists(): Promise<SpotifyPlaylist[]> {
    return (await this.loadSettings()).playlists;
  }

  // --- now playing ----------------------------------------------------------

  async getNowPlaying(): Promise<NowPlaying> {
    const now = Date.now();
    if (this.nowCache && now - this.nowCache.at < NOW_PLAYING_TTL_MS) return this.nowCache.value;
    const value = this.fetchNowPlaying();
    this.nowCache = { at: now, value };
    return value;
  }

  /** Never throws: the public widget falls back to the last good answer. */
  private async fetchNowPlaying(): Promise<NowPlaying> {
    try {
      if (!(await this.getAccessToken())) return IDLE;
      const current = await this.get<{ is_playing?: boolean; item?: unknown }>(
        '/me/player/currently-playing?additional_types=episode',
      );
      const track = current?.is_playing ? mapTrack(current.item) : null;
      this.lastGood = track
        ? { isPlaying: true, track }
        : { isPlaying: false, track: await this.getLastPlayed() };
      return this.lastGood;
    } catch (err) {
      this.logger.warn(`Now playing failed: ${err instanceof Error ? err.message : err}`);
      return this.lastGood.isPlaying ? { ...this.lastGood, isPlaying: false } : this.lastGood;
    }
  }

  private getLastPlayed(): Promise<SpotifyTrack | null> {
    const now = Date.now();
    if (this.recentCache && now - this.recentCache.at < RECENT_TTL_MS) {
      return this.recentCache.value;
    }
    const value = this.get<{ items?: { track?: unknown }[] }>('/me/player/recently-played?limit=1')
      .then((body) => mapTrack(body?.items?.[0]?.track))
      .catch((err) => {
        this.recentCache = null;
        throw err;
      });
    this.recentCache = { at: now, value };
    return value;
  }

  private async wrapped<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof SpotifyApiError) throw new BadGatewayException(err.message);
      throw err;
    }
  }
}
