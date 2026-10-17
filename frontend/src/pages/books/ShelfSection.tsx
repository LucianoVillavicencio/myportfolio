import React, { useState } from 'react';
import type { Book } from '../../types';
import { accentFor } from '../../lib/books';
import { useI18n } from '../../i18n/LanguageContext';
import { ShelfBookCard } from '../../components/books/ShelfBookCard';

/** Books shown per shelf at first, and added by each "load more" click. */
const SHELF_PAGE_SIZE = 10;

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
}) => {
  const { t } = useI18n();
  const [shownCount, setShownCount] = useState(SHELF_PAGE_SIZE);
  const remaining = books.length - shownCount;

  return (
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
        <>
          <div className="bf-grid">
            {books.slice(0, shownCount).map((book, i) => (
              <ShelfBookCard
                key={book.id}
                book={book}
                index={i}
                accentColor={accentFor(i + accentOffset)}
                onInspect={onInspect}
              />
            ))}
          </div>
          {remaining > 0 && (
            <div className="bf-load-more">
              <button
                type="button"
                className="pf-tab"
                onClick={() => setShownCount((n) => n + SHELF_PAGE_SIZE)}
              >
                {t.books.loadMore(remaining)}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
