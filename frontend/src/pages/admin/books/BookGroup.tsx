import React, { useState } from 'react';
import type { Book } from '../../../types';
import { useI18n } from '../../../i18n/LanguageContext';

/** Admin rows shown per page within one status group. */
const ADMIN_PAGE_SIZE = 10;

interface BookGroupProps {
  title: string;
  books: Book[];
  renderRow: (book: Book, index: number) => React.ReactNode;
}

/** One reading-status section of the admin book list, paginated. */
export const BookGroup: React.FC<BookGroupProps> = ({ title, books, renderRow }) => {
  const { t } = useI18n();
  const copy = t.admin.books.pager;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(books.length / ADMIN_PAGE_SIZE));
  // Deleting the last book on the last page would otherwise leave an empty page
  const current = Math.min(page, pageCount - 1);
  const start = current * ADMIN_PAGE_SIZE;

  return (
    <section className="admin-book-group">
      <h3 className="admin-group-title">
        {title} <span>({books.length})</span>
      </h3>
      {books.length === 0 ? (
        <p className="admin-hint">{copy.emptyGroup}</p>
      ) : (
        <ul className="admin-list">
          {books
            .slice(start, start + ADMIN_PAGE_SIZE)
            .map((book, i) => renderRow(book, start + i))}
        </ul>
      )}
      {pageCount > 1 && (
        <div className="admin-pager">
          <button
            type="button"
            className="btn-ghost"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            ← {copy.prev}
          </button>
          <span>{copy.page(current + 1, pageCount)}</span>
          <button
            type="button"
            className="btn-ghost"
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            {copy.next} →
          </button>
        </div>
      )}
    </section>
  );
};
