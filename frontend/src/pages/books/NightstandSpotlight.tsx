import React from 'react';
import type { Book } from '../../types';
import { progressPercent } from '../../lib/books';
import { clickable } from '../../lib/a11y';
import { useI18n } from '../../i18n/LanguageContext';
import { BookCover } from '../../components/books/BookCover';

interface NightstandSpotlightProps {
  book: Book;
  onInspect: (book: Book) => void;
}

export const NightstandSpotlight: React.FC<NightstandSpotlightProps> = ({
  book,
  onInspect,
}) => {
  const { t } = useI18n();

  return (
    <div className="bf-now-card" {...clickable(() => onInspect(book))}>
      <BookCover book={book} accentColor="#f0b420" className="bf-now-cover" />
      <div className="bf-now-info">
        <div className="bf-now-eyebrow">
          <span className="dot" />{' '}
          {book.status === 'READING' ? t.book.nightstand : t.book.fromShelf}
        </div>
        <h2 className="bf-now-title">{book.title}</h2>
        <p className="bf-now-author">{t.common.by(book.author)}</p>
        {book.thoughts && <p className="bf-now-quote">“{book.thoughts}”</p>}
        <div className="bf-now-bar">
          <div className="bf-now-bar-fill" style={{ width: `${progressPercent(book)}%` }} />
        </div>
        <span className="bf-now-pages">{t.book.pageOf(book.currentPage, book.totalPages)}</span>
      </div>
    </div>
  );
};
