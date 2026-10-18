import { Book } from './book.entity';

export interface ReadingStats {
  year: number;
  finishedThisYear: number;
  pagesThisYear: number;
  goal: number | null;
  averageRating: number | null;
  byYear: { year: number; books: number; pages: number }[];
}

export function computeReadingStats(
  books: Pick<Book, 'status' | 'totalPages' | 'rating' | 'finishedAt'>[],
  goal: number | null,
  now: Date,
): ReadingStats {
  const year = now.getUTCFullYear();
  const completed = books.filter((b) => b.status === 'COMPLETED');

  const years = new Map<number, { books: number; pages: number }>();
  for (const b of completed) {
    if (!b.finishedAt) continue;
    const y = new Date(b.finishedAt).getUTCFullYear();
    const entry = years.get(y) ?? { books: 0, pages: 0 };
    entry.books += 1;
    entry.pages += b.totalPages ?? 0;
    years.set(y, entry);
  }

  const ratings = completed
    .map((b) => b.rating)
    .filter((r): r is number => typeof r === 'number');
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  const current = years.get(year);
  return {
    year,
    finishedThisYear: current?.books ?? 0,
    pagesThisYear: current?.pages ?? 0,
    goal,
    averageRating,
    byYear: [...years.entries()]
      .sort(([a], [b]) => a - b)
      .map(([y, v]) => ({ year: y, ...v })),
  };
}
