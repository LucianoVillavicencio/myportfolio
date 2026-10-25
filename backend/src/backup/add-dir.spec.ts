import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { addDir } from './backup.controller';

describe('addDir', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'add-dir-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('skips a missing directory', async () => {
    const out: Record<string, Uint8Array> = {};
    await addDir(out, join(dir, 'nope'), 'cv', () => true);
    expect(out).toEqual({});
  });

  it('rethrows other read errors instead of silently omitting files', async () => {
    const file = join(dir, 'not-a-dir');
    writeFileSync(file, 'x');
    await expect(addDir({}, file, 'cv', () => true)).rejects.toThrow();
  });

  it('adds accepted regular files under the prefix', async () => {
    writeFileSync(join(dir, 'a.pdf'), 'abc');
    writeFileSync(join(dir, 'b.txt'), 'no');
    const out: Record<string, Uint8Array> = {};
    await addDir(out, dir, 'cv', (n) => n.endsWith('.pdf'));
    expect(Object.keys(out)).toEqual(['cv/a.pdf']);
  });
});
