import { slugify } from './slug';

describe('slugify', () => {
  it('strips accents and lowercases', () => {
    expect(slugify('Gestión FLG Gym')).toBe('gestion-flg-gym');
  });
  it('collapses symbols and trims dashes', () => {
    expect(slugify('  C++ & Rust!! ')).toBe('c-rust');
  });
  it('falls back when nothing is left', () => {
    expect(slugify('¿¡')).toBe('project');
  });
});
