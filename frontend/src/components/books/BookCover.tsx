import React, { useEffect, useState } from 'react';
import type { Book } from '../../types';
import { useI18n } from '../../i18n/LanguageContext';

interface BookCoverProps {
  book: Pick<Book, 'title' | 'author' | 'coverUrl'>;
  accentColor: string;
  className?: string;
}

/** Shows the cover image, or a typographic fallback when it's missing/broken. */
export const BookCover: React.FC<BookCoverProps> = ({
  book,
  accentColor,
  className = '',
}) => {
  const { t } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);

  // Retry when the cover URL changes (e.g. after editing it in the admin panel)
  useEffect(() => setImgFailed(false), [book.coverUrl]);

  if (book.coverUrl && !imgFailed) {
    return (
      <div className={`bf-cover-frame ${className}`}>
        <img
          src={book.coverUrl}
          alt={t.book.coverOf(book.title)}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`bf-cover-frame bf-cover-fallback ${className}`}
      style={{ '--cover-tone': accentColor } as React.CSSProperties}
    >
      <span className="bf-fallback-author">{book.author}</span>
      <span className="bf-fallback-title">{book.title}</span>
    </div>
  );
};
