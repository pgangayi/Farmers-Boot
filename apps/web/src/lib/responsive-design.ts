/**
 * Responsive Design Utilities for Farmers-Boot
 *
 * Provides consistent responsive patterns and utilities
 * for mobile-first design across the application.
 */

import { useEffect, useState } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Responsive hook for current breakpoint
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= BREAKPOINTS['2xl']) setBreakpoint('2xl');
      else if (width >= BREAKPOINTS.xl) setBreakpoint('xl');
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg');
      else if (width >= BREAKPOINTS.md) setBreakpoint('md');
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Responsive value hook
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T {
  const currentBreakpoint = useBreakpoint();

  // Find the largest breakpoint that's <= current breakpoint
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);

  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (bp !== undefined && values[bp] !== undefined) {
      return values[bp] as T;
    }
  }

  return fallback;
}

// Mobile detection hook
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
}

export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md';
}

export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}

// Responsive grid utilities
export const responsiveGrid = {
  // Standard responsive grid
  standard: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',

  // Compact grid for cards
  compact: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',

  // Wide grid for dashboards
  wide: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',

  // Two column layout
  twoCol: 'grid grid-cols-1 md:grid-cols-2',

  // Three column layout
  threeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  // Four column layout
  fourCol: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4',

  // Auto grid with min width
  auto: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
  autoSm: 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]',
  autoLg: 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))]',
} as const;

// Responsive flex utilities
export const responsiveFlex = {
  // Standard responsive flex
  standard: 'flex flex-col sm:flex-row',

  // Reverse responsive flex
  reverse: 'flex flex-col-reverse sm:flex-row-reverse',

  // Wrap responsive flex
  wrap: 'flex flex-wrap gap-2 sm:gap-4',

  // Center responsive flex
  center: 'flex items-center justify-center',

  // Between responsive flex
  between: 'flex items-center justify-between',

  // Start responsive flex
  start: 'flex items-center justify-start',

  // End responsive flex
  end: 'flex items-center justify-end',
} as const;

// Responsive spacing utilities
export const responsiveSpacing = {
  // Section spacing
  section: 'py-8 sm:py-12 lg:py-16',
  sectionSm: 'py-4 sm:py-6 lg:py-8',
  sectionLg: 'py-12 sm:py-16 lg:py-20',

  // Container padding
  container: 'px-4 sm:px-6 lg:px-8',
  containerSm: 'px-2 sm:px-4 lg:px-6',
  containerLg: 'px-6 sm:px-8 lg:px-12',

  // Gap spacing
  gap: 'gap-2 sm:gap-4 lg:gap-6',
  gapSm: 'gap-1 sm:gap-2 lg:gap-3',
  gapLg: 'gap-4 sm:gap-6 lg:gap-8',

  // Margin
  margin: 'm-2 sm:m-4 lg:m-6',
  marginX: 'mx-2 sm:mx-4 lg:mx-6',
  marginY: 'my-2 sm:my-4 lg:my-6',

  // Padding
  padding: 'p-2 sm:p-4 lg:p-6',
  paddingX: 'px-2 sm:px-4 lg:px-6',
  paddingY: 'py-2 sm:py-4 lg:py-6',
} as const;

// Responsive text utilities
export const responsiveText = {
  // Headings
  h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
  h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
  h3: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl',
  h4: 'text-base sm:text-lg lg:text-xl xl:text-2xl',
  h5: 'text-sm sm:text-base lg:text-lg xl:text-xl',
  h6: 'text-xs sm:text-sm lg:text-base xl:text-lg',

  // Body text
  body: 'text-sm sm:text-base',
  bodySm: 'text-xs sm:text-sm',
  bodyLg: 'text-base sm:text-lg',

  // Responsive font weights
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

// Responsive component utilities
export const responsiveComponents = {
  // Cards
  card: 'w-full sm:w-auto',
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  cardList: 'space-y-4 sm:space-y-6',

  // Buttons
  button: 'w-full sm:w-auto',
  buttonGroup: 'flex flex-col sm:flex-row gap-2',

  // Forms
  form: 'space-y-4 sm:space-y-6',
  formField: 'space-y-2',
  formGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',

  // Navigation
  nav: 'flex flex-col sm:flex-row gap-4',
  navMobile: 'sm:hidden',
  navDesktop: 'hidden sm:flex',

  // Tables
  table: 'w-full overflow-x-auto',
  tableResponsive: 'block sm:table',

  // Modals
  modal: 'w-full sm:w-auto max-w-full sm:max-w-md',
  modalFull: 'w-full h-full sm:w-auto sm:h-auto',

  // Images
  image: 'w-full h-auto',
  imageResponsive: 'max-w-full h-auto',
} as const;

// Responsive animation utilities
export const responsiveAnimations = {
  // Transitions
  transition: 'transition-all duration-200 ease-in-out',
  transitionSlow: 'transition-all duration-300 ease-in-out',
  transitionFast: 'transition-all duration-150 ease-out',

  // Hover effects
  hover: 'hover:scale-105 transition-transform',
  active: 'active:scale-95 transition-transform',

  // Mobile-specific animations
  mobileSlide: 'sm:translate-x-0 translate-x-0 transition-transform',
  mobileFade: 'sm:opacity-100 opacity-90 transition-opacity',
} as const;

// Utility function to generate responsive classes
export function responsive(
  mobile: string,
  tablet?: string,
  desktop?: string,
  wide?: string
): string {
  const classes = [mobile];
  if (tablet) classes.push(`sm:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  if (wide) classes.push(`xl:${wide}`);
  return classes.join(' ');
}

// Utility function for conditional responsive classes
export function responsiveCondition(
  condition: boolean,
  mobile: string,
  tablet?: string,
  desktop?: string,
  wide?: string
): string {
  return condition ? responsive(mobile, tablet, desktop, wide) : '';
}

// Breakpoint checker utility
export function isBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

// Media query utility
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Orientation detection
export function useOrientation(): 'portrait' | 'landscape' {
  const isLandscape = useMediaQuery('(orientation: landscape)');
  return isLandscape ? 'landscape' : 'portrait';
}

// Touch device detection
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none)');
}

// Reduced motion detection
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// High contrast detection
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

// Export all utilities
export const responsiveUtils = {
  responsiveGrid,
  responsiveFlex,
  responsiveSpacing,
  responsiveText,
  responsiveComponents,
  responsiveAnimations,
  responsive,
  responsiveCondition,
  isBreakpoint,
  useMediaQuery,
  useOrientation,
  useIsTouchDevice,
  usePrefersReducedMotion,
  usePrefersHighContrast,
};

export default responsiveUtils;
