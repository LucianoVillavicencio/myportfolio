import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { atomicWriteFile } from '../atomic-write';
import { resolveMediaDir } from '../config';

export const MEDIA_FILE_RE = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;
const URL_PREFIX = '/api/media/';

function detectExt(data: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'jpg';
  }
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString('latin1') === 'RIFF' &&
    data.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

@Injectable()
export class MediaService {
  readonly dir = resolve(resolveMediaDir(process.env));

  async save(data: Buffer): Promise<{ url: string }> {
    const ext = detectExt(data);
    if (!ext) throw new BadRequestException('The file must be a PNG, JPEG or WebP image');
    await fs.mkdir(this.dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await atomicWriteFile(join(this.dir, name), data);
    return { url: `${URL_PREFIX}${name}` };
  }

  /** Deletes the files behind media URLs; anything else is ignored. */
  async deleteByUrls(urls: string[]): Promise<void> {
    for (const url of urls) {
      if (typeof url !== 'string' || !url.startsWith(URL_PREFIX)) continue;
      const name = url.slice(URL_PREFIX.length);
      if (!MEDIA_FILE_RE.test(name)) continue;
      await fs.rm(join(this.dir, name), { force: true }).catch(() => undefined);
    }
  }
}
