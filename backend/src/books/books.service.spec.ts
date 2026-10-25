import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { testDb } from '../../test/test-db';
import { Book } from './book.entity';
import { Profile } from '../profile/profile.entity';
import { BooksService } from './books.service';
import { GoodreadsModule } from '../goodreads/goodreads.module';
import { GOODREADS_FETCH } from '../goodreads/goodreads.service';
import { GoodreadsSettings } from '../goodreads/goodreads-settings.entity';

describe('BooksService', () => {
  let moduleRef: TestingModule;
  let service: BooksService;
  let repo: Repository<Book>;
  let settingsRepo: Repository<GoodreadsSettings>;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [testDb(), TypeOrmModule.forFeature([Book, Profile]), GoodreadsModule],
      providers: [BooksService],
    })
      .overrideProvider(GOODREADS_FETCH)
      .useValue(jest.fn(async () => new Response('', { status: 200 })))
      .compile();
    await moduleRef.init();
    service = moduleRef.get(BooksService);
    repo = moduleRef.get(getRepositoryToken(Book));
    settingsRepo = moduleRef.get(getRepositoryToken(GoodreadsSettings));
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('locks only changed fields', async () => {
    const b = await repo.save(
      repo.create({ title: 'Dune', author: 'FH', goodreadsId: '1', rating: 4, thoughts: null }),
    );
    const saved = await service.update(b.id, {
      title: 'Dune',
      author: 'FH',
      rating: 4,
      thoughts: 'new',
      coverUrl: null,
    });
    expect(saved.lockedFields).toEqual(['thoughts']);
  });

  it('keeps existing locks and does not duplicate them', async () => {
    const b = await repo.save(
      repo.create({ title: 'Dune', author: 'FH', goodreadsId: '1', rating: 4, lockedFields: ['rating'] }),
    );
    const saved = await service.update(b.id, { rating: 5 });
    expect(saved.lockedFields).toEqual(['rating']);
  });

  it('completing a book stamps finishedAt', async () => {
    const b = await repo.save(repo.create({ title: 'Mine', author: 'Me', status: 'READING' }));
    const before = Date.now();
    const saved = await service.update(b.id, { status: 'COMPLETED' });
    expect(saved.finishedAt!.getTime()).toBeGreaterThanOrEqual(before);
    const created = await service.create({ title: 'New', author: 'A', status: 'COMPLETED' });
    expect(created.finishedAt).toBeInstanceOf(Date);
  });

  it('explicit finishedAt is kept', async () => {
    const b = await repo.save(repo.create({ title: 'Mine', author: 'Me', status: 'READING' }));
    const saved = await service.update(b.id, {
      status: 'COMPLETED',
      finishedAt: '2020-05-05T00:00:00.000Z',
    });
    expect(saved.finishedAt!.toISOString()).toBe('2020-05-05T00:00:00.000Z');
  });

  it('locks finishedAt only when its value changes on a goodreads book', async () => {
    const d = new Date('2021-01-01T00:00:00.000Z');
    const b = await repo.save(
      repo.create({ title: 'D', author: 'F', goodreadsId: '9', status: 'COMPLETED', finishedAt: d }),
    );
    let saved = await service.update(b.id, { finishedAt: d.toISOString() });
    expect(saved.lockedFields).toEqual([]);
    saved = await service.update(b.id, { finishedAt: '2021-02-02T00:00:00.000Z' });
    expect(saved.lockedFields).toEqual(['finishedAt']);
  });

  it('never locks hand-added books', async () => {
    const b = await repo.save(repo.create({ title: 'Mine', author: 'Me', rating: 1 }));
    const saved = await service.update(b.id, { rating: 5, title: 'Other' });
    expect(saved.lockedFields).toEqual([]);
  });

  it('dismisses goodreads books on delete', async () => {
    const gr = await repo.save(repo.create({ title: 'Dune', author: 'FH', goodreadsId: '1' }));
    await service.remove(gr.id);
    expect((await settingsRepo.findOneBy({ id: 1 }))?.dismissedIds).toEqual(['1']);
  });

  it('does not dismiss when deleting hand-added books', async () => {
    const b = await repo.save(repo.create({ title: 'Mine', author: 'Me' }));
    await service.remove(b.id);
    expect((await settingsRepo.findOneBy({ id: 1 }))?.dismissedIds ?? []).toEqual([]);
  });

  it('resetToGoodreads clears locks; rejects hand-added books', async () => {
    const gr = await repo.save(
      repo.create({ title: 'Dune', author: 'FH', goodreadsId: '1', lockedFields: ['rating'] }),
    );
    expect((await service.resetToGoodreads(gr.id)).lockedFields).toEqual([]);
    const manual = await repo.save(repo.create({ title: 'Mine', author: 'Me' }));
    await expect(service.resetToGoodreads(manual.id)).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.resetToGoodreads('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not change status based on pages', async () => {
    // currentPage is a legacy column; even a full one must not complete the book.
    const dto = { title: 'Short', author: 'Me', status: 'READING', totalPages: 10, currentPage: 10 };
    const saved = await service.create(dto as never);
    expect(saved.status).toBe('READING');
  });
});
