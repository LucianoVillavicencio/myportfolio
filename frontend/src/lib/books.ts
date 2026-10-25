import type { Book } from '../types';

/** Rotating accent palette used for book spines and fallback covers. */
export const ACCENTS = ['#f4893a', '#e8919a', '#8fc1e6'];

export const accentFor = (index: number) => ACCENTS[index % ACCENTS.length];

export function groupByStatus(books: Book[]) {
  return {
    reading: books.filter((b) => b.status === 'READING'),
    toRead: books.filter((b) => b.status === 'WANT_TO_READ'),
    completed: books.filter((b) => b.status === 'COMPLETED'),
  };
}

