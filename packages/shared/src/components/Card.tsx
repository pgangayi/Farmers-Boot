/**
 * CARD COMPONENT
 * ==============
 * Enhanced card with animations, hover effects, and multiple variants
 */

import { forwardRef } from 'react';
import { cn } from './utils/classNames';
import { useAnimatedNumber } from './utils/animations';
import type { CardProps, StatCardProps } from './types';

// ============================================================================
// BASE CARD COMPONENT
// ============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      hover = 'lift',
      animate = 'none',
      delay = 0,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default:
        'bg-white text-[hsl(222.2,84%,4.9%)] border border-[hsl(214.3,31.8%,91.4%)] shadow-sm',
      elevated: 'bg-white text-[hsl(222.2,84%,4.9%)] shadow-lg shadow-black/5',
      outlined: 'bg-white text-[hsl(222.2,84%,4.9%)] border-2 border-[hsl(214.3,31.8%,91.4%)]',
      glass: `
        bg-white/80 backdrop-blur-xl text-[hsl(222.2,84%,4.9%)]
        border border-white/20
        dark:bg-black/50 dark:border-white/10
      `,
      gradient:
        'bg-gradient-to-br from-[hsl(142,76%,36%,0.05)] to-[hsl(37,91%,55%,0.05)] border border-[hsl(214.3,31.8%,91.4%)]',
    };

    const hoverClasses = {
      lift: interactive
        ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 cursor-pointer'
        : '',
      scale: interactive
        ? 'hover:scale-[1.02] transition-transform duration-300 cursor-pointer'
        : '',
      glow: interactive
        ? 'hover:shadow-[0_0_20px_hsl(142,76%,36%,0.3)] hover:border-[hsl(142,76%,36%,0.3)] transition-all duration-300 cursor-pointer'
        : '',
      border: interactive
        ? 'hover:border-[hsl(142,76%,36%,0.5)] transition-colors duration-300 cursor-pointer'
        : '',
      none: '',
    };

    const animateClasses = {
      none: '',
      fade: 'animate-fade-in',
      'slide-up': 'animate-fade-in-up',
      'slide-down': 'animate-fade-in-down',
      scale: 'animate-scale-in',
      bounce: 'animate-pop-in',
    };

    const paddingClasses = {
      none: '',
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[0.625rem] overflow-hidden',
          variantClasses[variant],
          hoverClasses[hover],
          animateClasses[animate],
          paddingClasses[padding],
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

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
        {(title || subtitle || action) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg font-semibold leading-none tracking-tight text-[hsl(222.2,84%,4.9%)]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[hsl(215.4,16.3%,46.9%)] mt-1.5">{subtitle}</p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD CONTENT
// ============================================================================

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER
// ============================================================================

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0 gap-2', className)} {...props} />
  )
);

CardFooter.displayName = 'CardFooter';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
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
      animateValue = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const { value: animatedValue } = useAnimatedNumber(
      typeof numericValue === 'number' ? numericValue : 0,
      1000,
      animateValue
    );

    const colorClasses = {
      default: {
        bg: 'bg-[hsl(210,40%,96%)]',
        icon: 'text-[hsl(215.4,16.3%,46.9%)]',
        accent: 'text-[hsl(222.2,84%,4.9%)]',
      },
      primary: {
        bg: 'bg-[hsl(142,76%,36%,0.1)]',
        icon: 'text-[hsl(142,76%,36%)]',
        accent: 'text-[hsl(142,76%,36%)]',
      },
      success: {
        bg: 'bg-[hsl(142,71%,45%,0.1)]',
        icon: 'text-[hsl(142,71%,45%)]',
        accent: 'text-[hsl(142,71%,45%)]',
      },
      warning: {
        bg: 'bg-[hsl(38,92%,50%,0.1)]',
        icon: 'text-[hsl(38,92%,50%)]',
        accent: 'text-[hsl(38,92%,50%)]',
      },
      destructive: {
        bg: 'bg-[hsl(0,84.2%,60.2%,0.1)]',
        icon: 'text-[hsl(0,84.2%,60.2%)]',
        accent: 'text-[hsl(0,84.2%,60.2%)]',
      },
      info: {
        bg: 'bg-[hsl(217,91%,60%,0.1)]',
        icon: 'text-[hsl(217,91%,60%)]',
        accent: 'text-[hsl(217,91%,60%)]',
      },
      secondary: {
        bg: 'bg-[hsl(210,40%,96%)]',
        icon: 'text-[hsl(215.4,16.3%,46.9%)]',
        accent: 'text-[hsl(222.2,84%,4.9%)]',
      },
    };

    const colors = colorClasses[color];

    if (loading) {
      return (
        <Card ref={ref} className={cn('h-full', className)} variant="elevated" {...props}>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[hsl(210,40%,96%)] rounded w-1/2" />
              <div className="h-8 bg-[hsl(210,40%,96%)] rounded w-3/4" />
              <div className="h-3 bg-[hsl(210,40%,96%)] rounded w-1/3" />
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
              <p className="text-sm font-medium text-[hsl(215.4,16.3%,46.9%)]">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className={cn('text-3xl font-bold', colors.accent)}>
                  {animateValue && typeof value === 'number'
                    ? animatedValue.toLocaleString()
                    : value}
                </h3>
                {trend && (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      trend.isPositive ? 'text-[hsl(142,71%,45%)]' : 'text-[hsl(0,84.2%,60.2%)]'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}
                    {trend.value}%
                  </span>
                )}
              </div>
              {subValue && <p className="text-xs text-[hsl(215.4,16.3%,46.9%)]">{subValue}</p>}
            </div>
            {icon && (
              <div className={cn('p-3 rounded-xl transition-transform duration-300', colors.bg)}>
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

interface FeatureCardProps extends CardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'pink' | 'amber' | 'cyan';
  gradient?: boolean;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
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
        bg: 'bg-[hsl(142,76%,36%)]',
        bgLight: 'bg-[hsl(142,76%,95%)]',
        text: 'text-[hsl(142,76%,36%)]',
        gradient: 'from-[hsl(142,76%,36%)] to-[hsl(142,71%,45%)]',
      },
      blue: {
        bg: 'bg-[hsl(217,91%,60%)]',
        bgLight: 'bg-[hsl(217,91%,95%)]',
        text: 'text-[hsl(217,91%,60%)]',
        gradient: 'from-[hsl(217,91%,60%)] to-[hsl(217,91%,50%)]',
      },
      orange: {
        bg: 'bg-[hsl(24,95%,53%)]',
        bgLight: 'bg-[hsl(24,95%,95%)]',
        text: 'text-[hsl(24,95%,53%)]',
        gradient: 'from-[hsl(24,95%,53%)] to-[hsl(38,92%,50%)]',
      },
      purple: {
        bg: 'bg-[hsl(270,50%,60%)]',
        bgLight: 'bg-[hsl(270,50%,95%)]',
        text: 'text-[hsl(270,50%,60%)]',
        gradient: 'from-[hsl(270,50%,60%)] to-[hsl(270,50%,50%)]',
      },
      pink: {
        bg: 'bg-[hsl(330,60%,60%)]',
        bgLight: 'bg-[hsl(330,60%,95%)]',
        text: 'text-[hsl(330,60%,60%)]',
        gradient: 'from-[hsl(330,60%,60%)] to-[hsl(330,60%,50%)]',
      },
      amber: {
        bg: 'bg-[hsl(38,92%,50%)]',
        bgLight: 'bg-[hsl(38,92%,95%)]',
        text: 'text-[hsl(38,92%,50%)]',
        gradient: 'from-[hsl(38,92%,50%)] to-[hsl(38,92%,40%)]',
      },
      cyan: {
        bg: 'bg-[hsl(190,80%,50%)]',
        bgLight: 'bg-[hsl(190,80%,95%)]',
        text: 'text-[hsl(190,80%,50%)]',
        gradient: 'from-[hsl(190,80%,50%)] to-[hsl(190,80%,40%)]',
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
              <h3 className="font-semibold text-[hsl(222.2,84%,4.9%)] mb-1">{title}</h3>
              <p className="text-sm text-[hsl(215.4,16.3%,46.9%)] line-clamp-2">{description}</p>
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

export default Card;
