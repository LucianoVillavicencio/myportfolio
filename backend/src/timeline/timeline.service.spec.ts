import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { testDb } from '../../test/test-db';
import { TimelineEntry } from './timeline-entry.entity';
import { TimelineService } from './timeline.service';

const base = { kind: 'work' as const, period: '2020', sortYear: 2020, titleEn: 'Job' };

describe('TimelineService', () => {
  let moduleRef: TestingModule;
  let service: TimelineService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([TimelineEntry])],
      providers: [TimelineService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(TimelineService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('lists entries by sortYear', async () => {
    await service.create({ ...base, titleEn: 'B', sortYear: 2022 });
    await service.create({ ...base, titleEn: 'A', sortYear: 2018 });
    await service.create({ ...base, titleEn: 'C', sortYear: 2022 });
    const list = await service.findAll();
    expect(list.map((e) => e.titleEn)).toEqual(['A', 'B', 'C']);
  });

  it('requires a title in one language', async () => {
    await expect(
      service.create({ ...base, titleEn: undefined }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const ok = await service.create({ ...base, titleEn: undefined, titleEs: 'Trabajo' });
    expect(ok.titleEs).toBe('Trabajo');
    await expect(service.update(ok.id, { titleEs: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('update/delete unknown id throws NotFound', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    await expect(service.update(id, { period: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates and removes an entry', async () => {
    const e = await service.create(base);
    const u = await service.update(e.id, { period: '2021' });
    expect(u.period).toBe('2021');
    await service.remove(e.id);
    expect(await service.findAll()).toHaveLength(0);
  });
});
