/**
 * Farmers-Boot Design System
 *
 * A comprehensive design system that provides consistent theming,
 * component variants, and responsive utilities across the application.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeVariant = 'default' | 'spring' | 'summer' | 'autumn' | 'winter' | 'high-contrast';
export type ColorScheme = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

// Breakpoint System
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Spacing Scale
export const spacing = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const;

// Typography Scale
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// Border Radius Scale
export const borderRadius = {
  none: '0px',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// Shadow Scale
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Color Palettes
export interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const baseColors: { light: ColorPalette; dark: ColorPalette } = {
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    card: '#ffffff',
    cardForeground: '#0f172a',
    popover: '#ffffff',
    popoverForeground: '#0f172a',
    primary: '#2e7d32',
    primaryForeground: '#ffffff',
    secondary: '#f3f4f6',
    secondaryForeground: '#1f2937',
    muted: '#f9fafb',
    mutedForeground: '#6b7280',
    accent: '#f3f4f6',
    accentForeground: '#1f2937',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e5e7eb',
    input: '#e5e7eb',
    ring: '#2e7d32',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  dark: {
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    cardForeground: '#f8fafc',
    popover: '#1e293b',
    popoverForeground: '#f8fafc',
    primary: '#4caf50',
    primaryForeground: '#ffffff',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e293b',
    accentForeground: '#f8fafc',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#334155',
    input: '#334155',
    ring: '#4caf50',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
};

const seasonalVariants = {
  spring: {
    primary: '#10b981',
    primaryForeground: '#ffffff',
    background: '#f0fdf4',
    card: '#dcfce7',
    border: '#bbf7d0',
  },
  summer: {
    primary: '#f59e0b',
    primaryForeground: '#ffffff',
    background: '#fffbeb',
    card: '#fef3c7',
    border: '#fde68a',
  },
  autumn: {
    primary: '#ea580c',
    primaryForeground: '#ffffff',
    background: '#fef2f2',
    card: '#fee2e2',
    border: '#fca5a5',
  },
  winter: {
    primary: '#0284c7',
    primaryForeground: '#ffffff',
    background: '#f8fafc',
    card: '#e2e8f0',
    border: '#cbd5e1',
  },
  'high-contrast': {
    primary: '#0000ff',
    primaryForeground: '#ffffff',
    background: '#ffffff',
    card: '#f0f0f0',
    border: '#000000',
    foreground: '#000000',
    cardForeground: '#000000',
  },
} as const;

// Component Variant Definitions
export const buttonVariants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

export const buttonSizes = {
  xs: 'h-7 px-2 text-xs',
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 py-2',
  lg: 'h-10 px-6 text-base',
  xl: 'h-11 px-8 text-lg',
} as const;

export const cardVariants = {
  default: 'bg-card text-card-foreground border border-border shadow-sm',
  elevated: 'bg-card text-card-foreground border-0 shadow-lg',
  outlined: 'bg-card text-card-foreground border-2 border-border',
  filled: 'bg-muted text-muted-foreground border-0',
} as const;

// Responsive Utility Classes
export const responsive = {
  // Container utilities
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',

  // Grid utilities
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    compact: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    wide: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  },

  // Flex utilities
  flex: {
    responsive: 'flex flex-col sm:flex-row',
    reverse: 'flex flex-col-reverse sm:flex-row-reverse',
    wrap: 'flex flex-wrap gap-2 sm:gap-4',
  },

  // Text utilities
  text: {
    responsive: 'text-sm sm:text-base lg:text-lg',
    heading: 'text-xl sm:text-2xl lg:text-3xl',
    subheading: 'text-lg sm:text-xl lg:text-2xl',
  },

  // Spacing utilities
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    content: 'p-4 sm:p-6 lg:p-8',
    card: 'p-4 sm:p-6',
  },
} as const;

// Animation Utilities
export const animations = {
  transitions: {
    default: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-300 ease-in-out',
  },
  transforms: {
    hover: 'hover:scale-105',
    active: 'active:scale-95',
    bounce: 'hover:animate-bounce',
  },
} as const;

// Theme Context Interface
interface DesignSystemContextType {
  themeMode: ThemeMode;
  themeVariant: ThemeVariant;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeVariant: (variant: ThemeVariant) => void;
  colors: typeof baseColors.light;
  isDark: boolean;
  isHighContrast: boolean;
}

// Create Context
const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined);

// Theme Provider Component
interface DesignSystemProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultVariant?: ThemeVariant;
}

export function DesignSystemProvider({
  children,
  defaultMode = 'system',
  defaultVariant = 'default',
}: DesignSystemProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode') as ThemeMode;
    return stored || defaultMode;
  });

  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(() => {
    const stored = localStorage.getItem('theme-variant') as ThemeVariant;
    return stored || defaultVariant;
  });

  const [isDark, setIsDark] = useState(() => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeMode === 'dark';
  });

  // Get current colors
  const getColors = (): ColorPalette => {
    const currentColors = isDark ? baseColors.dark : baseColors.light;
    const variantColors =
      themeVariant !== 'default'
        ? (seasonalVariants as Record<string, Partial<ColorPalette>>)[themeVariant] || {}
        : {};

    return {
      ...currentColors,
      ...variantColors,
    } as ColorPalette;
  };

  const colors = getColors();
  const isHighContrast = themeVariant === 'high-contrast';

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove all theme classes
    root.classList.remove('light', 'dark');
    root.classList.remove('spring', 'summer', 'autumn', 'winter', 'high-contrast');

    // Apply theme classes
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    if (themeVariant !== 'default') {
      root.classList.add(themeVariant);
    }

    // Apply CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });

    // Store preferences
    localStorage.setItem('theme-mode', themeMode);
    localStorage.setItem('theme-variant', themeVariant);
  }, [themeMode, themeVariant, isDark, colors]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setIsDark(mediaQuery.matches);

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined;
  }, [themeMode]);

  // Update isDark when themeMode changes
  useEffect(() => {
    if (themeMode !== 'system') {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode]);

  const contextValue: DesignSystemContextType = {
    themeMode,
    themeVariant,
    setThemeMode,
    setThemeVariant,
    colors,
    isDark,
    isHighContrast,
  };

  return React.createElement(DesignSystemContext.Provider, { value: contextValue }, children);
}

// Hook to use design system
export function useDesignSystem() {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
}

// Utility Functions
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getResponsiveValue<T>(
  values: Partial<Record<keyof typeof breakpoints, T>>,
  fallback: T
): T {
  if (typeof window === 'undefined') return fallback;

  const width = window.innerWidth;

  // Find the largest breakpoint that fits
  const sortedBreakpoints = Object.entries(breakpoints).sort(
    ([, a], [, b]) => parseInt(b) - parseInt(a)
  );

  for (const [name, value] of sortedBreakpoints) {
    const breakpointName = name as keyof typeof breakpoints;
    if (width >= parseInt(value) && values[breakpointName] !== undefined) {
      return values[breakpointName] as T;
    }
  }

  return fallback;
}

// Export design system utilities
export const designSystem = {
  colors: baseColors,
  variants: seasonalVariants,
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  buttonVariants,
  buttonSizes,
  cardVariants,
  responsive,
  animations,
  cn,
  getResponsiveValue,
};

export default designSystem;
