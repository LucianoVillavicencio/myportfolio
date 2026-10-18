import { Book } from '../books/book.entity';
import { GoodreadsItem } from './goodreads-feed';
import { EmptyFeedError, planSync } from './sync-plan';

function item(overrides: Partial<GoodreadsItem> = {}): GoodreadsItem {
  return {
    goodreadsId: '1',
    title: 'Title',
    author: 'Author',
    coverUrl: null,
    status: 'READING',
    rating: null,
    thoughts: null,
    totalPages: null,
    dateAdded: null,
    readAt: null,
    ...overrides,
  };
}

function book(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b',
    title: 'Title',
    author: 'Author',
    coverUrl: null,
    status: 'READING',
    currentPage: 0,
    totalPages: 300,
    rating: null,
    thoughts: null,
    goodreadsId: null,
    lockedFields: [],
    finishedAt: null,
    startedAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('planSync', () => {
  it('creates new feed books', () => {
    const plan = planSync([item({ goodreadsId: '1', title: 'Dune' })], [], []);
    expect(plan.create).toEqual([
      expect.objectContaining({ goodreadsId: '1', title: 'Dune', lockedFields: [] }),
    ]);
  });

  it('sets startedAt from dateAdded only when present', () => {
    const d = new Date('2023-05-05');
    const plan = planSync(
      [item({ goodreadsId: '1', dateAdded: d }), item({ goodreadsId: '2' })],
      [],
      [],
    );
    expect(plan.create[0].startedAt).toBe(d);
    expect(plan.create[1]).not.toHaveProperty('startedAt');
  });

  it('maps readAt to finishedAt, compares by value and respects locks', () => {
    const d = new Date('2023-05-05T00:00:00Z');
    expect(planSync([item({ readAt: d })], [], []).create[0].finishedAt).toBe(d);
    const same = book({ id: 'a', goodreadsId: '1', finishedAt: new Date(d.getTime()) });
    expect(planSync([item({ readAt: d })], [same], []).update).toEqual([]);
    const other = book({ id: 'a', goodreadsId: '1', finishedAt: new Date('2020-01-01') });
    expect(planSync([item({ readAt: d })], [other], []).update).toEqual([
      { id: 'a', changes: { finishedAt: d } },
    ]);
    const locked = book({ id: 'a', goodreadsId: '1', finishedAt: new Date('2020-01-01'), lockedFields: ['finishedAt'] });
    expect(planSync([item({ readAt: d })], [locked], []).update).toEqual([]);
    expect(planSync([item()], [other], []).update).toEqual([]);
  });

  it('updates changed unlocked fields only', () => {
    const b = book({ id: 'a', goodreadsId: '1', status: 'READING', rating: 3, lockedFields: ['rating'] });
    const plan = planSync([item({ goodreadsId: '1', status: 'COMPLETED', rating: 5 })], [b], []);
    expect(plan.update).toEqual([{ id: 'a', changes: { status: 'COMPLETED' } }]);
  });

  it('emits no update when nothing changed', () => {
    const b = book({ id: 'a', goodreadsId: '1', totalPages: 300 });
    const plan = planSync([item({ goodreadsId: '1', totalPages: 300 })], [b], []);
    expect(plan.update).toEqual([]);
  });

  it('keeps totalPages when feed has none', () => {
    const b = book({ id: 'a', goodreadsId: '1', totalPages: 320 });
    const plan = planSync([item({ goodreadsId: '1', totalPages: null })], [b], []);
    expect(plan.update).toEqual([]);
  });

  it('removes goodreads books missing from the feed, even with locks', () => {
    const gone = book({ id: 'g', goodreadsId: '9', lockedFields: ['thoughts'] });
    const manual = book({ id: 'm' });
    expect(planSync([item({ goodreadsId: '1' })], [gone, manual], []).remove).toEqual(['g']);
  });

  it('never touches hand-added books that do not match', () => {
    const manual = book({ id: 'm', title: 'Other', author: 'Someone' });
    const plan = planSync([item({ goodreadsId: '1' })], [manual], []);
    expect(plan.update).toEqual([]);
    expect(plan.remove).toEqual([]);
  });

  it('adopts a hand-added book with the same title and author, locking differing fields', () => {
    const manual = book({ id: 'm', title: 'Dune', author: 'frank  herbert', thoughts: 'mine', rating: 4 });
    const plan = planSync(
      [item({ goodreadsId: '1', title: 'Dune (Dune, #1)', author: 'Frank Herbert', thoughts: 'theirs', rating: 4 })],
      [manual],
      [],
    );
    expect(plan.create).toEqual([]);
    expect(plan.update[0].id).toBe('m');
    expect(plan.update[0].changes).toMatchObject({ goodreadsId: '1' });
    expect(plan.update[0].changes.lockedFields).toEqual(expect.arrayContaining(['title', 'thoughts']));
    expect(plan.update[0].changes.lockedFields).not.toContain('rating');
  });

  it('adopting a book with no finish date takes the feed read date instead of locking it', () => {
    const readAt = new Date('2024-06-01');
    const manual = book({ id: 'm', title: 'Dune', author: 'A', status: 'READ', finishedAt: null });
    const plan = planSync(
      [item({ goodreadsId: '1', title: 'Dune', author: 'A', status: 'READ', readAt })],
      [manual],
      [],
    );
    expect(plan.update[0].changes).toMatchObject({ goodreadsId: '1', finishedAt: readAt });
    expect(plan.update[0].changes.lockedFields).not.toContain('finishedAt');
  });

  it('adopting keeps a hand-set finish date locked when it differs from the feed', () => {
    const manual = book({ id: 'm', title: 'Dune', author: 'A', status: 'READ', finishedAt: new Date('2024-01-02') });
    const plan = planSync(
      [item({ goodreadsId: '1', title: 'Dune', author: 'A', status: 'READ', readAt: new Date('2024-06-01') })],
      [manual],
      [],
    );
    expect(plan.update[0].changes.lockedFields).toContain('finishedAt');
    expect(plan.update[0].changes.finishedAt).toBeUndefined();
  });

  it('adopts each hand-added book at most once', () => {
    const manual = book({ id: 'm', title: 'Dune', author: 'A' });
    const plan = planSync(
      [item({ goodreadsId: '1', title: 'Dune', author: 'A' }), item({ goodreadsId: '2', title: 'Dune', author: 'A' })],
      [manual],
      [],
    );
    expect(plan.update.map((u) => u.id)).toEqual(['m']);
    expect(plan.create).toHaveLength(1);
    expect(plan.create[0].goodreadsId).toBe('2');
  });

  it('skips dismissed ids', () => {
    const plan = planSync([item({ goodreadsId: '5' })], [], ['5']);
    expect(plan.create).toEqual([]);
  });

  it('throws EmptyFeedError when feed is empty but goodreads books exist', () => {
    expect(() => planSync([], [book({ goodreadsId: '1' })], [])).toThrow(EmptyFeedError);
    expect(planSync([], [book()], [])).toEqual({ create: [], update: [], remove: [] });
  });
});
