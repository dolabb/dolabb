import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Initialize GSAP ScrollTrigger plugin
 * Should be called once in the app
 */
export function initScrollTrigger() {
  if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    
    // Optimize ScrollTrigger performance
    ScrollTrigger.config({
      autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
    });
  }
}

/**
 * Clean up ScrollTrigger instances for a specific element
 */
export function cleanupScrollTrigger(trigger: HTMLElement | null) {
  if (!trigger) return;
  
  ScrollTrigger.getAll().forEach(st => {
    if (st.vars.trigger === trigger) {
      st.kill();
    }
  });
}

/**
 * Default animation settings for consistent animations
 */
export const animationDefaults = {
  duration: 0.8,
  ease: 'power3.out',
  stagger: 0.1,
  scrollTrigger: {
    start: 'top 85%',
    end: 'bottom 20%',
    toggleActions: 'play none none reverse',
    once: false,
    markers: false,
  },
};

