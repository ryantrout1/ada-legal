/**
 * ScrollToTop — fires window.scrollTo(0, 0) on every route change.
 *
 * React Router (v6+) does NOT auto-scroll to the top when you navigate
 * between routes. The browser preserves the scroll position from the
 * previous page, which means clicking a link near the bottom of one
 * page lands you near the bottom of the next page — confusing on
 * content-heavy routes like /about-ada.
 *
 * Mount once at the top of the route tree (inside <BrowserRouter> but
 * outside <Routes>). Renders nothing.
 *
 * Hash-targeted navigation (e.g., /chapter/1#section-2) is honored —
 * if the URL has a hash, we leave the browser's anchor scroll alone.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
