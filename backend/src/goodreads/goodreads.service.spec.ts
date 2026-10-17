import { Test } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { testDb } from '../../test/test-db';
import { Book } from '../books/book.entity';
import { GoodreadsSettings, GOODREADS_SETTINGS_ID } from './goodreads-settings.entity';
import { GoodreadsService, GOODREADS_FETCH } from './goodreads.service';

function rss(ids: string[]): string {
  const items = ids
    .map(
      (id) =>
        `<item><book_id>${id}</book_id><title>Book ${id}</title><author_name>Author ${id}</author_name><user_date_added>Mon, 05 Jan 2015 10:00:00 -0800</user_date_added></item>`,
    )
    .join('');
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>${items}</channel></rss>`;
}

describe('GoodreadsService', () => {
  let service: GoodreadsService;
  let books: Repository<Book>;
  let settings: Repository<GoodreadsSettings>;
  let fakeFetch: jest.Mock;
  let shelves: Record<string, string>;

  beforeEach(async () => {
    shelves = { read: rss(['1', '2']) };
    fakeFetch = jest.fn(async (url: string) => {
      const u = new URL(url);
      const shelf = u.searchParams.get('shelf') as string;
      const page = u.searchParams.get('page');
      const body = page === '1' ? (shelves[shelf] ?? rss([])) : rss([]);
      return new Response(body, { status: 200 });
    });
    const moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([Book, GoodreadsSettings])],
      providers: [GoodreadsService, { provide: GOODREADS_FETCH, useValue: fakeFetch }],
    }).compile();
    await moduleRef.init();
    service = moduleRef.get(GoodreadsService);
    books = moduleRef.get(getRepositoryToken(Book));
    settings = moduleRef.get(getRepositoryToken(GoodreadsSettings));
    // init triggers the catch-up on a fresh DB; it has no userId so it's a no-op
    fakeFetch.mockClear();
  });

  async function seed() {
    await service.setUserId('42');
    await books.save(
      books.create({ title: 'Old', author: 'A', goodreadsId: '9', lockedFields: [] }),
    );
    await books.save(books.create({ title: 'Manual', author: 'M' }));
  }

  it('setUserId accepts a profile URL and stores the id', async () => {
    expect(
      (await service.setUserId('https://www.goodreads.com/user/show/42-x')).userId,
    ).toBe('42');
    await expect(service.setUserId('nope')).rejects.toBeInstanceOf(BadRequestException);
    expect((await service.setUserId(null)).userId).toBeNull();
  });

  it('sync applies the plan and records the result', async () => {
    await seed();
    await expect(service.sync()).resolves.toEqual({ added: 2, updated: 0, removed: 1 });
    expect(await books.count()).toBe(3);
    const status = await service.getStatus();
    expect(status.lastSyncResult).toEqual({ ok: true, added: 2, updated: 0, removed: 1 });
    expect(status.lastSyncAt).toBeInstanceOf(Date);
    expect(status.isSyncing).toBe(false);
  });

  it("created books take the feed's date added as startedAt", async () => {
    await service.setUserId('42');
    await service.sync();
    const book = await books.findOneByOrFail({ goodreadsId: '1' });
    expect(book.startedAt.toISOString()).toBe('2015-01-05T18:00:00.000Z');
  });

  it('aborts without changes on fetch failure', async () => {
    await seed();
    const before = await books.count();
    fakeFetch.mockImplementation(
      async () => new Response('<html>Sign in</html>', { status: 200 }),
    );
    await expect(service.sync()).rejects.toBeInstanceOf(BadGatewayException);
    expect(await books.count()).toBe(before);
    expect((await service.getStatus()).lastSyncResult).toMatchObject({ ok: false });
  });

  it('rejects overlapping syncs', async () => {
    await seed();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    fakeFetch.mockImplementation(async () => {
      await gate;
      return new Response(rss([]), { status: 200 });
    });
    const first = service.sync();
    await expect(service.sync()).rejects.toBeInstanceOf(ConflictException);
    expect((await service.getStatus()).isSyncing).toBe(true);
    release();
    await expect(first).rejects.toBeInstanceOf(BadGatewayException); // empty feed vs goodreads book
    expect((await service.getStatus()).isSyncing).toBe(false);
  });

  it('dismissed books are not re-created', async () => {
    await service.setUserId('42');
    await service.dismiss('1');
    await service.sync();
    expect(await books.findOneBy({ goodreadsId: '1' })).toBeNull();
    expect(await books.findOneBy({ goodreadsId: '2' })).not.toBeNull();
  });

  it('sync without a user id is a bad request', async () => {
    await expect(service.sync()).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('catch-up on bootstrap', () => {
    async function bootstrapWithLastSync(msAgo: number) {
      await service.setUserId('42');
      await settings.update(GOODREADS_SETTINGS_ID, {
        lastSyncAt: new Date(Date.now() - msAgo),
      });
      fakeFetch.mockClear();
      service.onApplicationBootstrap();
      await new Promise((r) => setTimeout(r, 200));
    }

    it('does not sync when the last sync is recent', async () => {
      await bootstrapWithLastSync(60 * 60 * 1000);
      expect(fakeFetch).not.toHaveBeenCalled();
    });

    it('syncs when the last sync is stale', async () => {
      await bootstrapWithLastSync(25 * 60 * 60 * 1000);
      expect(fakeFetch).toHaveBeenCalled();
    });
  });
});
