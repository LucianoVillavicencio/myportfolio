import React from 'react';
import type { Book } from '../../types';
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
      <BookCover book={book} accentColor="#f4893a" className="bf-now-cover" />
      <div className="bf-now-info">
        <div className="bf-now-eyebrow">
          <span className="dot" />{' '}
          {book.status === 'READING' ? t.book.nightstand : t.book.fromShelf}
        </div>
        <h2 className="bf-now-title">{book.title}</h2>
        <p className="bf-now-author">{t.common.by(book.author)}</p>
        {book.thoughts && <p className="bf-now-quote">“{book.thoughts}”</p>}
        <span className="bf-now-pages">{t.common.pages(book.totalPages)}</span>
      </div>
    </div>
  );
};
