import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import {
  GOODREADS_SETTINGS_ID,
  GoodreadsSettings,
  SyncStatus,
} from './goodreads-settings.entity';
import { extractGoodreadsUserId, GoodreadsFeedError } from './goodreads-feed';
import { FetchFn, fetchGoodreadsLibrary } from './goodreads-client';
import { EmptyFeedError, planSync, SyncResult } from './sync-plan';

export const GOODREADS_FETCH = Symbol('GOODREADS_FETCH');

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export interface GoodreadsStatus {
  userId: string | null;
  lastSyncAt: Date | null;
  lastSyncResult: SyncStatus | null;
  isSyncing: boolean;
}

@Injectable()
export class GoodreadsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(GoodreadsService.name);
  private isSyncing = false;

  constructor(
    @InjectRepository(GoodreadsSettings)
    private readonly settingsRepo: Repository<GoodreadsSettings>,
    private readonly dataSource: DataSource,
    @Inject(GOODREADS_FETCH) private readonly fetchFn: FetchFn,
  ) {}

  private async loadSettings(): Promise<GoodreadsSettings> {
    const existing = await this.settingsRepo.findOneBy({ id: GOODREADS_SETTINGS_ID });
    if (existing) return existing;
    return this.settingsRepo.save(
      this.settingsRepo.create({
        id: GOODREADS_SETTINGS_ID,
        userId: null,
        lastSyncAt: null,
        lastSyncResult: null,
        dismissedIds: [],
      }),
    );
  }

  private toStatus(s: GoodreadsSettings): GoodreadsStatus {
    return {
      userId: s.userId,
      lastSyncAt: s.lastSyncAt,
      lastSyncResult: s.lastSyncResult,
      isSyncing: this.isSyncing,
    };
  }

  async getStatus(): Promise<GoodreadsStatus> {
    return this.toStatus(await this.loadSettings());
  }

  async setUserId(input: string | null): Promise<GoodreadsStatus> {
    const settings = await this.loadSettings();
    if (input === null) {
      settings.userId = null;
    } else {
      const userId = extractGoodreadsUserId(input);
      if (!userId) {
        throw new BadRequestException(
          'Enter a Goodreads profile URL or numeric user id',
        );
      }
      settings.userId = userId;
    }
    return this.toStatus(await this.settingsRepo.save(settings));
  }

  async dismiss(goodreadsId: string): Promise<void> {
    const settings = await this.loadSettings();
    if (settings.dismissedIds.includes(goodreadsId)) return;
    settings.dismissedIds = [...settings.dismissedIds, goodreadsId];
    await this.settingsRepo.save(settings);
  }

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) throw new ConflictException('A sync is already running');
    this.isSyncing = true;
    try {
      const settings = await this.loadSettings();
      if (!settings.userId) {
        throw new BadRequestException('Set a Goodreads user first');
      }
      try {
        const result = await this.runSync(settings);
        await this.record({ ok: true, ...result });
        return result;
      } catch (err) {
        const message = (err as Error).message;
        await this.record({ ok: false, error: message });
        if (err instanceof GoodreadsFeedError || err instanceof EmptyFeedError) {
          throw new BadGatewayException(message);
        }
        throw err;
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async runSync(settings: GoodreadsSettings): Promise<SyncResult> {
    const feed = await fetchGoodreadsLibrary(settings.userId as string, this.fetchFn);
    return this.dataSource.transaction(async (manager) => {
      const bookRepo = manager.getRepository(Book);
      // Re-read dismissals: one may have been added while the feed was fetching.
      const fresh = await manager
        .getRepository(GoodreadsSettings)
        .findOneBy({ id: GOODREADS_SETTINGS_ID });
      const plan = planSync(
        feed,
        await bookRepo.find(),
        fresh?.dismissedIds ?? settings.dismissedIds,
      );

      for (const data of plan.create) {
        await bookRepo.save(bookRepo.create(data));
      }
      for (const { id, changes } of plan.update) {
        const book = await bookRepo.findOneByOrFail({ id });
        await bookRepo.save(Object.assign(book, changes));
      }
      if (plan.remove.length > 0) await bookRepo.delete(plan.remove);

      return {
        added: plan.create.length,
        updated: plan.update.length,
        removed: plan.remove.length,
      };
    });
  }

  private async record(result: SyncStatus) {
    await this.loadSettings(); // ensure the row exists
    await this.settingsRepo.update(GOODREADS_SETTINGS_ID, {
      lastSyncAt: new Date(),
      lastSyncResult: result,
    });
  }

  @Cron('0 4 * * *')
  async scheduledSync(): Promise<void> {
    if (!(await this.loadSettings()).userId) return;
    try {
      const result = await this.sync();
      this.logger.log(`Scheduled Goodreads sync: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.warn(`Scheduled Goodreads sync failed: ${(err as Error).message}`);
    }
  }

  /** Catch up on a missed 04:00 run (e.g. the server was off) without blocking startup. */
  onApplicationBootstrap(): void {
    setImmediate(() => {
      void this.catchUp().catch((err) =>
        this.logger.warn(`Goodreads catch-up failed: ${(err as Error).message}`),
      );
    });
  }

  private async catchUp(): Promise<void> {
    const settings = await this.loadSettings();
    if (!settings.userId) return;
    const stale =
      !settings.lastSyncAt ||
      Date.now() - new Date(settings.lastSyncAt).getTime() > STALE_AFTER_MS;
    if (stale) await this.scheduledSync();
  }
}
