import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls window to top (0, 0) whenever the route pathname changes.
 *
 * Portal layouts (admin, shelter) scroll inside their own `<main>` instead of the
 * window, so those containers are reset too — otherwise a new portal page opens
 * at the previous page's scroll offset.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>('[data-scroll-container]').forEach((node) => {
      node.scrollTop = 0;
    });
  }, [pathname]);

  return null;
};
