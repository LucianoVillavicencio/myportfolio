import React from 'react';
import { useI18n } from '../../i18n/LanguageContext';

export const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const { t } = useI18n();
  return (
    <div className="bf-stars" aria-label={t.book.rated(rating)}>
      {'★'.repeat(rating)}
      {'☆'.repeat(Math.max(0, 5 - rating))}
    </div>
  );
};
