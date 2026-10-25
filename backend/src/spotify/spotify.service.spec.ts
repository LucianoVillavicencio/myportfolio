import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { testDb } from '../../test/test-db';
import { SPOTIFY_SETTINGS_ID, SpotifySettings } from './spotify-settings.entity';
import { signState, verifyState } from './spotify-client';
import { SPOTIFY_CONFIG, SPOTIFY_FETCH, SpotifyService } from './spotify.service';

const CONFIG = { clientId: 'id', clientSecret: 'secret', redirectUri: 'http://x/cb' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const artist = (name: string) => ({
  name,
  images: [{ url: 'https://img/640', width: 640 }, { url: 'https://img/300', width: 300 }],
  external_urls: { spotify: `https://open.spotify.com/artist/${name}` },
});

const playlist = (id: string, extra: object = {}) => ({
  id,
  name: `List ${id}`,
  images: [{ url: `https://img/${id}`, width: 300 }],
  external_urls: { spotify: `https://open.spotify.com/playlist/${id}` },
  tracks: { total: 7 },
  public: true,
  ...extra,
});

describe('SpotifyService', () => {
  let service: SpotifyService;
  let settings: Repository<SpotifySettings>;
  let routes: Record<string, () => Response>;
  let fakeFetch: jest.Mock;

  const calls = (needle: string) =>
    fakeFetch.mock.calls.filter(([url]) => String(url).includes(needle)).length;

  async function build(config: typeof CONFIG | null = CONFIG) {
    fakeFetch = jest.fn(async (url: string) => {
      const key = Object.keys(routes).find((k) => url.includes(k));
      if (!key) throw new Error(`unexpected request: ${url}`);
      return routes[key]();
    });
    const moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([SpotifySettings])],
      providers: [
        SpotifyService,
        { provide: SPOTIFY_FETCH, useValue: fakeFetch },
        { provide: SPOTIFY_CONFIG, useValue: config },
      ],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(SpotifyService);
    settings = moduleRef.get(getRepositoryToken(SpotifySettings));
  }

  const connect = async () => {
    await service.getStatus();
    await settings.update({ id: SPOTIFY_SETTINGS_ID }, { refreshToken: 'refresh' });
  };

  beforeEach(() => {
    routes = {
      '/api/token': () => json({ access_token: 'access', expires_in: 3600 }),
    };
  });

  it('reports configured/connected status', async () => {
    await build(null);
    expect(await service.getStatus()).toMatchObject({ configured: false, connected: false });
    await build();
    await connect();
    expect(await service.getStatus()).toMatchObject({ configured: true, connected: true });
  });

  it('has no top artist when not connected, without calling Spotify', async () => {
    await build();
    expect(await service.getTopArtist()).toEqual({ artist: null });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it('returns the top artist of the last four weeks', async () => {
    await build();
    await connect();
    routes['/me/top/artists'] = () => json({ items: [artist('Cerati')] });
    expect(await service.getTopArtist()).toEqual({
      artist: {
        name: 'Cerati',
        imageUrl: 'https://img/300',
        url: 'https://open.spotify.com/artist/Cerati',
      },
    });
    expect(fakeFetch.mock.calls.find(([u]) => String(u).includes('/me/top/artists'))?.[0]).toContain(
      'time_range=short_term',
    );
  });

  it('shares one Spotify call between visitors for the cache window', async () => {
    await build();
    await connect();
    routes['/me/top/artists'] = () => json({ items: [artist('Cerati')] });
    await Promise.all([service.getTopArtist(), service.getTopArtist(), service.getTopArtist()]);
    await service.getTopArtist();
    expect(calls('/me/top/artists')).toBe(1);
    expect(calls('/api/token')).toBe(1);
  });

  it('never throws: keeps the last artist and retries after a minute', async () => {
    await build();
    await connect();
    routes['/me/top/artists'] = () => json({ items: [artist('Cerati')] });
    await service.getTopArtist();
    jest.useFakeTimers({ now: Date.now() + 2 * 60 * 60_000, doNotFake: ['setImmediate', 'nextTick'] });
    try {
      routes['/me/top/artists'] = () => json({ error: { message: 'boom' } }, 500);
      expect((await service.getTopArtist()).artist?.name).toBe('Cerati');
      jest.setSystemTime(Date.now() + 2 * 60_000);
      routes['/me/top/artists'] = () => json({ items: [artist('Spinetta')] });
      expect((await service.getTopArtist()).artist?.name).toBe('Spinetta');
    } finally {
      jest.useRealTimers();
    }
  });

  it('forgets a refresh token Spotify rejects', async () => {
    await build();
    await connect();
    routes['/api/token'] = () => json({ error: 'invalid_grant' }, 400);
    await service.getTopArtist();
    expect((await service.getStatus()).connected).toBe(false);
  });

  describe('playlists', () => {
    beforeEach(async () => {
      await build();
      await connect();
      routes['/me/playlists'] = () =>
        json({ items: [playlist('a'), playlist('b', { public: false }), playlist('c')], next: null });
    });

    it('lists the account playlists with mapped fields', async () => {
      const list = await service.listAvailable();
      expect(list.map((p) => p.id)).toEqual(['a', 'b', 'c']);
      expect(list[1].isPublic).toBe(false);
      expect(list[0]).toMatchObject({ name: 'List a', trackCount: 7, imageUrl: 'https://img/a' });
    });

    it('stores the picked playlists in the chosen order', async () => {
      await service.setSelected(['c', 'a']);
      expect((await service.getPlaylists()).map((p) => p.id)).toEqual(['c', 'a']);
      expect((await service.getStatus()).selectedIds).toEqual(['c', 'a']);
    });

    it('rejects ids that are not on the account', async () => {
      await expect(service.setSelected(['a', 'nope'])).rejects.toThrow(BadRequestException);
      expect(await service.getPlaylists()).toEqual([]);
    });

    it('serves the public list from the snapshot without calling Spotify', async () => {
      await service.setSelected(['a']);
      fakeFetch.mockClear();
      await service.getPlaylists();
      expect(fakeFetch).not.toHaveBeenCalled();
    });

    it('sync refreshes names and drops playlists that disappeared', async () => {
      await service.setSelected(['a', 'b']);
      routes['/me/playlists'] = () =>
        json({ items: [playlist('a', { name: 'Renamed' })], next: null });
      await service.syncPlaylists();
      expect((await service.getPlaylists()).map((p) => p.name)).toEqual(['Renamed']);
    });

    it('disconnect clears the token and the picks', async () => {
      await service.setSelected(['a']);
      await service.disconnect();
      expect(await service.getStatus()).toMatchObject({ connected: false, selectedIds: [] });
      expect(await service.getPlaylists()).toEqual([]);
    });
  });
});

describe('OAuth state', () => {
  it('accepts a fresh state and rejects tampered, foreign or expired ones', () => {
    const state = signState('secret', 1_000);
    expect(verifyState('secret', state, 2_000)).toBe(true);
    expect(verifyState('other', state, 2_000)).toBe(false);
    expect(verifyState('secret', `${state}0`, 2_000)).toBe(false);
    expect(verifyState('secret', state, 1_000 + 11 * 60_000)).toBe(false);
    expect(verifyState('secret', 'garbage', 2_000)).toBe(false);
  });
});
