import React from 'react';
import type { Book } from '../../types';
import { progressPercent } from '../../lib/books';
import { useI18n } from '../../i18n/LanguageContext';
import { BookCover } from './BookCover';

interface HomeBookCardProps {
  book: Book;
  accentColor: string;
}

/** Compact book card used in the home page reading section. */
export const HomeBookCard: React.FC<HomeBookCardProps> = ({ book, accentColor }) => {
  const { t } = useI18n();
  const percent = progressPercent(book);

  return (
    <article className="folio-card folio-book-card">
      <BookCover book={book} accentColor={accentColor} className="home-book-cover" />
      <div className="folio-book-info">
        <div className="folio-card-top">
          <span className="folio-badge">
            <span className="dot" aria-hidden="true" />
            {t.status[book.status]}
          </span>
          <span className="folio-percent">{percent}%</span>
        </div>

        <h3 className="folio-card-title">{book.title}</h3>
        <p className="folio-card-sub">{t.common.by(book.author)}</p>

        {book.thoughts && <p className="folio-card-desc">“{book.thoughts}”</p>}

        <div className="book-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="progress-foot">
            <span>{t.common.pages(book.currentPage, book.totalPages)}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
