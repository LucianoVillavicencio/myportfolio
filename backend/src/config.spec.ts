import { resolveDbPath, resolveStaticDir } from './config';

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
