import React from 'react';

/**
 * Yellow burst fan next to first word of headline (.headline .fan)
 */
export const ShapeFan: React.FC = () => (
  <svg
    viewBox="0 0 110 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="fan boil-anim"
    aria-hidden="true"
  >
    <path d="M10 72 L62 8 L90 42 Z" fill="#f0b420" />
    <path d="M16 84 L82 80 L70 104 Z" fill="#f0b420" />
  </svg>
);

/**
 * Yellow swirl next to CTA button (.swirl or .nf-swirl)
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
      d="M16 74 C6 48 24 28 44 36 C58 42 52 60 36 56 C20 52 26 22 60 14"
      stroke="#f0b420"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

/**
 * Purple lines doodle below topbar pills (.decor--lines or .nf-lines)
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
      d="M10 32 L18 8 M28 36 L44 16 M34 48 L58 42"
      stroke="#b0a5fa"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * 9-point coral/red star (.decor--star or .nf-zero on 404 page)
 */
export const ShapeStar: React.FC<{ className?: string }> = ({
  className = 'decor decor--star',
}) => (
  <svg
    viewBox="0 0 220 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} boil-anim`}
    aria-hidden="true"
  >
    <path
      d="M106 10 L131 58 L182 36 L168 88 L214 116 L165 142 L183 192 L131 172 L105 214 L81 167 L29 185 L49 134 L8 106 L54 81 L40 29 L88 54 Z"
      fill="#f36c5a"
    />
  </svg>
);
