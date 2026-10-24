import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_MEASUREMENT_ID } from '../config/analytics';

export function trackPageView(pagePath, pageTitle) {
  if (typeof window === 'undefined' || !window.gtag) return;
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

export function AnalyticsTracker() {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    const fullPath = location.pathname + location.search + location.hash;
    if (fullPath !== lastPath.current) {
      lastPath.current = fullPath;
      trackPageView(fullPath, document.title);
    }
  }, [location]);

  return null;
}
