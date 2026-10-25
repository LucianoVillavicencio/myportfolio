import { createHmac, timingSafeEqual } from 'crypto';
import { FetchFn } from '../goodreads/goodreads-client';

export { FetchFn };

export const SPOTIFY_SCOPES = ['user-top-read', 'playlist-read-private'];

const ACCOUNTS = 'https://accounts.spotify.com';
const API = 'https://api.spotify.com/v1';
const REQUEST_TIMEOUT_MS = 10_000;
const STATE_TTL_MS = 10 * 60_000;

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface SpotifyArtist {
  name: string;
  imageUrl: string | null;
  url: string | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string | null;
  url: string | null;
  trackCount: number | null;
  isPublic: boolean;
}

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function readSpotifyConfig(env: NodeJS.ProcessEnv): SpotifyConfig | null {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) return null;
  return {
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
  };
}

/** Signed, short-lived `state` so the OAuth callback can't be forged. */
export function signState(secret: string, now = Date.now()): string {
  const issuedAt = String(now);
  const mac = createHmac('sha256', secret).update(issuedAt).digest('hex');
  return `${issuedAt}.${mac}`;
}

export function verifyState(secret: string, state: string, now = Date.now()): boolean {
  const [issuedAt, mac] = state.split('.');
  if (!issuedAt || !mac || !/^\d+$/.test(issuedAt) || !/^[0-9a-f]{64}$/.test(mac)) return false;
  const age = now - Number(issuedAt);
  if (age < 0 || age > STATE_TTL_MS) return false;
  const expected = createHmac('sha256', secret).update(issuedAt).digest();
  const given = Buffer.from(mac, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function buildAuthUrl(cfg: SpotifyConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.clientId,
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: cfg.redirectUri,
    state,
  });
  return `${ACCOUNTS}/authorize?${params}`;
}

export interface TokenGrant {
  accessToken: string;
  expiresInSec: number;
  /** Only present on the first exchange, and sometimes when refreshing. */
  refreshToken: string | null;
}

async function requestToken(
  fetchFn: FetchFn,
  cfg: SpotifyConfig,
  form: Record<string, string>,
): Promise<TokenGrant> {
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  let res: Response;
  try {
    res = await fetchFn(`${ACCOUNTS}/api/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new SpotifyApiError('Could not reach Spotify', 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.access_token) {
    throw new SpotifyApiError(
      body?.error_description || body?.error || `Spotify token request failed (${res.status})`,
      res.status,
    );
  }
  return {
    accessToken: body.access_token,
    expiresInSec: Number(body.expires_in) || 3600,
    refreshToken: body.refresh_token ?? null,
  };
}

export const exchangeCode = (fetchFn: FetchFn, cfg: SpotifyConfig, code: string) =>
  requestToken(fetchFn, cfg, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.redirectUri,
  });

export const refreshAccessToken = (fetchFn: FetchFn, cfg: SpotifyConfig, refreshToken: string) =>
  requestToken(fetchFn, cfg, { grant_type: 'refresh_token', refresh_token: refreshToken });

/** GET against the Web API. Returns null on 204 . */
export async function spotifyGet<T>(
  fetchFn: FetchFn,
  accessToken: string,
  path: string,
): Promise<T | null> {
  let res: Response;
  try {
    res = await fetchFn(path.startsWith('http') ? path : `${API}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new SpotifyApiError('Could not reach Spotify', 0);
  }
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new SpotifyApiError(
      body?.error?.message || `Spotify request failed (${res.status})`,
      res.status,
    );
  }
  return res.json();
}

interface RawImage {
  url?: string;
  width?: number | null;
}

/** Spotify lists images largest first; a mid-size one is plenty for a card. */
function pickImage(images: RawImage[] | undefined): string | null {
  if (!images?.length) return null;
  const sized = images.filter((i) => i.url && i.width);
  const mid = sized.find((i) => (i.width as number) <= 400) ?? sized[sized.length - 1];
  return (mid ?? images[0]).url ?? null;
}

export function mapArtist(raw: any): SpotifyArtist | null {
  if (!raw?.name) return null;
  return {
    name: raw.name,
    imageUrl: pickImage(raw.images),
    url: raw.external_urls?.spotify ?? null,
  };
}

export function mapPlaylist(raw: any): SpotifyPlaylist | null {
  if (!raw?.id || !raw.name) return null;
  const count = raw.items?.total ?? raw.tracks?.total;
  return {
    id: raw.id,
    name: raw.name,
    imageUrl: pickImage(raw.images),
    url: raw.external_urls?.spotify ?? null,
    trackCount: typeof count === 'number' ? count : null,
    isPublic: raw.public === true,
  };
}
