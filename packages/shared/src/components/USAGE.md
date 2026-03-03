# Farmers Boot Shared UI Components

## Installation

Import components from the shared package:

```tsx
import {
  Button,
  Card,
  Form,
  Input,
  Breadcrumbs,
  useScrollAnimation,
  useFocusTrap,
  useSwipe,
  ContentDensityProvider,
  DensityToggle,
  cn,
  colors,
  spacing,
} from '@farmers-boot/shared/components';
```

## Components

### Button

```tsx
// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="success">Success</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button isLoading loadingText="Saving...">Save</Button>

// With icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Next</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Disable ripple
<Button ripple={false}>No Ripple</Button>
```

### Card

```tsx
// Basic card
<Card>
  <CardHeader title="Card Title" subtitle="Card subtitle" />
  <CardContent>Content goes here</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// With variants
<Card variant="elevated">Elevated card</Card>
<Card variant="outlined">Outlined card</Card>
<Card variant="glass">Glass morphism card</Card>

// With hover effects
<Card interactive hover="lift">Clickable with lift effect</Card>
<Card interactive hover="scale">Clickable with scale effect</Card>
<Card interactive hover="glow">Clickable with glow effect</Card>

// With animation
<Card animate="fade-in">Fades in on mount</Card>
<Card animate="slide-up" delay={200}>Slides up with delay</Card>

// StatCard
<StatCard
  title="Total Revenue"
  value={12500}
  subValue="+12% from last month"
  icon={<DollarSign />}
  trend={{ value: 12, isPositive: true }}
  color="success"
  animateValue
/>
```

### Form

```tsx
const fields = [
  {
    name: 'email',
    label: 'Email',
    type: 'email' as const,
    required: true,
    placeholder: 'Enter your email',
    validation: {
      required: 'Email is required',
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email',
      },
    },
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password' as const,
    required: true,
    validation: {
      required: 'Password is required',
      minLength: { value: 8, message: 'Password must be at least 8 characters' },
    },
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select' as const,
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'user', label: 'User' },
    ],
  },
  {
    name: 'bio',
    label: 'Bio',
    type: 'textarea' as const,
    rows: 4,
    placeholder: 'Tell us about yourself',
  },
];

<Form
  fields={fields}
  onSubmit={async (data) => {
    await saveUser(data);
  }}
  onChange={(data, isValid) => console.log(data, isValid)}
  submitLabel="Save User"
  validateOn="change"
/>;
```

### Input

```tsx
// Basic input
<Input label="Username" placeholder="Enter username" />

// With validation
<Input
  label="Email"
  type="email"
  error="Please enter a valid email"
  helperText="We'll never share your email"
/>

// With icons
<Input leftIcon={<SearchIcon />} placeholder="Search..." />
<Input rightIcon={<CalendarIcon />} type="date" />

// Variants
<Input variant="filled" label="Filled Input" />
<Input variant="outlined" label="Outlined Input" />
<Input variant="underlined" label="Underlined Input" />

// Sizes
<Input inputSize="sm" label="Small" />
<Input inputSize="md" label="Medium" />
<Input inputSize="lg" label="Large" />
```

### Breadcrumbs

```tsx
const items = [
  { label: 'Home', href: '/' },
  { label: 'Farms', href: '/farms' },
  { label: 'Farm Details' }, // Current page, no href
];

<Breadcrumbs items={items} />

// Custom separator
<Breadcrumbs items={items} separator=">" />

// With click handler
<Breadcrumbs
  items={items}
  onItemClick={(item, index) => navigate(item.href)}
/>

// Limit items shown
<Breadcrumbs items={manyItems} maxItems={4} />

// With icons
<Breadcrumbs
  items={[
    { label: 'Home', href: '/', icon: <HomeIcon /> },
    { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  ]}
/>
```

### Content Density

```tsx
// Wrap your app
<ContentDensityProvider defaultDensity="comfortable">
  <App />
</ContentDensityProvider>;

// Use in components
function MyComponent() {
  const { density, setDensity } = useContentDensity();

  return (
    <div className={getDensityClasses(density)}>
      <p>Content adapts to density: {density}</p>
    </div>
  );
}

// Toggle component
<DensityToggle />;
```

## Hooks

### useScrollAnimation

```tsx
function FadeInSection() {
  const { ref, isInView } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
    delay: 100,
  });

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500',
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      )}
    >
      Content fades in when scrolled into view
    </div>
  );
}
```

### useFocusTrap

```tsx
function Modal({ isOpen, onClose }) {
  const { ref, active } = useFocusTrap({
    enabled: isOpen,
    initialFocus: true,
    returnFocus: true,
  });

  return (
    <div ref={ref} role="dialog" aria-modal="true">
      {/* Modal content - focus is trapped here */}
    </div>
  );
}
```

### useSwipe

```tsx
function SwipeableCard({ onSwipeLeft, onSwipeRight }) {
  const { ref, swipeDirection } = useSwipe({
    threshold: 50,
    timeout: 300,
  });

  useEffect(() => {
    if (swipeDirection === 'left') onSwipeLeft();
    if (swipeDirection === 'right') onSwipeRight();
  }, [swipeDirection]);

  return <div ref={ref}>Swipe me</div>;
}
```

### usePullToRefresh

```tsx
function PullToRefreshList() {
  const { ref, pullDistance, isRefreshing } = usePullToRefresh(
    async () => {
      await refreshData();
    },
    { threshold: 80 }
  );

  return (
    <div ref={ref} className="overflow-auto h-full">
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {isRefreshing && <Spinner />}
        <ListItems />
      </div>
    </div>
  );
}
```

### useMediaQuery

```tsx
function ResponsiveComponent() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}

// Responsive values
const columns = useResponsiveValue({
  default: 1,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
});
```

### useLiveRegion

```tsx
function FormWithAnnouncements() {
  const { announceSuccess, announceError, announceLoading } = useLiveRegion();

  const handleSubmit = async () => {
    announceLoading('Saving your changes');
    try {
      await saveData();
      announceSuccess('Changes saved successfully');
    } catch {
      announceError('Failed to save changes');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### useAnimatedNumber

```tsx
function AnimatedStat({ value }) {
  const { value: animatedValue } = useAnimatedNumber(value, 1000);

  return <span>{animatedValue.toLocaleString()}</span>;
}
```

## Design Tokens

```tsx
import { colors, spacing, shadows, borderRadius } from '@farmers-boot/shared/components';

// Use in inline styles
<div style={{ color: colors.primary.DEFAULT }} />

// Use with Tailwind
<div className="bg-[hsl(142,76%,36%)]" />

// CSS Custom Properties
// Import generateCSSVariables() to inject CSS variables
```

## Utility Functions

```tsx
import { cn } from '@farmers-boot/shared/components';

// Conditional classes
cn('base-class', isActive && 'active-class', { conditional: true });

// Merge Tailwind classes
import { twMerge } from '@farmers-boot/shared/components';
twMerge('px-4 py-2', 'p-0'); // Results in 'p-0'
```

## Accessibility

All components are built with accessibility in mind:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Reduced motion support
- High contrast mode support

## Migration Guide

### From inline components to shared components:

```tsx
// Before (in Dashboard.tsx)
<button className="bg-green-600 text-white px-4 py-2 rounded">Save</button>;

// After
import { Button } from '@farmers-boot/shared/components';

<Button variant="primary">Save</Button>;
```

### Using design tokens instead of hardcoded values:

```tsx
// Before
<div className="text-green-600 bg-gray-50 p-4">

// After
<div className="text-[hsl(142,76%,36%)] bg-[hsl(210,40%,96%)] p-4">
  {/* Or use the Card component */}
  <Card variant="default" padding="md">
```

## Best Practices

1. **Always use shared components** instead of creating inline styles
2. **Use design tokens** for consistency
3. **Implement accessibility features** using provided hooks
4. **Support content density** in data-heavy interfaces
5. **Use animations sparingly** and respect reduced motion preferences
6. **Test on mobile** using the responsive hooks
7. **Provide loading states** for async operations
