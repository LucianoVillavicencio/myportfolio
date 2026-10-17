import React, { useEffect } from 'react';
import type { Book } from '../../types';
import { useI18n } from '../../i18n/LanguageContext';
import { BookCover } from './BookCover';
import { StarRating } from './StarRating';

interface BookLightboxProps {
  book: Book;
  onClose: () => void;
}

export const BookLightbox: React.FC<BookLightboxProps> = ({ book, onClose }) => {
  const { t } = useI18n();

  // Close on Escape and lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="pf-lb"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bf-lb-title"
    >
      <button
        type="button"
        className="pf-lb-close"
        onClick={onClose}
        aria-label={t.common.close}
      >
        ✕
      </button>

      <div
        className="bf-lightbox-card bf-lightbox-with-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <BookCover book={book} accentColor="#f0b420" className="bf-lb-cover" />
        <div className="bf-lb-details">
          <span className="bf-status-pill">
            <span className="bf-dot" />
            {t.status[book.status]}
          </span>
          <h2 id="bf-lb-title" className="bf-lb-title">
            {book.title}
          </h2>
          <p className="bf-lb-author">{t.common.by(book.author)}</p>
          {book.rating && book.status === 'COMPLETED' && (
            <StarRating rating={book.rating} />
          )}
          {book.thoughts && (
            <blockquote className="bf-lb-notes">“{book.thoughts}”</blockquote>
          )}
          <p className="bf-lb-progress">
            {t.book.lightboxProgress(book.currentPage, book.totalPages)}
          </p>
        </div>
      </div>
    </div>
  );
};
