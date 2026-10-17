import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { CV_LANGS, CvLang, CvService } from './cv.service';

const MAX_CV_BYTES = 10 * 1024 * 1024;
const langPipe = new ParseEnumPipe(Object.fromEntries(CV_LANGS.map((l) => [l, l])));

@Controller('cv')
export class CvController {
  constructor(private readonly cvs: CvService) {}

  @Get()
  @UseGuards(AdminKeyGuard)
  status() {
    return this.cvs.status();
  }

  @Get(':lang')
  async download(
    @Param('lang', langPipe) lang: CvLang,
    @Res() res: Response,
  ): Promise<void> {
    const found = await this.cvs.resolve(lang);
    if (!found) throw new NotFoundException('CV not found');
    res.setHeader('Content-Disposition', `inline; filename="cv_${lang}.pdf"`);
    // Revalidate every time so a fresh upload shows up right away.
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(found.path);
  }

  @Put(':lang')
  @UseGuards(AdminKeyGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CV_BYTES } }))
  upload(
    @Param('lang', langPipe) lang: CvLang,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('Missing "file" field');
    return this.cvs.save(lang, file.buffer);
  }
}
