import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
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

  it('serialises concurrent writes: all resolve, last call wins, no temp files', async () => {
    const path = join(dir, 'db.sqlite');
    const writes = Array.from({ length: 20 }, (_, i) =>
      atomicWriteFile(path, new Uint8Array([i, i, i])),
    );
    await Promise.all(writes);
    expect(new Uint8Array(readFileSync(path))).toEqual(new Uint8Array([19, 19, 19]));
    expect(readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('a failed write does not block later writes and leaves no temp file', async () => {
    const path = join(dir, 'missing-dir', 'db.sqlite');
    await expect(atomicWriteFile(path, new Uint8Array([1]))).rejects.toThrow();
    const ok = join(dir, 'db.sqlite');
    await atomicWriteFile(ok, new Uint8Array([2]));
    expect(new Uint8Array(readFileSync(ok))).toEqual(new Uint8Array([2]));
  });
});
