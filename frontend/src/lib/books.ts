import type { Book } from '../types';

/** Rotating accent palette used for book spines and fallback covers. */
const ACCENTS = ['#f0b420', '#f36c5a', '#b0a5fa'];

export const accentFor = (index: number) => ACCENTS[index % ACCENTS.length];

export function progressPercent(book: Pick<Book, 'currentPage' | 'totalPages'>) {
  if (book.totalPages <= 0) return 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

export function groupByStatus(books: Book[]) {
  return {
    reading: books.filter((b) => b.status === 'READING'),
    toRead: books.filter((b) => b.status === 'WANT_TO_READ'),
    completed: books.filter((b) => b.status === 'COMPLETED'),
  };
}

