/**
 * BUTTON COMPONENT
 * ================
 * Enhanced button with animations, ripple effects, and accessibility
 */

import { forwardRef, useCallback } from 'react';
import { cn } from './utils/classNames';
import { useRipple } from './utils/animations';
import type { ButtonProps } from './types';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

const buttonVariants = {
  base: `
    inline-flex items-center justify-center whitespace-nowrap font-medium
    transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98] active:translate-y-[1px]
    relative overflow-hidden
  `,

  // Color variants
  variants: {
    default: `
      bg-[hsl(142,76%,36%)] text-white
      hover:bg-[hsl(142,76%,30%)] hover:shadow-lg
      focus-visible:ring-[hsl(142,76%,36%)]
      active:bg-[hsl(142,76%,26%)]
    `,
    primary: `
      bg-[hsl(142,76%,36%)] text-white
      hover:bg-[hsl(142,76%,30%)] hover:shadow-lg hover:shadow-[hsl(142,76%,36%)/0.25]
      focus-visible:ring-[hsl(142,76%,36%)]
      active:bg-[hsl(142,76%,26%)]
    `,
    secondary: `
      bg-[hsl(210,40%,96%)] text-[hsl(222.2,84%,4.9%)]
      hover:bg-[hsl(210,40%,90%)]
      focus-visible:ring-[hsl(210,40%,80%)]
      active:bg-[hsl(210,40%,85%)]
    `,
    success: `
      bg-[hsl(142,71%,45%)] text-white
      hover:bg-[hsl(142,71%,40%)] hover:shadow-lg hover:shadow-[hsl(142,71%,45%)/0.25]
      focus-visible:ring-[hsl(142,71%,45%)]
      active:bg-[hsl(142,71%,35%)]
    `,
    warning: `
      bg-[hsl(38,92%,50%)] text-white
      hover:bg-[hsl(38,92%,45%)] hover:shadow-lg hover:shadow-[hsl(38,92%,50%)/0.25]
      focus-visible:ring-[hsl(38,92%,50%)]
      active:bg-[hsl(38,92%,40%)]
    `,
    destructive: `
      bg-[hsl(0,84.2%,60.2%)] text-white
      hover:bg-[hsl(0,84.2%,55%)] hover:shadow-lg hover:shadow-[hsl(0,84.2%,60.2%)/0.25]
      focus-visible:ring-[hsl(0,84.2%,60.2%)]
      active:bg-[hsl(0,84.2%,50%)]
    `,
    info: `
      bg-[hsl(217,91%,60%)] text-white
      hover:bg-[hsl(217,91%,55%)] hover:shadow-lg hover:shadow-[hsl(217,91%,60%)/0.25]
      focus-visible:ring-[hsl(217,91%,60%)]
      active:bg-[hsl(217,91%,50%)]
    `,
    outline: `
      border-2 border-[hsl(214.3,31.8%,91.4%)] bg-transparent
      text-[hsl(222.2,84%,4.9%)]
      hover:bg-[hsl(210,40%,96%)] hover:border-[hsl(142,76%,36%)]
      focus-visible:ring-[hsl(142,76%,36%)]
      active:bg-[hsl(210,40%,90%)]
    `,
    ghost: `
      bg-transparent text-[hsl(222.2,84%,4.9%)]
      hover:bg-[hsl(210,40%,96%)]
      focus-visible:ring-[hsl(210,40%,80%)]
      active:bg-[hsl(210,40%,90%)]
    `,
    link: `
      bg-transparent text-[hsl(142,76%,36%)] underline-offset-4
      hover:underline
      focus-visible:ring-[hsl(142,76%,36%)]
      active:text-[hsl(142,76%,26%)]
    `,
    gradient: `
      bg-gradient-to-r from-[hsl(142,76%,36%)] to-[hsl(37,91%,55%)] text-white
      hover:shadow-lg hover:shadow-[hsl(142,76%,36%)/0.25] hover:brightness-105
      focus-visible:ring-[hsl(142,76%,36%)]
      active:brightness-95
    `,
    glass: `
      bg-white/80 backdrop-blur-sm text-[hsl(222.2,84%,4.9%)]
      border border-white/20
      hover:bg-white/90 hover:shadow-lg
      focus-visible:ring-[hsl(214.3,31.8%,91.4%)]
      active:bg-white/70
      dark:bg-black/50 dark:hover:bg-black/60 dark:border-white/10
    `,
  },

  // Size variants
  sizes: {
    xs: 'h-7 px-2 text-xs gap-1 rounded-[calc(0.625rem-4px)]',
    sm: 'h-9 px-3 text-sm gap-1.5 rounded-[calc(0.625rem-2px)]',
    md: 'h-10 px-4 text-sm gap-2 rounded-[0.625rem]',
    lg: 'h-11 px-6 text-base gap-2 rounded-[0.625rem]',
    xl: 'h-12 px-8 text-base gap-3 rounded-[calc(0.625rem+4px)]',
  },

  // Animation variants
  animations: {
    none: '',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce-subtle',
    glow: 'animate-glow',
  },
};

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      animation = 'none',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      ripple = true,
      fullWidth = false,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { ripples, createRipple } = useRipple();

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (ripple && !isLoading && !disabled) {
          createRipple(event);
        }
        onClick?.(event);
      },
      [ripple, isLoading, disabled, createRipple, onClick]
    );

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants.base,
          buttonVariants.variants[variant as keyof typeof buttonVariants.variants],
          buttonVariants.sizes[size],
          buttonVariants.animations[animation],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple Effects */}
        {ripple &&
          ripples.map((r) => (
            <span
              key={r.id}
              className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
              style={{
                left: r.x,
                top: r.y,
                width: 20,
                height: 20,
                marginLeft: -10,
                marginTop: -10,
              }}
            />
          ))}

        {/* Loading State */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}

        {/* Button Content */}
        <span
          className={cn(
            'flex items-center gap-2 transition-opacity duration-200',
            isLoading && 'opacity-0'
          )}
        >
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {isLoading && loadingText ? loadingText : children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// ICON BUTTON COMPONENT
// ============================================================================

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'size'> {
  icon: React.ReactNode;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <Button
        ref={ref}
        className={cn(sizeClasses[size], 'p-0', className)}
        aria-label={label}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({ children, className, orientation = 'horizontal' }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal'
          ? 'flex-row [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:last-child)]:border-r-0'
          : 'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:not(:last-child)]:border-b-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// FLOATING ACTION BUTTON
// ============================================================================

interface FloatingActionButtonProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: number;
}

export const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = 'bottom-right', offset = 24, className, children, ...props }, ref) => {
    const positionStyles = {
      'bottom-right': { bottom: offset, right: offset },
      'bottom-left': { bottom: offset, left: offset },
      'top-right': { top: offset, right: offset },
      'top-left': { top: offset, left: offset },
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'fixed h-14 w-14 rounded-full shadow-lg shadow-[hsl(142,76%,36%)/0.3]',
          'hover:shadow-xl hover:shadow-[hsl(142,76%,36%)/0.4]',
          'transition-all duration-300 hover:scale-110 z-50',
          className
        )}
        style={positionStyles[position]}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

export default Button;
