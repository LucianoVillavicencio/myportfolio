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

function widget(ids: string[]): string {
  const items = ids
    .map(
      (id) =>
        `<div class="gr_custom_each_container_">` +
        `<div class="gr_custom_book_container_"><a title="Book ${id}" href="https://www.goodreads.com/review/show/${id}"><img src="https://i.gr-assets.com/books/1l/${id}._SY75_.jpg" /></a></div>` +
        `<div class="gr_custom_title_"><a href="https://www.goodreads.com/review/show/${id}">Book ${id}</a></div>` +
        `<div class="gr_custom_author_">by <a href="/a">Author ${id}</a></div>` +
        `</div>`,
    )
    .join('');
  const escaped = `<div class="gr_custom_container_">${items}</div>`
    .replace(/"/g, '\\"')
    .replace(/\//g, '\\/');
  return `var widget_code = '${escaped}'`;
}

describe('GoodreadsService', () => {
  let service: GoodreadsService;
  let books: Repository<Book>;
  let settings: Repository<GoodreadsSettings>;
  let fakeFetch: jest.Mock;
  let shelves: Record<string, string>;

  beforeEach(async () => {
    shelves = { read: widget(['1', '2']) };
    fakeFetch = jest.fn(async (url: string) => {
      const u = new URL(url);
      const shelf = u.searchParams.get('shelf') as string;
      const body = shelves[shelf] ?? widget([]);
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

  it('importCsv syncs books without requiring a userId and records dateAdded/readAt', async () => {
    const csv = [
      'Book Id,Title,Author,My Rating,Number of Pages,Date Read,Date Added,Exclusive Shelf,My Review',
      '1,Book 1,Author 1,5,400,2015/02/10,2015/01/05,read,Great book',
      '2,Book 2,Author 2,0,300,,2015/01/06,currently-reading,',
    ].join('\n');
    await expect(service.importCsv(csv)).resolves.toEqual({
      added: 2,
      updated: 0,
      removed: 0,
    });
    const book = await books.findOneByOrFail({ goodreadsId: '1' });
    expect(book.startedAt.toISOString()).toBe('2015-01-05T00:00:00.000Z');
    expect(book.finishedAt?.toISOString()).toBe('2015-02-10T00:00:00.000Z');
    expect(book.totalPages).toBe(400);
    expect((await service.getStatus()).lastSyncResult).toEqual({
      ok: true,
      added: 2,
      updated: 0,
      removed: 0,
    });
  });

  it('importCsv rejects invalid CSVs with BadRequestException', async () => {
    await expect(service.importCsv('not,a,goodreads,csv')).rejects.toBeInstanceOf(
      BadRequestException,
    );
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
      return new Response(widget([]), { status: 200 });
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

  it('keeps a dismissal and user id changed while a sync is running', async () => {
    await service.setUserId('42');
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    fakeFetch.mockImplementation(async (url: string) => {
      await gate;
      const u = new URL(url);
      const body =
        u.searchParams.get('shelf') === 'read' ? widget(['1', '2']) : widget([]);
      return new Response(body, { status: 200 });
    });
    const running = service.sync();
    await new Promise((r) => setTimeout(r, 20));
    await service.dismiss('1');
    await service.setUserId('77');
    release();
    await running;
    expect(await books.findOneBy({ goodreadsId: '1' })).toBeNull();
    expect(await books.findOneBy({ goodreadsId: '2' })).not.toBeNull();
    const status = await service.getStatus();
    expect(status.userId).toBe('77');
    expect(status.lastSyncResult).toMatchObject({ ok: true });
  });

  it('scheduledSync is a silent no-op without a user id', async () => {
    const warn = jest.spyOn((service as any).logger, 'warn');
    await service.scheduledSync();
    expect(warn).not.toHaveBeenCalled();
    expect(fakeFetch).not.toHaveBeenCalled();
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
