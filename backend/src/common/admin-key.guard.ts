import {
  CanActivate,
  ExecutionContext,
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

@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-admin-key'];

    if (typeof provided !== 'string' || !matches(provided)) {
      throw new UnauthorizedException('Invalid or missing admin key');
    }
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
