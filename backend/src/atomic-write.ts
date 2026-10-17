import { promises as fs } from 'fs';

/**
 * Write to a temp file then rename over the target, so a crash mid-write
 * never leaves a truncated database behind.
 */
export async function atomicWriteFile(
  path: string,
  data: Uint8Array,
): Promise<void> {
  const tmp = `${path}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, path);
}
