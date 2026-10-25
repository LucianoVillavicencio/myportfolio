import React from 'react';
import type { TimelineKind } from '../../types';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS: Record<TimelineKind, React.ReactNode> = {
  education: (
    <path {...stroke} d="M4 5.5c2.5-1 5-1 8 1 3-2 5.5-2 8-1v13c-2.5-1-5-1-8 1-3-2-5.5-2-8-1zM12 6.5v13" />
  ),
  work: (
    <>
      <path {...stroke} d="M7 9h10l-1 9a3 3 0 0 1-3 2.5h-2A3 3 0 0 1 8 18z" />
      <path {...stroke} d="M14 9l3-6" />
    </>
  ),
  competition: (
    <>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        {...stroke}
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
      />
    </>
  ),
  certification: (
    <>
      <circle {...stroke} cx="12" cy="9" r="5" />
      <path {...stroke} d="M9 13.5 8 21l4-2 4 2-1-7.5" />
    </>
  ),
  project: <path {...stroke} d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />,
};

export const TimelineIcon: React.FC<{ kind: TimelineKind }> = ({ kind }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {ICONS[kind]}
  </svg>
);
