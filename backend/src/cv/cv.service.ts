import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { atomicWriteFile } from '../atomic-write';
import { resolveCvDir, resolveStaticDir } from '../config';

export const CV_LANGS = ['es', 'en'] as const;
export type CvLang = (typeof CV_LANGS)[number];

export interface CvInfo {
  /** "upload" when replaced from the admin panel, "bundled" for the PDF shipped with the site. */
  source: 'upload' | 'bundled';
  size: number;
  updatedAt: string;
}

const PDF_MAGIC = Buffer.from('%PDF-');

@Injectable()
export class CvService {
  private readonly uploadDir = resolve(resolveCvDir(process.env));
  private readonly bundledDir = resolve(resolveStaticDir(process.env));

  /** Path of the PDF to serve: the uploaded one if present, else the bundled one. */
  async resolve(lang: CvLang): Promise<{ path: string; info: CvInfo } | null> {
    const candidates: [CvInfo['source'], string][] = [
      ['upload', join(this.uploadDir, `cv_${lang}.pdf`)],
      ['bundled', join(this.bundledDir, `cv_${lang}.pdf`)],
    ];
    for (const [source, path] of candidates) {
      const stat = await fs.stat(path).catch(() => null);
      if (stat?.isFile()) {
        return {
          path,
          info: { source, size: stat.size, updatedAt: stat.mtime.toISOString() },
        };
      }
    }
    return null;
  }

  async status(): Promise<Record<CvLang, CvInfo | null>> {
    const [es, en] = await Promise.all(
      CV_LANGS.map(async (lang) => (await this.resolve(lang))?.info ?? null),
    );
    return { es, en };
  }

  async save(lang: CvLang, data: Buffer): Promise<CvInfo> {
    if (!data.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      throw new BadRequestException('The file is not a PDF');
    }
    await fs.mkdir(this.uploadDir, { recursive: true });
    await atomicWriteFile(join(this.uploadDir, `cv_${lang}.pdf`), data);
    return (await this.resolve(lang))!.info;
  }
}
