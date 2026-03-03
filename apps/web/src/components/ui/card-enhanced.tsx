/**
 * ENHANCED CARD COMPONENT
 * ========================
 * Card component with improved animations, hover effects,
 * and visual depth for a premium user experience.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

// ============================================================================
// BASE CARD COMPONENT
// ============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  interactive?: boolean;
  hover?: 'lift' | 'scale' | 'glow' | 'border' | 'none';
  animate?: 'fade-in' | 'slide-up' | 'scale-in' | 'none';
  delay?: number;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      hover = 'lift',
      animate = 'none',
      delay = 0,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: 'bg-card text-card-foreground border shadow-sm',
      elevated: 'bg-card text-card-foreground shadow-lg shadow-black/5',
      outlined: 'bg-card text-card-foreground border-2',
      glass: 'glass text-card-foreground',
      gradient: 'bg-gradient-to-br from-primary/5 to-accent/5 border',
    };

    const hoverClasses = {
      lift: interactive
        ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 transition-all duration-300'
        : '',
      scale: interactive ? 'hover:scale-[1.02] transition-transform duration-300' : '',
      glow: interactive
        ? 'hover:shadow-glow hover:border-primary/30 transition-all duration-300'
        : '',
      border: interactive ? 'hover:border-primary/50 transition-colors duration-300' : '',
      none: '',
    };

    const animateClasses = {
      'fade-in': 'animate-fade-in',
      'slide-up': 'animate-fade-in-up',
      'scale-in': 'animate-scale-in',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl overflow-hidden',
          variantClasses[variant],
          hoverClasses[hover],
          animateClasses[animate],
          interactive && 'cursor-pointer',
          className
        )}
        style={{
          animationDelay: delay ? `${delay}ms` : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// CARD HEADER
// ============================================================================

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD TITLE
// ============================================================================

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

// ============================================================================
// CARD CONTENT
// ============================================================================

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER
// ============================================================================

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  animateValue?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      subValue,
      icon,
      trend,
      color = 'default',
      loading = false,
      interactive = false,
      onClick,
      animateValue = true,
      ...props
    },
    ref
  ) => {
    const colorClasses = {
      default: {
        bg: 'bg-muted',
        icon: 'text-muted-foreground',
        accent: 'text-foreground',
      },
      primary: {
        bg: 'bg-primary/10',
        icon: 'text-primary',
        accent: 'text-primary',
      },
      success: {
        bg: 'bg-success/10',
        icon: 'text-success',
        accent: 'text-success',
      },
      warning: {
        bg: 'bg-warning/10',
        icon: 'text-warning',
        accent: 'text-warning',
      },
      destructive: {
        bg: 'bg-destructive/10',
        icon: 'text-destructive',
        accent: 'text-destructive',
      },
    };

    const colors = colorClasses[color];

    // Animated counter
    const [displayValue, setDisplayValue] = React.useState(0);
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;

    React.useEffect(() => {
      if (!animateValue || loading) return;

      const duration = 1000;
      const steps = 60;
      const stepValue = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stepValue;
        if (current >= numericValue) {
          setDisplayValue(numericValue);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [numericValue, animateValue, loading]);

    if (loading) {
      return (
        <Card ref={ref} className={cn('h-full', className)} variant="elevated" {...props}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        ref={ref}
        className={cn(
          'h-full transition-all duration-300',
          interactive && 'cursor-pointer hover:shadow-lg',
          className
        )}
        variant="elevated"
        onClick={onClick}
        {...props}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className={cn('text-3xl font-bold', colors.accent)}>
                  {animateValue && typeof value === 'number'
                    ? displayValue.toLocaleString()
                    : value}
                </h3>
                {trend && (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      trend.isPositive ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}
                    {trend.value}%
                  </span>
                )}
              </div>
              {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
            </div>
            {icon && (
              <div
                className={cn(
                  'p-3 rounded-xl',
                  colors.bg,
                  'transition-transform duration-300 group-hover:scale-110'
                )}
              >
                <span className={colors.icon}>{icon}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'pink';
  gradient?: boolean;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      className,
      title,
      description,
      icon,
      action,
      color = 'green',
      gradient = false,
      children,
      ...props
    },
    ref
  ) => {
    const colorMap = {
      green: {
        bg: 'bg-green-500',
        bgLight: 'bg-green-50',
        text: 'text-green-600',
        gradient: 'from-green-500 to-emerald-600',
      },
      blue: {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        text: 'text-blue-600',
        gradient: 'from-blue-500 to-indigo-600',
      },
      orange: {
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-50',
        text: 'text-orange-600',
        gradient: 'from-orange-500 to-amber-600',
      },
      purple: {
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-50',
        text: 'text-purple-600',
        gradient: 'from-purple-500 to-violet-600',
      },
      pink: {
        bg: 'bg-pink-500',
        bgLight: 'bg-pink-50',
        text: 'text-pink-600',
        gradient: 'from-pink-500 to-rose-600',
      },
    };

    const colors = colorMap[color];

    return (
      <Card
        ref={ref}
        className={cn(
          'group overflow-hidden transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1',
          className
        )}
        interactive
        {...props}
      >
        <div
          className={cn('h-2 w-full', gradient ? `bg-gradient-to-r ${colors.gradient}` : colors.bg)}
        />
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
                colors.bgLight
              )}
            >
              <span className={colors.text}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>
          </div>
          {children && <div className="mt-4 pt-4 border-t">{children}</div>}
          {action && <div className="mt-4">{action}</div>}
        </CardContent>
      </Card>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

// ============================================================================
// INFO CARD COMPONENT
// ============================================================================

interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const InfoCard = React.forwardRef<HTMLDivElement, InfoCardProps>(
  (
    {
      className,
      title,
      variant = 'info',
      icon,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      info: {
        border: 'border-info/20',
        bg: 'bg-info/5',
        icon: 'text-info',
      },
      success: {
        border: 'border-success/20',
        bg: 'bg-success/5',
        icon: 'text-success',
      },
      warning: {
        border: 'border-warning/20',
        bg: 'bg-warning/5',
        icon: 'text-warning',
      },
      error: {
        border: 'border-destructive/20',
        bg: 'bg-destructive/5',
        icon: 'text-destructive',
      },
    };

    const colors = variantClasses[variant];

    return (
      <div
        ref={ref}
        className={cn('rounded-lg border p-4', colors.border, colors.bg, className)}
        {...props}
      >
        <div className="flex gap-3">
          {icon && <div className={colors.icon}>{icon}</div>}
          <div className="flex-1 min-w-0">
            {title && <h4 className="font-medium mb-1">{title}</h4>}
            <div className="text-sm">{children}</div>
          </div>
          {dismissible && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
);

InfoCard.displayName = 'InfoCard';

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: string;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, label, value, change, icon, color = 'bg-primary', ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'hover:shadow-lg hover:-translate-y-0.5',
          className
        )}
        variant="elevated"
        {...props}
      >
        <div className={cn('absolute top-0 left-0 w-1 h-full', color)} />
        <CardContent className="p-5 pl-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
              <div className="text-2xl font-bold">{value}</div>
              {change && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={change.isPositive ? 'text-success' : 'text-destructive'}>
                    {change.isPositive ? '↑' : '↓'} {change.value}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last period</span>
                </div>
              )}
            </div>
            {icon && (
              <div
                className={cn('p-2.5 rounded-lg bg-opacity-10', color.replace('bg-', 'bg-'))}
                style={{
                  backgroundColor: color.startsWith('bg-')
                    ? `var(--tw-colors-${color.replace('bg-', '')})`
                    : undefined,
                }}
              >
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

MetricCard.displayName = 'MetricCard';

// ============================================================================
// EXPORTS
// ============================================================================

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  FeatureCard,
  InfoCard,
  MetricCard,
};
