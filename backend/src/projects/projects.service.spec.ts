import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { existsSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { testDb } from '../../test/test-db';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';
import { MediaModule } from '../media/media.module';
import { MediaService } from '../media/media.service';

const base = { title: 'FLG Gym', summaryEn: 's', techStack: [] as string[] };

describe('ProjectsService', () => {
  let moduleRef: TestingModule;
  let service: ProjectsService;
  let repo: Repository<Project>;
  let media: MediaService;

  beforeEach(async () => {
    process.env.MEDIA_DIR = mkdtempSync(join(tmpdir(), 'projmedia-'));
    moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([Project]), MediaModule],
      providers: [ProjectsService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(ProjectsService);
    repo = moduleRef.get(getRepositoryToken(Project));
    media = moduleRef.get(MediaService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('generates a slug from the title', async () => {
    const p = await service.create({ ...base, title: 'Gestión FLG Gym' });
    expect(p.slug).toBe('gestion-flg-gym');
  });

  it('dedupes slugs', async () => {
    const a = await service.create(base);
    const b = await service.create(base);
    expect(a.slug).toBe('flg-gym');
    expect(b.slug).toBe('flg-gym-2');
  });

  it('keeps an explicit slug', async () => {
    const p = await service.create({ ...base, slug: 'custom' });
    expect(p.slug).toBe('custom');
  });

  it('rejects a taken explicit slug', async () => {
    await service.create({ ...base, slug: 'custom' });
    await expect(service.create({ ...base, title: 'Other', slug: 'custom' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('keeps the slug on update unless one is sent', async () => {
    const p = await service.create(base);
    const u = await service.update(p.id, { title: 'Renamed' });
    expect(u.slug).toBe('flg-gym');
    const k = await service.update(p.id, { slug: null as unknown as undefined });
    expect(k.slug).toBe('flg-gym');
    const c = await service.update(p.id, { slug: 'changed' });
    expect(c.slug).toBe('changed');
  });

  it('findBySlug returns the project / throws NotFound', async () => {
    const p = await service.create(base);
    expect((await service.findBySlug('flg-gym')).id).toBe(p.id);
    await expect(service.findBySlug('nope')).rejects.toThrow(NotFoundException);
  });

  it('backfills slugs for projects without one', async () => {
    const a = await repo.save(repo.create({ ...base, slug: null }));
    const b = await repo.save(repo.create({ ...base, slug: null }));
    await service.onModuleInit();
    expect((await repo.findOneByOrFail({ id: a.id })).slug).toBe('flg-gym');
    expect((await repo.findOneByOrFail({ id: b.id })).slug).toBe('flg-gym-2');
  });

  it('deletes media dropped from images', async () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(8),
    ]);
    const { url } = await media.save(png);
    const file = join(media.dir, url.slice('/api/media/'.length));
    const p = await service.create({ ...base, images: [url] });
    expect(existsSync(file)).toBe(true);
    await service.update(p.id, { images: [] });
    expect(existsSync(file)).toBe(false);
  });

  it('deletes all media when the project is removed', async () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(8),
    ]);
    const { url } = await media.save(png);
    const file = join(media.dir, url.slice('/api/media/'.length));
    const p = await service.create({ ...base, images: [url] });
    await service.remove(p.id);
    expect(existsSync(file)).toBe(false);
  });
});
