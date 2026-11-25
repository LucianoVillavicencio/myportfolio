import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { GoodreadsService } from './goodreads.service';
import { SetGoodreadsUserDto } from './goodreads.dto';

const MAX_CSV_BYTES = 10 * 1024 * 1024;

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

  @Post('import')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CSV_BYTES } }))
  importCsv(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Missing "file" field');
    return this.goodreads.importCsv(file.buffer.toString('utf8'));
  }
}
