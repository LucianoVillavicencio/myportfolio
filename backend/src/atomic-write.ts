import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

/** Last queued write per target path, so writes to one file land in call order. */
const queues = new Map<string, Promise<void>>();

async function write(path: string, data: Uint8Array): Promise<void> {
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, path);
  } catch (err) {
    await fs.unlink(tmp).catch(() => undefined);
    throw err;
  }
}

/**
 * Write to a unique temp file then rename over the target, so a crash mid-write
 * never leaves a truncated database behind. Writes to the same path are
 * serialised: concurrent calls never race and the last call wins.
 */
export function atomicWriteFile(
  path: string,
  data: Uint8Array,
): Promise<void> {
  const prev = queues.get(path) ?? Promise.resolve();
  // A failed earlier write must not poison later ones.
  const run = prev.catch(() => undefined).then(() => write(path, data));
  const tail = run.catch(() => undefined);
  queues.set(path, tail);
  void tail.then(() => {
    if (queues.get(path) === tail) queues.delete(path);
  });
  return run;
}
