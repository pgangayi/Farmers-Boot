/**
 * REDUCED MOTION HOOK
 * ===================
 * Detect and handle reduced motion preferences
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook that returns animation config based on reduced motion preference
 */
export function useAnimationConfig() {
  const reducedMotion = useReducedMotion();

  return {
    enabled: !reducedMotion,
    duration: reducedMotion ? 0 : 0.3,
    transition: reducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' },
    staggerChildren: reducedMotion ? 0 : 0.05,
    delayChildren: reducedMotion ? 0 : 0.1,
  };
}

/**
 * Returns animation props that respect reduced motion
 */
export function useAccessibleAnimation(
  animation: 'fadeIn' | 'slideUp' | 'scaleIn' | 'none' = 'fadeIn'
) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return {
      initial: {},
      animate: {},
      transition: { duration: 0 },
    };
  }

  const animations = {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3 },
    },
    none: {
      initial: {},
      animate: {},
      transition: { duration: 0 },
    },
  };

  return animations[animation];
}
