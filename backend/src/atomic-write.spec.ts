import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { atomicWriteFile } from './atomic-write';

describe('atomicWriteFile', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'atomic-write-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('writes bytes that read back equal and leaves no .tmp file', async () => {
    const path = join(dir, 'db.sqlite');
    const data = new Uint8Array([1, 2, 3, 250]);
    await atomicWriteFile(path, data);
    expect(new Uint8Array(readFileSync(path))).toEqual(data);
    expect(existsSync(`${path}.tmp`)).toBe(false);
  });

  it('replaces the contents of an existing file', async () => {
    const path = join(dir, 'db.sqlite');
    writeFileSync(path, 'old contents that are longer');
    await atomicWriteFile(path, new Uint8Array([9, 8]));
    expect(new Uint8Array(readFileSync(path))).toEqual(new Uint8Array([9, 8]));
    expect(existsSync(`${path}.tmp`)).toBe(false);
  });
});
