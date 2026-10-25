import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { MEDIA_FILE_RE, MediaService } from './media.service';

const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseGuards(AdminKeyGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_MEDIA_BYTES } }))
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Missing "file" field');
    return this.media.save(file.buffer);
  }

  @Get(':file')
  serve(@Param('file') file: string, @Res() res: Response): void {
    if (!MEDIA_FILE_RE.test(file)) throw new NotFoundException('Not found');
    // File names are random UUIDs, so the content behind one never changes.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(join(this.media.dir, file), (err) => {
      if (err && !res.headersSent) res.status(404).json({ statusCode: 404, message: 'Not found' });
    });
  }
}
