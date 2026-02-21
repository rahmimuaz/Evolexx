import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to top of page when route changes.
 * Fixes: footer links, navbar links, and any navigation that should show content from top.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
