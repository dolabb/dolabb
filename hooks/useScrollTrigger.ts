'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Custom hook to initialize and optimize ScrollTrigger
 * This ensures ScrollTrigger is properly set up for smooth animations
 */
export function useScrollTrigger() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Optimize ScrollTrigger performance
    ScrollTrigger.config({
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
    });

    // Refresh ScrollTrigger after a short delay to ensure DOM is ready
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    // Refresh on window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(refreshTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}

