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
  SpotifyArtist,
  buildAuthUrl,
  exchangeCode,
  mapPlaylist,
  mapArtist,
  refreshAccessToken,
  signState,
  spotifyGet,
  verifyState,
} from './spotify-client';

export const SPOTIFY_FETCH = Symbol('SPOTIFY_FETCH');
export const SPOTIFY_CONFIG = Symbol('SPOTIFY_CONFIG');

/** The top artist moves slowly; one Spotify call per hour is plenty. */
export const TOP_ARTIST_TTL_MS = 60 * 60_000;
/** After a failed call, retry sooner than the normal window. */
const TOP_ARTIST_RETRY_MS = 60_000;
const TOKEN_SKEW_MS = 30_000;
const MAX_PLAYLIST_PAGES = 4;

export interface SpotifyStatus {
  configured: boolean;
  connected: boolean;
  selectedIds: string[];
  playlistsSyncedAt: Date | null;
}

export interface TopArtist {
  /** Most listened artist of the last four weeks; null until known. */
  artist: SpotifyArtist | null;
}

interface Cached<T> {
  expiresAt: number;
  value: Promise<T>;
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private token: { value: string; expiresAt: number } | null = null;
  private topArtistCache: Cached<TopArtist> | null = null;
  private lastGood: TopArtist = { artist: null };

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
    this.topArtistCache = null;
    this.lastGood = { artist: null };
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

  // --- top artist -----------------------------------------------------------

  async getTopArtist(): Promise<TopArtist> {
    if (this.topArtistCache && this.topArtistCache.expiresAt > Date.now()) {
      return this.topArtistCache.value;
    }
    const value = this.fetchTopArtist();
    this.topArtistCache = { expiresAt: Date.now() + TOP_ARTIST_TTL_MS, value };
    return value;
  }

  /** Never throws: the public card falls back to the last good answer. */
  private async fetchTopArtist(): Promise<TopArtist> {
    try {
      if (!(await this.getAccessToken())) return this.lastGood;
      const body = await this.get<{ items?: unknown[] }>(
        '/me/top/artists?time_range=short_term&limit=1',
      );
      this.lastGood = { artist: mapArtist(body?.items?.[0]) };
    } catch (err) {
      this.logger.warn(`Top artist failed: ${err instanceof Error ? err.message : err}`);
      // e.g. a token granted before the user-top-read scope existed: retry soon, not in an hour
      if (this.topArtistCache) this.topArtistCache.expiresAt = Date.now() + TOP_ARTIST_RETRY_MS;
    }
    return this.lastGood;
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
