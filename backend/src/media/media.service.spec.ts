import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([1, 2, 3, 4]),
  Buffer.from('WEBP'),
]);

describe('MediaService', () => {
  const dir = mkdtempSync(join(tmpdir(), 'portfolio-media-spec-'));
  let service: import('./media.service').MediaService;

  beforeAll(async () => {
    process.env.MEDIA_DIR = dir;
    const { MediaService } = await import('./media.service');
    service = new MediaService();
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const fileOf = (url: string) => join(service.dir, url.split('/').pop()!);

  it('saves a png and returns its url', async () => {
    const { url } = await service.save(PNG);
    expect(url).toMatch(/^\/api\/media\/[0-9a-f-]{36}\.png$/);
    expect(existsSync(fileOf(url))).toBe(true);
  });

  it('detects jpeg and webp', async () => {
    expect((await service.save(JPG)).url).toMatch(/\.jpg$/);
    expect((await service.save(WEBP)).url).toMatch(/\.webp$/);
  });

  it('rejects non-images', async () => {
    await expect(service.save(Buffer.from('<svg xmlns="x"></svg>'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.save(Buffer.from('<html>'))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deleteByUrls removes only media files', async () => {
    const a = await service.save(PNG);
    const b = await service.save(PNG);
    await expect(
      service.deleteByUrls([a.url, 'https://x/y.png', '/api/media/../../portfolio.sqlite']),
    ).resolves.toBeUndefined();
    expect(existsSync(fileOf(a.url))).toBe(false);
    expect(existsSync(fileOf(b.url))).toBe(true);
  });
});
