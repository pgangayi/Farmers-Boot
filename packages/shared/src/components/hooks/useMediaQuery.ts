/**
 * MEDIA QUERY HOOK
 * ================
 * React to media query changes for responsive design
 */

import { useState, useEffect } from 'react';
import { breakpoints } from '../utils/designTokens';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    const updateMatch = () => setMatches(media.matches);
    updateMatch();

    media.addEventListener('change', updateMatch);
    return () => media.removeEventListener('change', updateMatch);
  }, [query]);

  return matches;
}

// Predefined breakpoint hooks
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md})`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg})`);
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.xl})`);
}

// Hook for responsive values
export function useResponsiveValue<T>(values: { sm?: T; md?: T; lg?: T; xl?: T; default: T }): T {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();

  if (isLargeDesktop && values.xl !== undefined) return values.xl;
  if (isDesktop && values.lg !== undefined) return values.lg;
  if (isTablet && values.md !== undefined) return values.md;
  if (isMobile && values.sm !== undefined) return values.sm;
  return values.default;
}

// Hook for touch detection
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

// Hook for reduced motion preference
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// Hook for dark mode preference
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

// Hook for high contrast preference
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}
