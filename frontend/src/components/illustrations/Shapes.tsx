import React from 'react';

/**
 * Little sunset sun peeking next to the first headline word (.headline .fan)
 */
export const ShapeFan: React.FC = () => (
  <svg
    viewBox="0 0 110 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="fan boil-anim"
    aria-hidden="true"
  >
    <circle cx="55" cy="58" r="22" fill="#f4893a" />
    <path
      d="M55 8 V24 M55 92 V104 M8 58 H22 M88 58 H102 M22 24 L32 34 M88 24 L78 34 M22 92 L32 82 M88 92 L78 82"
      stroke="#f4893a"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * River wave squiggle (.swirl or .nf-swirl)
 */
export const ShapeSwirl: React.FC<{ className?: string }> = ({
  className = 'swirl',
}) => (
  <svg
    viewBox="0 0 80 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} boil-anim`}
    aria-hidden="true"
  >
    <path
      d="M6 34 Q16 22 26 34 T46 34 T66 34 M14 58 Q24 46 34 58 T54 58 T74 58"
      stroke="#f4893a"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/**
 * Twinkling sparkles (.decor--lines or .nf-lines)
 */
export const ShapeLines: React.FC<{ className?: string }> = ({
  className = 'decor decor--lines',
}) => (
  <svg
    viewBox="0 0 65 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} boil-anim`}
    aria-hidden="true"
  >
    <path
      d="M20 6 V30 M8 18 H32 M48 34 V54 M38 44 H58"
      stroke="#8fc1e6"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

const RAYS = Array.from({ length: 16 }, (_, i) => i * 22.5);

/**
 * Sol de Mayo: alternating straight and wavy rays (.decor--star or .nf-zero on 404 page)
 */
export const ShapeStar: React.FC<{ className?: string }> = ({
  className = 'decor decor--star',
}) => (
  <svg
    viewBox="-110 -110 220 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} boil-anim`}
    aria-hidden="true"
  >
    {RAYS.map((angle, i) =>
      i % 2 === 0 ? (
        <path key={angle} d="M-9 -44 L0 -104 L9 -44 Z" fill="#e8919a" transform={`rotate(${angle})`} />
      ) : (
        <path
          key={angle}
          d="M0 -46 C-10 -58 10 -70 0 -82 C-8 -92 6 -98 0 -104"
          stroke="#e8919a"
          strokeWidth="7"
          strokeLinecap="round"
          transform={`rotate(${angle})`}
        />
      ),
    )}
    <circle r="48" fill="#e8919a" />
    <path d="M-20 -8 Q-14 -14 -8 -8 M8 -8 Q14 -14 20 -8 M-14 14 Q0 26 14 14" stroke="#1e1e1e" strokeWidth="5" strokeLinecap="round" />
  </svg>
);
