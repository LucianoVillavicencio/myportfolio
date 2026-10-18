import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../../lib/analytics';

/** Counts a page view on every route change (pathname only, never the query or hash). */
export const PageViewTracker: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return;
    track('view', pathname);
  }, [pathname]);

  return null;
};
