import { dirname, join } from 'path';

export function resolveDbPath(env: NodeJS.ProcessEnv): string {
  if (env.DB_PATH) return env.DB_PATH;
  if (env.NODE_ENV === 'production') {
    throw new Error('DB_PATH must be set in production');
  }
  // Resolve relative to the backend folder so the DB doesn't depend on the CWD
  return join(__dirname, '..', 'portfolio.sqlite');
}

export function resolveStaticDir(env: NodeJS.ProcessEnv): string {
  return env.STATIC_DIR || join(__dirname, '..', '..', 'frontend', 'dist');
}

/** Uploaded CVs live next to the database, so they share its volume. */
export function resolveCvDir(env: NodeJS.ProcessEnv): string {
  return env.CV_DIR || join(dirname(resolveDbPath(env)), 'cv');
}

/** Uploaded images live next to the database, so they share its volume. */
export function resolveMediaDir(env: NodeJS.ProcessEnv): string {
  return env.MEDIA_DIR || join(dirname(resolveDbPath(env)), 'media');
}
