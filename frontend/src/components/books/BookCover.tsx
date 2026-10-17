import React, { useEffect, useState } from 'react';
import type { Book } from '../../types';

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
  const [imgFailed, setImgFailed] = useState(false);

  // Retry when the cover URL changes (e.g. after editing it in the admin panel)
  useEffect(() => setImgFailed(false), [book.coverUrl]);

  if (book.coverUrl && !imgFailed) {
    return (
      <div className={`bf-cover-frame ${className}`}>
        <img
          src={book.coverUrl}
          alt={`Cover of ${book.title}`}
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
