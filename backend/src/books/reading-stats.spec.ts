import { computeReadingStats } from './reading-stats';

const now = new Date('2026-06-15T12:00:00Z');
const book = (o: any = {}) => ({
  status: 'COMPLETED' as const,
  totalPages: 100,
  rating: null,
  finishedAt: new Date('2026-03-01T00:00:00Z'),
  ...o,
});

describe('computeReadingStats', () => {
  it('counts books and pages finished this year', () => {
    const s = computeReadingStats(
      [book(), book({ totalPages: 250 }), book({ finishedAt: new Date('2025-03-01T00:00:00Z') })],
      12,
      now,
    );
    expect(s).toMatchObject({ year: 2026, finishedThisYear: 2, pagesThisYear: 350, goal: 12 });
  });

  it('groups by year ascending', () => {
    const s = computeReadingStats(
      [
        book(),
        book({ finishedAt: new Date('2024-01-01T00:00:00Z'), totalPages: 10 }),
        book({ finishedAt: new Date('2024-02-01T00:00:00Z'), totalPages: 20 }),
      ],
      null,
      now,
    );
    expect(s.byYear).toEqual([
      { year: 2024, books: 2, pages: 30 },
      { year: 2026, books: 1, pages: 100 },
    ]);
  });

  it('averages only rated completed books', () => {
    const s = computeReadingStats(
      [book({ rating: 4 }), book({ rating: 5 }), book(), book({ status: 'READING', rating: 1 })],
      null,
      now,
    );
    expect(s.averageRating).toBe(4.5);
  });

  it('undated completed books are not assigned a year', () => {
    const s = computeReadingStats([book({ finishedAt: null, rating: 3 })], null, now);
    expect(s.byYear).toEqual([]);
    expect(s.finishedThisYear).toBe(0);
    expect(s.averageRating).toBe(3);
  });

  it('empty library returns zeros and null average', () => {
    expect(computeReadingStats([], null, now)).toEqual({
      year: 2026,
      finishedThisYear: 0,
      pagesThisYear: 0,
      goal: null,
      averageRating: null,
      byYear: [],
    });
  });
});
