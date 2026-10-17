import React from 'react';

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  accent: string;
  children?: React.ReactNode;
}

/** Eyebrow + two-line display heading used by the home content sections. */
export const SectionHead: React.FC<SectionHeadProps> = ({
  eyebrow,
  title,
  accent,
  children,
}) => (
  <div className="section-head">
    <div>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-heading">
        <span>{title}</span>
        <span className="accent">{accent}</span>
      </h2>
    </div>
    {children}
  </div>
);
