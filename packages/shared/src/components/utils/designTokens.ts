/**
 * DESIGN TOKENS
 * =============
 * Centralized design tokens for consistent theming across applications
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Core Colors - Farming Inspired
  primary: {
    50: 'hsl(142 76% 95%)',
    100: 'hsl(142 76% 90%)',
    200: 'hsl(142 76% 80%)',
    300: 'hsl(142 76% 70%)',
    400: 'hsl(142 76% 60%)',
    500: 'hsl(142 76% 45%)',
    600: 'hsl(142 76% 36%)',
    700: 'hsl(142 76% 26%)',
    800: 'hsl(142 76% 16%)',
    900: 'hsl(142 76% 8%)',
    DEFAULT: 'hsl(142 76% 36%)',
    foreground: 'hsl(0 0% 100%)',
  },
  secondary: {
    DEFAULT: 'hsl(210 40% 96%)',
    foreground: 'hsl(222.2 84% 4.9%)',
  },
  accent: {
    DEFAULT: 'hsl(37 91% 55%)',
    foreground: 'hsl(0 0% 100%)',
  },
  // Semantic Colors
  success: {
    DEFAULT: 'hsl(142 71% 45%)',
    foreground: 'hsl(0 0% 100%)',
    light: 'hsl(142 71% 95%)',
  },
  warning: {
    DEFAULT: 'hsl(38 92% 50%)',
    foreground: 'hsl(0 0% 100%)',
    light: 'hsl(38 92% 95%)',
  },
  destructive: {
    DEFAULT: 'hsl(0 84.2% 60.2%)',
    foreground: 'hsl(0 0% 100%)',
    light: 'hsl(0 84.2% 95%)',
  },
  info: {
    DEFAULT: 'hsl(217 91% 60%)',
    foreground: 'hsl(0 0% 100%)',
    light: 'hsl(217 91% 95%)',
  },
  // Neutral Colors
  background: {
    DEFAULT: 'hsl(0 0% 100%)',
    secondary: 'hsl(210 40% 98%)',
    tertiary: 'hsl(214.3 31.8% 91.4%)',
  },
  foreground: {
    DEFAULT: 'hsl(222.2 84% 4.9%)',
    secondary: 'hsl(215.4 16.3% 46.9%)',
    tertiary: 'hsl(215 20.2% 65.1%)',
    muted: 'hsl(215.4 16.3% 46.9%)',
  },
  muted: {
    DEFAULT: 'hsl(210 40% 96%)',
    foreground: 'hsl(215.4 16.3% 46.9%)',
  },
  card: {
    DEFAULT: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
  },
  border: {
    DEFAULT: 'hsl(214.3 31.8% 91.4%)',
    focus: 'hsl(142 76% 36%)',
  },
  ring: {
    DEFAULT: 'hsl(142 76% 36%)',
    offset: 'hsl(0 0% 100%)',
  },
} as const;

// Dark mode color overrides
export const darkColors = {
  background: {
    DEFAULT: 'hsl(222.2 84% 4.9%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    tertiary: 'hsl(217.2 32.6% 17.5%)',
  },
  foreground: {
    DEFAULT: 'hsl(210 40% 98%)',
    secondary: 'hsl(215 20.2% 65.1%)',
    tertiary: 'hsl(215.4 16.3% 46.9%)',
  },
  card: {
    DEFAULT: 'hsl(222.2 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
  },
  muted: {
    DEFAULT: 'hsl(217.2 32.6% 17.5%)',
    foreground: 'hsl(215 20.2% 65.1%)',
  },
  border: {
    DEFAULT: 'hsl(217.2 32.6% 17.5%)',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
  } as const,
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  } as const,
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: 'calc(0.625rem - 4px)', // 0.375rem
  DEFAULT: '0.625rem', // 10px
  md: 'calc(0.625rem - 2px)', // 0.5rem
  lg: '0.625rem', // 10px
  xl: 'calc(0.625rem + 4px)', // 0.875rem
  '2xl': 'calc(0.625rem + 8px)', // 1.125rem
  '3xl': '1.5rem',
  full: '9999px',
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px hsl(142 76% 36% / 0.3)',
  'glow-lg': '0 0 30px hsl(142 76% 36% / 0.4)',
  none: 'none',
} as const;

// Dark mode shadows
export const darkShadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
  glow: '0 0 20px hsl(142 71% 45% / 0.4)',
} as const;

// ============================================================================
// TRANSITION TOKENS
// ============================================================================

export const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  } as const,
  timing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  } as const,
  property: {
    none: 'none',
    all: 'all',
    DEFAULT:
      'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
    colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
    opacity: 'opacity',
    shadow: 'box-shadow',
    transform: 'transform',
  } as const,
} as const;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============================================================================
// BREAKPOINT TOKENS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// CONTENT DENSITY TOKENS
// ============================================================================

export const contentDensity = {
  compact: {
    padding: {
      xs: spacing[1],
      sm: spacing[1.5],
      md: spacing[2],
      lg: spacing[3],
    },
    gap: {
      xs: spacing[0.5],
      sm: spacing[1],
      md: spacing[1.5],
      lg: spacing[2],
    },
    fontSize: {
      xs: typography.fontSize.xs,
      sm: typography.fontSize.sm,
      md: typography.fontSize.sm,
      lg: typography.fontSize.base,
    },
  },
  comfortable: {
    padding: {
      xs: spacing[1.5],
      sm: spacing[2],
      md: spacing[3],
      lg: spacing[4],
    },
    gap: {
      xs: spacing[1],
      sm: spacing[1.5],
      md: spacing[2],
      lg: spacing[3],
    },
    fontSize: {
      xs: typography.fontSize.xs,
      sm: typography.fontSize.sm,
      md: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },
  spacious: {
    padding: {
      xs: spacing[2],
      sm: spacing[3],
      md: spacing[4],
      lg: spacing[6],
    },
    gap: {
      xs: spacing[1.5],
      sm: spacing[2],
      md: spacing[3],
      lg: spacing[4],
    },
    fontSize: {
      xs: typography.fontSize.sm,
      sm: typography.fontSize.base,
      md: typography.fontSize.lg,
      lg: typography.fontSize.xl,
    },
  },
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const animations = {
  keyframes: {
    fadeIn: `@keyframes fb-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }`,
    fadeInUp: `@keyframes fb-fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }`,
    fadeInDown: `@keyframes fb-fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }`,
    scaleIn: `@keyframes fb-scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }`,
    slideInLeft: `@keyframes fb-slideInLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }`,
    slideInRight: `@keyframes fb-slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }`,
    pulse: `@keyframes fb-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }`,
    bounce: `@keyframes fb-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }`,
    spin: `@keyframes fb-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }`,
    shake: `@keyframes fb-shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }`,
    shimmer: `@keyframes fb-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }`,
  },
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const componentTokens = {
  button: {
    height: {
      xs: '1.75rem', // 28px
      sm: '2rem', // 32px
      md: '2.5rem', // 40px
      lg: '2.75rem', // 44px
      xl: '3rem', // 48px
    },
    padding: {
      xs: '0 0.5rem',
      sm: '0 0.75rem',
      md: '0 1rem',
      lg: '0 1.25rem',
      xl: '0 1.5rem',
    },
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
  },
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDensityValue(
  density: keyof typeof contentDensity,
  property: 'padding' | 'gap' | 'fontSize',
  size: 'xs' | 'sm' | 'md' | 'lg'
): string {
  const densityConfig = contentDensity[density];
  const propConfig = densityConfig[property];
  return propConfig[size] as string;
}

export function getColor(colorPath: string): string {
  const parts = colorPath.split('.');
  let value: any = colors;
  for (const part of parts) {
    value = value[part];
    if (value === undefined) return '';
  }
  return value as string;
}

export function cssVar(name: string, fallback?: string): string {
  return `var(--fb-${name}${fallback ? `, ${fallback}` : ''})`;
}

// ============================================================================
// CSS CUSTOM PROPERTIES GENERATOR
// ============================================================================

export function generateCSSVariables(): string {
  const variables: string[] = [];

  // Generate color variables
  Object.entries(colors).forEach(([colorName, colorValue]) => {
    if (typeof colorValue === 'string') {
      variables.push(`  --fb-color-${colorName}: ${colorValue};`);
    } else {
      Object.entries(colorValue).forEach(([shade, value]) => {
        variables.push(`  --fb-color-${colorName}-${shade}: ${value};`);
      });
    }
  });

  // Generate spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    variables.push(`  --fb-spacing-${key}: ${value};`);
  });

  // Generate radius variables
  Object.entries(borderRadius).forEach(([key, value]) => {
    variables.push(`  --fb-radius-${key}: ${value};`);
  });

  // Generate shadow variables
  Object.entries(shadows).forEach(([key, value]) => {
    variables.push(`  --fb-shadow-${key}: ${value};`);
  });

  // Generate transition variables
  Object.entries(transitions.duration).forEach(([key, value]) => {
    variables.push(`  --fb-transition-duration-${key}: ${value};`);
  });

  // Generate z-index variables
  Object.entries(zIndex).forEach(([key, value]) => {
    variables.push(`  --fb-z-${key}: ${value};`);
  });

  return `:root {\n${variables.join('\n')}\n}`;
}
