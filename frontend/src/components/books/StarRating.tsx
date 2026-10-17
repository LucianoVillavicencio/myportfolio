import React from 'react';

export const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="bf-stars" aria-label={`Rated ${rating} out of 5`}>
    {'★'.repeat(rating)}
    {'☆'.repeat(Math.max(0, 5 - rating))}
  </div>
);
