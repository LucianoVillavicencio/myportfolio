import { Controller, Post, UseGuards, HttpCode } from '@nestjs/common';
import { AdminKeyGuard } from '../common/admin-key.guard';

@Controller('auth')
export class AuthController {
  @Post('verify')
  @HttpCode(200)
  @UseGuards(AdminKeyGuard)
  verifyKey() {
    return { valid: true };
  }
}
