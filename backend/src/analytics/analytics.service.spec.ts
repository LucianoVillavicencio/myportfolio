import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { testDb } from '../../test/test-db';
import { AnalyticsDaily } from './analytics-daily.entity';
import { AnalyticsService, isBot } from './analytics.service';

const d = (s: string) => new Date(`${s}T12:00:00Z`);

describe('AnalyticsService', () => {
  let moduleRef: TestingModule;
  let service: AnalyticsService;
  let repo: Repository<AnalyticsDaily>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([AnalyticsDaily])],
      providers: [AnalyticsService],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(AnalyticsService);
    repo = moduleRef.get(getRepositoryToken(AnalyticsDaily));
  });

  afterEach(async () => {
    jest.useRealTimers();
    await moduleRef.close();
  });

  it('record increments the same day/type/key', async () => {
    await service.record('view', '/', d('2026-10-18'));
    await service.record('view', '/', d('2026-10-18'));
    await service.record('view', '/other', d('2026-10-18'));
    const rows = await repo.find({ order: { key: 'ASC' } });
    expect(rows).toEqual([
      { day: '2026-10-18', type: 'view', key: '/', count: 2 },
      { day: '2026-10-18', type: 'view', key: '/other', count: 1 },
    ]);
  });

  it('record survives concurrent first events', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () => service.record('cv', 'es', d('2026-10-18'))),
    );
    expect((await repo.findOneByOrFail({ type: 'cv', key: 'es' })).count).toBe(5);
  });

  it('summary zero-fills days and ranks top keys', async () => {
    jest.useFakeTimers({
      now: d('2026-10-18'),
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval'],
    });
    await service.record('view', '/b', d('2026-10-16'));
    await service.record('view', '/a', d('2026-10-16'));
    await service.record('view', '/a', d('2026-10-18'));
    await service.record('view', '/a', d('2026-10-18'));
    await service.record('cv', 'en', d('2026-10-17'));
    await service.record('view', '/old', d('2026-09-01'));
    const s = await service.summary(4);
    expect(s.daily).toEqual([
      { day: '2026-10-15', views: 0 },
      { day: '2026-10-16', views: 2 },
      { day: '2026-10-17', views: 0 },
      { day: '2026-10-18', views: 2 },
    ]);
    expect(s.totals).toEqual({ view: 4, cv: 1, outbound: 0, contact: 0 });
    expect(s.top.filter((t) => t.type === 'view')).toEqual([
      { type: 'view', key: '/a', count: 3 },
      { type: 'view', key: '/b', count: 1 },
    ]);
    expect(s.top.filter((t) => t.type === 'cv')).toEqual([
      { type: 'cv', key: 'en', count: 1 },
    ]);
  });

  it('prune drops rows older than 365 days', async () => {
    const now = Date.now();
    const old = new Date(now - 400 * 86_400_000);
    const recent = new Date(now - 10 * 86_400_000);
    await service.record('view', '/', old);
    await service.record('view', '/', recent);
    await service.prune();
    const rows = await repo.find();
    expect(rows).toHaveLength(1);
    expect(rows[0].day).toBe(recent.toISOString().slice(0, 10));
  });
});

describe('isBot', () => {
  it('detects bots and accepts browsers', () => {
    expect(
      isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'),
    ).toBe(true);
    expect(isBot('WhatsApp/2.23.20.0')).toBe(true);
    expect(isBot('')).toBe(true);
    expect(isBot(undefined)).toBe(true);
    expect(
      isBot(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ),
    ).toBe(false);
  });
});
