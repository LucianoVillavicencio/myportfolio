import React from 'react';
import type { Book } from '../../types';
import { accentFor } from '../../lib/books';
import { ShelfBookCard } from '../../components/books/ShelfBookCard';

interface ShelfSectionProps {
  /** Plain heading text plus an optional highlighted word. */
  heading: [string, string?];
  accentClass?: string;
  caption: string;
  emptyMessage: string;
  books: Book[];
  /** Offsets the accent palette so neighbouring shelves don't start on the same color. */
  accentOffset: number;
  onInspect: (book: Book) => void;
}

export const ShelfSection: React.FC<ShelfSectionProps> = ({
  heading: [plain, accent],
  accentClass,
  caption,
  emptyMessage,
  books,
  accentOffset,
  onInspect,
}) => (
  <section className="bf-shelf-section">
    <div className="pf-gallery-head">
      <div>
        <h2 className="pf-year">
          {plain}
          {accent && (
            <>
              {' '}
              <span className={accentClass}>{accent}</span>
            </>
          )}
        </h2>
        <p className="pf-count">{caption}</p>
      </div>
    </div>

    {books.length === 0 ? (
      <p className="bf-empty">{emptyMessage}</p>
    ) : (
      <div className="bf-grid">
        {books.map((book, i) => (
          <ShelfBookCard
            key={book.id}
            book={book}
            index={i}
            accentColor={accentFor(i + accentOffset)}
            onInspect={onInspect}
          />
        ))}
      </div>
    )}
  </section>
);
