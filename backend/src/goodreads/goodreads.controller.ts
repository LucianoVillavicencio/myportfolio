import { Body, Controller, Get, HttpCode, Post, Put, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { GoodreadsService } from './goodreads.service';
import { SetGoodreadsUserDto } from './goodreads.dto';

@Controller('goodreads')
@UseGuards(AdminKeyGuard)
export class GoodreadsController {
  constructor(private readonly goodreads: GoodreadsService) {}

  @Get()
  status() {
    return this.goodreads.getStatus();
  }

  @Put()
  setUser(@Body() dto: SetGoodreadsUserDto) {
    return this.goodreads.setUserId(dto.userId ?? null);
  }

  @Post('sync')
  @HttpCode(200)
  sync() {
    return this.goodreads.sync();
  }
}
