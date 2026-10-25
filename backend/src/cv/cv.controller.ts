import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Logger,
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
import { AnalyticsService, isBot } from '../analytics/analytics.service';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { CV_LANGS, CvLang, CvService } from './cv.service';

const MAX_CV_BYTES = 10 * 1024 * 1024;
const langPipe = new ParseEnumPipe(Object.fromEntries(CV_LANGS.map((l) => [l, l])));

@Controller('cv')
export class CvController {
  private readonly logger = new Logger(CvController.name);

  constructor(
    private readonly cvs: CvService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get()
  @UseGuards(AdminKeyGuard)
  status() {
    return this.cvs.status();
  }

  @Get(':lang')
  async download(
    @Param('lang', langPipe) lang: CvLang,
    @Res() res: Response,
    @Headers('user-agent') userAgent?: string,
  ): Promise<void> {
    const found = await this.cvs.resolve(lang);
    if (!found) throw new NotFoundException('CV not found');
    if (!isBot(userAgent)) {
      try {
        await this.analytics.record('cv', lang);
      } catch (err) {
        this.logger.error(`analytics failed: ${(err as Error).message}`);
      }
    }
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
