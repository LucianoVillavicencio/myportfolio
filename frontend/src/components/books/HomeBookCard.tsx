import React from 'react';
import type { Book } from '../../types';
import { useI18n } from '../../i18n/LanguageContext';
import { BookCover } from './BookCover';

interface HomeBookCardProps {
  book: Book;
  accentColor: string;
}

/** Compact book card used in the home page reading section. */
export const HomeBookCard: React.FC<HomeBookCardProps> = ({ book, accentColor }) => {
  const { t } = useI18n();

  return (
    <article className="folio-card folio-book-card">
      <BookCover book={book} accentColor={accentColor} className="home-book-cover" />
      <div className="folio-book-info">
        <div className="folio-card-top">
          <span className="folio-badge">
            <span className="dot" aria-hidden="true" />
            {t.status[book.status]}
          </span>
        </div>

        <h3 className="folio-card-title">{book.title}</h3>
        <p className="folio-card-sub">{t.common.by(book.author)}</p>

        {/* Reviews stay on the full bookshelf; the home page only previews titles */}
        <p className="book-progress">{t.common.pages(book.totalPages)}</p>
      </div>
    </article>
  );
};
