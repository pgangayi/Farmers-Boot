# Farmers-Boot Design System Documentation

## Overview

The Farmers-Boot Design System is a comprehensive framework that provides consistent theming, component variants, and responsive utilities across the application. It ensures a cohesive user experience while maintaining flexibility for different use cases and devices.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Theme System](#theme-system)
3. [Responsive Design](#responsive-design)
4. [Component Variants](#component-variants)
5. [Utilities](#utilities)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Best Practices](#best-practices)

## Core Concepts

### Design Philosophy

- **Mobile-First**: All components are designed with mobile as the primary consideration
- **Accessibility**: WCAG 2.1 AA compliance is built into all components
- **Consistency**: Unified spacing, typography, and color systems
- **Flexibility**: Extensible system that supports custom themes and variants
- **Performance**: Optimized for fast loading and smooth interactions

### Architecture

The design system consists of three main layers:

1. **Foundation Layer**: Basic design tokens (colors, spacing, typography)
2. **Component Layer**: Reusable UI components with variants
3. **Utility Layer**: Helper functions and responsive utilities

## Theme System

### Theme Modes

The design system supports multiple theme modes:

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
```

- **Light**: Default light theme for daytime use
- **Dark**: Dark theme for low-light environments
- **System**: Automatically follows system preference

### Theme Variants

Seasonal and accessibility variants:

```typescript
type ThemeVariant = 'default' | 'spring' | 'summer' | 'autumn' | 'winter' | 'high-contrast';
```

- **Default**: Standard green farming theme
- **Spring**: Fresh green colors for spring season
- **Summer**: Warm orange/yellow tones for summer
- **Autumn**: Rich orange/brown colors for autumn
- **Winter**: Cool blue tones for winter
- **High-Contrast**: Enhanced contrast for accessibility

### Color System

#### Primary Colors

```css
:root {
  --color-primary: #2e7d32;        /* Farm green */
  --color-secondary: #f3f4f6;      /* Light gray */
  --color-accent: #ff9800;          /* Harvest orange */
}
```

#### Semantic Colors

```css
:root {
  --color-success: #22c55e;         /* Growth green */
  --color-warning: #f59e0b;         /* Caution orange */
  --color-error: #ef4444;           /* Alert red */
  --color-info: #3b82f6;           /* Information blue */
}
```

### Usage

```typescript
import { useDesignSystem } from '@/lib/design-system';

function MyComponent() {
  const { themeMode, setThemeMode, themeVariant, colors } = useDesignSystem();
  
  return (
    <div style={{ backgroundColor: colors.background }}>
      <button onClick={() => setThemeMode('dark')}>
        Toggle Dark Mode
      </button>
    </div>
  );
}
```

## Responsive Design

### Breakpoint System

```typescript
const breakpoints = {
  xs: '0px',      // Mobile phones
  sm: '640px',    // Small tablets
  md: '768px',    // Tablets
  lg: '1024px',   // Small desktops
  xl: '1280px',   // Desktops
  '2xl': '1536px' // Large desktops
};
```

### Responsive Hooks

```typescript
import { 
  useBreakpoint, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useResponsiveValue 
} from '@/lib/responsive-design';

// Get current breakpoint
const breakpoint = useBreakpoint(); // 'lg' | 'md' | 'sm' | 'xs'

// Device detection
const isMobile = useIsMobile();    // xs or sm
const isTablet = useIsTablet();    // md
const isDesktop = useIsDesktop();  // lg or xl or 2xl

// Responsive values
const fontSize = useResponsiveValue({
  xs: '14px',
  sm: '16px',
  md: '18px',
  lg: '20px'
}, '16px');
```

### Responsive Utilities

#### Grid Systems

```typescript
import { responsiveGrid } from '@/lib/responsive-design';

// Standard responsive grid
className={responsiveGrid.standard} // grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

// Compact grid for cards
className={responsiveGrid.compact} // grid-cols-1 sm:grid-cols-2 md:grid-cols-3

// Auto grid with min-width
className={responsiveGrid.auto} // grid-cols-[repeat(auto-fit,minmax(250px,1fr))]
```

#### Flexbox Utilities

```typescript
import { responsiveFlex } from '@/lib/responsive-design';

// Standard responsive flex
className={responsiveFlex.standard} // flex flex-col sm:flex-row

// Responsive flex with wrap
className={responsiveFlex.wrap} // flex flex-wrap gap-2 sm:gap-4
```

#### Spacing Utilities

```typescript
import { responsiveSpacing } from '@/lib/responsive-design';

// Section spacing
className={responsiveSpacing.section} // py-8 sm:py-12 lg:py-16

// Container padding
className={responsiveSpacing.container} // px-4 sm:px-6 lg:px-8
```

## Component Variants

### Button Variants

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Usage
<Button variant="primary" size="md">
  Save Changes
</Button>
```

#### Button Classes

```css
.btn-primary    { @apply bg-primary text-primary-foreground hover:bg-primary/90; }
.btn-secondary  { @apply bg-secondary text-secondary-foreground hover:bg-secondary/80; }
.btn-outline    { @apply border border-input hover:bg-accent hover:text-accent-foreground; }
.btn-ghost      { @apply hover:bg-accent hover:text-accent-foreground; }
.btn-destructive { @apply bg-destructive text-destructive-foreground hover:bg-destructive/90; }
.btn-link       { @apply text-primary underline-offset-4 hover:underline; }
```

### Card Variants

```typescript
type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

// Usage
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Farm Overview</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

#### Card Classes

```css
.card-default   { @apply bg-card text-card-foreground border border-border shadow-sm; }
.card-elevated { @apply bg-card text-card-foreground border-0 shadow-lg; }
.card-outlined  { @apply bg-card text-card-foreground border-2 border-border; }
.card-filled    { @apply bg-muted text-muted-foreground border-0; }
```

## Utilities

### Spacing Scale

```typescript
const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem'     // 128px
};
```

### Typography Scale

```typescript
const typography = {
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
    '6xl': ['3.75rem', { lineHeight: '1' }]
  }
};
```

### Shadow Scale

```typescript
const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
};
```

## Implementation Guidelines

### Setting Up Themes

1. **Provider Setup**: Wrap your app with `DesignSystemProvider`

```typescript
import { DesignSystemProvider } from '@/lib/design-system';

function App() {
  return (
    <DesignSystemProvider defaultMode="system" defaultVariant="default">
      <YourApp />
    </DesignSystemProvider>
  );
}
```

2. **Theme Usage**: Use the `useDesignSystem` hook in components

```typescript
import { useDesignSystem } from '@/lib/design-system';

function ThemedComponent() {
  const { colors, themeMode, setThemeMode, themeVariant } = useDesignSystem();
  
  return (
    <div 
      style={{ 
        backgroundColor: colors.background,
        color: colors.foreground 
      }}
    >
      Current theme: {themeMode} - {themeVariant}
    </div>
  );
}
```

### Responsive Implementation

1. **Mobile-First Approach**: Start with mobile styles, then enhance for larger screens

```typescript
// Good: Mobile-first
const className = 'p-4 sm:p-6 lg:p-8';

// Avoid: Desktop-first
const className = 'p-8 lg:p-6 sm:p-4';
```

2. **Use Responsive Hooks**: Leverage built-in responsive utilities

```typescript
import { useIsMobile, useResponsiveValue } from '@/lib/responsive-design';

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const padding = useResponsiveValue({
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '3rem'
  }, '2rem');
  
  return (
    <div style={{ padding }}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

### Component Development

1. **Use Design System Classes**: Prefer utility classes over inline styles

```typescript
// Good: Using design system
<div className={cn(
  responsiveComponents.card,
  responsiveSpacing.padding
)}>

// Avoid: Inline styles
<div style={{ 
  backgroundColor: '#ffffff',
  padding: '1rem',
  borderRadius: '0.5rem'
}}>
```

2. **Consistent Spacing**: Use the spacing scale

```typescript
// Good: Using spacing scale
<div className="gap-4 sm:gap-6">

// Avoid: Arbitrary values
<div className="gap-[17px]">
```

## Best Practices

### Performance

1. **Lazy Load Components**: Use dynamic imports for large components
2. **Optimize Images**: Use responsive images with proper sizing
3. **Minimize Re-renders**: Use React.memo and useMemo appropriately
4. **CSS-in-JS**: Use CSS variables for theming to avoid style recalculation

### Accessibility

1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Labels**: Add proper ARIA attributes
3. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
4. **Color Contrast**: Maintain WCAG AA contrast ratios
5. **Focus Management**: Proper focus handling in modals and forms

### Mobile Optimization

1. **Touch Targets**: Minimum 44px touch targets
2. **Readable Text**: Minimum 16px font size without zooming
3. **Viewport Meta**: Ensure proper viewport configuration
4. **Performance**: Optimize for mobile network conditions

### Testing

1. **Cross-Browser**: Test on major browsers
2. **Device Testing**: Test on actual devices when possible
3. **Responsive Testing**: Use browser dev tools and real devices
4. **Accessibility Testing**: Use screen readers and accessibility tools

## Migration Guide

### From Inline Styles

```typescript
// Before
<div style={{ 
  backgroundColor: '#2e7d32',
  color: '#ffffff',
  padding: '1rem',
  borderRadius: '0.5rem'
}}>

// After
<div className="bg-primary text-primary-foreground p-4 rounded-lg">
```

### From Hardcoded Values

```typescript
// Before
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// After
<div className={responsiveGrid.standard}>
```

### From Manual Responsive Logic

```typescript
// Before
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// After
const isMobile = useIsMobile();
```

## Troubleshooting

### Common Issues

1. **Theme Not Applying**: Ensure `DesignSystemProvider` wraps your app
2. **Responsive Classes Not Working**: Check Tailwind CSS configuration
3. **Import Errors**: Verify import paths and file extensions
4. **Performance Issues**: Check for unnecessary re-renders and large bundle sizes

### Debug Tools

1. **Browser DevTools**: Use responsive design mode
2. **React DevTools**: Check component props and state
3. **Accessibility Inspector**: Use browser accessibility tools
4. **Performance Monitor**: Check bundle size and loading times

## Contributing

When contributing to the design system:

1. **Follow Patterns**: Use existing patterns and conventions
2. **Document Changes**: Update documentation for new features
3. **Test Thoroughly**: Test across devices and browsers
4. **Consider Accessibility**: Ensure WCAG compliance
5. **Performance First**: Optimize for loading and runtime performance

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile Web Best Practices](https://web.dev/mobile-web-development/)

---

This design system is continuously evolving. Check back regularly for updates and improvements.
