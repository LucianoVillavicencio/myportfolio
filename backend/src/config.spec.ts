import { resolveCorsOrigin, resolveDbPath, resolveStaticDir } from './config';

describe('resolveDbPath', () => {
  it('returns DB_PATH when set', () => {
    expect(resolveDbPath({ DB_PATH: '/data/x.sqlite' })).toBe('/data/x.sqlite');
  });

  it('throws in production without DB_PATH', () => {
    expect(() => resolveDbPath({ NODE_ENV: 'production' })).toThrow(
      /DB_PATH must be set/,
    );
  });

  it('falls back to portfolio.sqlite outside production', () => {
    expect(resolveDbPath({})).toMatch(/portfolio\.sqlite$/);
  });
});

describe('resolveStaticDir', () => {
  it('returns STATIC_DIR when set', () => {
    expect(resolveStaticDir({ STATIC_DIR: '/x' })).toBe('/x');
  });

  it('defaults to frontend/dist', () => {
    expect(resolveStaticDir({})).toMatch(/frontend.dist$/);
  });
});

describe('resolveCorsOrigin', () => {
  it('parses a comma-separated allow-list', () => {
    expect(
      resolveCorsOrigin({ CORS_ORIGIN: 'https://a.com, https://b.com', NODE_ENV: 'production' }),
    ).toEqual(['https://a.com', 'https://b.com']);
  });

  it('refuses cross-origin requests in production by default', () => {
    expect(resolveCorsOrigin({ NODE_ENV: 'production' })).toBe(false);
  });

  it('allows any origin outside production', () => {
    expect(resolveCorsOrigin({})).toBe(true);
  });
});
