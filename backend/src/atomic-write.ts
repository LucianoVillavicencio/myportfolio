import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';

interface Waiter {
  resolve: () => void;
  reject: (err: unknown) => void;
}

interface PathState {
  running: boolean;
  /** Newest payload not yet started, with everyone waiting on it. */
  pending: { data: Uint8Array; waiters: Waiter[] } | null;
}

/** Write state per target path, so writes to one file land in call order. */
const states = new Map<string, PathState>();

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

async function drain(path: string, state: PathState): Promise<void> {
  state.running = true;
  while (state.pending) {
    const batch = state.pending;
    state.pending = null;
    try {
      await write(path, batch.data);
      batch.waiters.forEach((w) => w.resolve());
    } catch (err) {
      // Only this batch fails; later writes are unaffected.
      batch.waiters.forEach((w) => w.reject(err));
    }
  }
  state.running = false;
  states.delete(path);
}

/**
 * Write to a unique temp file then rename over the target, so a crash mid-write
 * never leaves a truncated database behind. Writes to the same path are
 * serialised and coalesced: while one write is in flight, newer calls replace
 * the single queued payload (last write wins). A call resolves only once a
 * write containing its data, or newer data, has landed, and rejects if that
 * write fails.
 */
export function atomicWriteFile(
  path: string,
  data: Uint8Array,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let state = states.get(path);
    if (!state) {
      state = { running: false, pending: null };
      states.set(path, state);
    }
    if (state.pending) {
      state.pending.data = data;
      state.pending.waiters.push({ resolve, reject });
    } else {
      state.pending = { data, waiters: [{ resolve, reject }] };
    }
    if (!state.running) void drain(path, state);
  });
}
