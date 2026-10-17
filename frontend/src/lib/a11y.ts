import type React from 'react';

/** Makes a non-button element clickable with mouse and keyboard (Enter/Space). */
export function clickable(onActivate: () => void, label?: string) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick: onActivate,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  } as const;
}
