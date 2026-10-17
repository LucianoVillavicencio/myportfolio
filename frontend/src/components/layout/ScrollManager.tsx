import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePortfolioData } from '../../context/PortfolioDataContext';

/**
 * Scrolls to the top on page changes, or to the `#hash` target when present
 * (e.g. "/#contact" from the books page). Hash targets are retried once data
 * has loaded, since some anchors live inside data-driven sections.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const { isLoading } = usePortfolioData();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [pathname, hash, isLoading]);

  return null;
}
