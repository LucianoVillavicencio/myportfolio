import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { testDb } from '../../test/test-db';
import { SupportCard } from './support-card.entity';
import { CaseStory } from './case-story.entity';
import { SupportService } from './support.service';

describe('SupportService', () => {
  let moduleRef: TestingModule;
  let service: SupportService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([SupportCard, CaseStory])],
      providers: [SupportService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(SupportService);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('creates an empty disabled card on first read', async () => {
    const { card, stories } = await service.getAdmin();
    expect(card.enabled).toBe(false);
    expect(card.titleEs).toBe('');
    expect(card.areaEn).toBe('');
    expect(stories).toEqual([]);
  });

  it('public view hides a disabled card', async () => {
    await service.createStory({ titleEn: 'Fixed a LAN' });
    expect(await service.getPublic()).toEqual({ card: null, stories: [] });
  });

  it('public view returns card and ordered stories when enabled', async () => {
    await service.update({ enabled: true, titleEn: 'IT support' });
    await service.createStory({ titleEn: 'B', sortOrder: 2 });
    await service.createStory({ titleEn: 'A', sortOrder: 1 });
    const view = await service.getPublic();
    expect(view.card?.titleEn).toBe('IT support');
    expect(view.stories.map((s) => s.titleEn)).toEqual(['A', 'B']);
  });

  it('enabling requires a title in one language', async () => {
    await expect(service.update({ enabled: true })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const ok = await service.update({ enabled: true, titleEs: 'Soporte IT' });
    expect(ok.enabled).toBe(true);
    await expect(service.update({ titleEs: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('story requires a title in one language', async () => {
    await expect(service.createStory({ bodyEn: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const s = await service.createStory({ titleEs: 'Caso' });
    await expect(service.updateStory(s.id, { titleEs: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates and removes a story, unknown id is NotFound', async () => {
    const s = await service.createStory({ titleEn: 'A' });
    expect((await service.updateStory(s.id, { bodyEn: 'b' })).bodyEn).toBe('b');
    await service.removeStory(s.id);
    await expect(service.removeStory(s.id)).rejects.toThrow('not found');
  });
});
