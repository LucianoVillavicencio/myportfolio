import { Controller, Post, UseGuards, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('auth')
export class AuthController {
  @Post('verify')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @UseGuards(AdminKeyGuard)
  verifyKey() {
    return { valid: true };
  }
}
