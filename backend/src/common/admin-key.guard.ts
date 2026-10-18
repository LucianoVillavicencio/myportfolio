import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

const DEV_FALLBACK_KEY = 'secret-admin-key';
let cachedKey: Buffer | undefined;

export function expectedKey(): Buffer {
  if (cachedKey) return cachedKey;
  let key = process.env.ADMIN_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_API_KEY must be set in production');
    }
    new Logger('AdminKeyGuard').warn(
      `ADMIN_API_KEY is not set; falling back to the development key "${DEV_FALLBACK_KEY}"`,
    );
    key = DEV_FALLBACK_KEY;
  }
  cachedKey = Buffer.from(key);
  return cachedKey;
}

// Wrong keys on any guarded route count toward a per-IP lockout, so guessing
// can't sidestep the stricter limit on /auth/verify by hitting other endpoints.
export const MAX_FAILED_ATTEMPTS = 10;
export const LOCKOUT_WINDOW_MS = 15 * 60_000;
const failures = new Map<string, { count: number; resetAt: number }>();

/** Test hook: forget all recorded failures. */
export function resetFailedAttempts(): void {
  failures.clear();
}

function isLockedOut(ip: string, now: number): boolean {
  const entry = failures.get(ip);
  if (entry && entry.resetAt <= now) failures.delete(ip);
  return (failures.get(ip)?.count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(ip: string, now: number): void {
  const entry = failures.get(ip);
  if (entry) {
    entry.count++;
    return;
  }
  // Keep the map bounded if many distinct IPs fail.
  if (failures.size >= 10_000) {
    for (const [key, value] of failures) {
      if (value.resetAt <= now) failures.delete(key);
    }
  }
  failures.set(ip, { count: 1, resetAt: now + LOCKOUT_WINDOW_MS });
}

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-admin-key'];
    const ip: string = request.ip ?? 'unknown';
    const now = Date.now();

    if (isLockedOut(ip, now)) {
      throw new HttpException(
        'Too many failed admin key attempts; try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (typeof provided !== 'string' || !matches(provided)) {
      // A missing key is just an anonymous request, not a guess.
      if (provided !== undefined) recordFailure(ip, now);
      throw new UnauthorizedException('Invalid or missing admin key');
    }
    failures.delete(ip);
    return true;
  }
}

function matches(provided: string): boolean {
  const expected = expectedKey();
  const candidate = Buffer.from(provided);
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}
