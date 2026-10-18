import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../../lib/analytics';

// Mirrors the backend's allowed view keys; anything else (login, admin, 404s) is skipped.
const TRACKED_VIEW_RE = /^(?:\/|\/books|\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** Counts a page view on every route change (pathname only, never the query or hash). */
export const PageViewTracker: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!TRACKED_VIEW_RE.test(pathname)) return;
    track('view', pathname);
  }, [pathname]);

  return null;
};
