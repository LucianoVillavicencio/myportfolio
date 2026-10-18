import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AnalyticsDaily, EVENT_TYPES, EventType } from './analytics-daily.entity';

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i;
const RETENTION_DAYS = 365;
const TOP_PER_TYPE = 10;
const DAY_MS = 86_400_000;

export function isBot(userAgent: string | undefined): boolean {
  return !userAgent || BOT_RE.test(userAgent);
}

const dayOf = (date: Date) => date.toISOString().slice(0, 10);

export interface AnalyticsSummary {
  totals: Record<EventType, number>;
  daily: { day: string; views: number }[];
  top: { type: EventType; key: string; count: number }[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsDaily)
    private readonly repo: Repository<AnalyticsDaily>,
  ) {}

  async record(type: EventType, key: string, at: Date = new Date()): Promise<void> {
    const where = { day: dayOf(at), type, key };
    const bump = async () => (await this.repo.increment(where, 'count', 1)).affected ?? 0;
    if (await bump()) return;
    try {
      await this.repo.insert({ ...where, count: 1 });
    } catch (err) {
      // A concurrent first event inserted the row; count ours on top of it.
      if (!(await bump())) throw err;
    }
  }

  async summary(days: number): Promise<AnalyticsSummary> {
    const now = Date.now();
    const dayList = Array.from({ length: days }, (_, i) =>
      dayOf(new Date(now - (days - 1 - i) * DAY_MS)),
    );
    const rows = await this.repo
      .createQueryBuilder('a')
      .where('a.day >= :from', { from: dayList[0] })
      .getMany();

    const totals = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])) as Record<
      EventType,
      number
    >;
    const views = new Map<string, number>();
    const perKey = new Map<string, { type: EventType; key: string; count: number }>();
    for (const r of rows) {
      totals[r.type] += r.count;
      if (r.type === 'view') views.set(r.day, (views.get(r.day) ?? 0) + r.count);
      const id = `${r.type}|${r.key}`;
      const cur = perKey.get(id) ?? { type: r.type, key: r.key, count: 0 };
      cur.count += r.count;
      perKey.set(id, cur);
    }

    const top = EVENT_TYPES.flatMap((t) =>
      [...perKey.values()]
        .filter((e) => e.type === t)
        .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
        .slice(0, TOP_PER_TYPE),
    );
    return {
      totals,
      daily: dayList.map((day) => ({ day, views: views.get(day) ?? 0 })),
      top,
    };
  }

  @Cron('0 4 * * *')
  async prune(): Promise<void> {
    const cutoff = dayOf(new Date(Date.now() - RETENTION_DAYS * DAY_MS));
    try {
      await this.repo.delete({ day: LessThan(cutoff) });
    } catch (err) {
      this.logger.error(`prune failed: ${(err as Error).message}`);
    }
  }
}
