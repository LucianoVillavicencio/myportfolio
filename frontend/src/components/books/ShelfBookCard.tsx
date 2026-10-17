import React from 'react';
import type { Book } from '../../types';
import { STATUS_LABELS, progressPercent } from '../../lib/books';
import { clickable } from '../../lib/a11y';
import { BookCover } from './BookCover';
import { StarRating } from './StarRating';

interface ShelfBookCardProps {
  book: Book;
  index: number;
  accentColor: string;
  onInspect: (book: Book) => void;
}

/** Book "spine" card used on the /books shelf. */
export const ShelfBookCard: React.FC<ShelfBookCardProps> = ({
  book,
  index,
  accentColor,
  onInspect,
}) => {
  const percent = progressPercent(book);

  return (
    <article
      className="bf-card"
      style={{ '--book-accent': accentColor } as React.CSSProperties}
    >
      <div className="bf-card-spine" aria-hidden="true" />

      <div
        className="bf-card-cover-col"
        title="Inspect book & notes"
        {...clickable(() => onInspect(book), `Inspect ${book.title}`)}
      >
        <BookCover book={book} accentColor={accentColor} />
      </div>

      <div className="bf-card-body">
        <div className="bf-card-top">
          <span className={`bf-status-pill status--${book.status.toLowerCase()}`}>
            <span className="bf-dot" />
            {STATUS_LABELS[book.status]}
          </span>
          <span className="bf-index">#{String(index + 1).padStart(2, '0')}</span>
        </div>

        <h3 className="bf-book-title">
          <button
            type="button"
            className="bf-unstyled-btn"
            onClick={() => onInspect(book)}
          >
            {book.title}
          </button>
        </h3>
        <p className="bf-book-author">{book.author}</p>

        {book.rating && book.status === 'COMPLETED' && (
          <StarRating rating={book.rating} />
        )}

        {book.thoughts && <p className="bf-book-thoughts">“{book.thoughts}”</p>}

        <div className="bf-progress-wrap">
          {book.status === 'WANT_TO_READ' ? (
            <div className="bf-progress-meta">
              <span>{book.totalPages} pages · Queued on shelf</span>
            </div>
          ) : (
            <>
              <div className="bf-progress-bar">
                <div className="bf-progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <div className="bf-progress-meta">
                <span>
                  {book.currentPage} / {book.totalPages} pages ({percent}%)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
