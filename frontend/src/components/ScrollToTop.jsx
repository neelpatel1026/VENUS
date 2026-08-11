import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from '../utils/analytics';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  // Initialize GA once
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route shifts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    trackPageView(pathname + search);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;