/**
 * ENHANCED BUTTON COMPONENT
 * ==========================
 * Button component with improved animations, micro-interactions,
 * and accessibility features.
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

const buttonVariants = cva(
  [
    // Base styles
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'ring-offset-background transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    // Active state
    'active:scale-[0.98] active:translate-y-[1px]',
    // Position for ripple effect
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25',
          'active:bg-primary/95',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25',
          'active:bg-destructive/95',
        ],
        outline: [
          'border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground hover:border-accent',
          'active:bg-accent/80',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/80',
          'active:bg-secondary/70',
        ],
        ghost: ['hover:bg-accent hover:text-accent-foreground', 'active:bg-accent/80'],
        link: ['text-primary underline-offset-4 hover:underline', 'active:text-primary/80'],
        // Farm-specific variants
        success: [
          'bg-success text-success-foreground',
          'hover:bg-success/90 hover:shadow-lg hover:shadow-success/25',
          'active:bg-success/95',
        ],
        warning: [
          'bg-warning text-warning-foreground',
          'hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/25',
          'active:bg-warning/95',
        ],
        gradient: [
          'bg-gradient-to-r from-primary to-accent text-white',
          'hover:shadow-lg hover:shadow-primary/25 hover:brightness-105',
          'active:brightness-95',
        ],
        glass: [
          'bg-white/80 backdrop-blur-sm text-foreground',
          'border border-white/20',
          'hover:bg-white/90 hover:shadow-lg',
          'active:bg-white/70',
          'dark:bg-black/50 dark:hover:bg-black/60 dark:border-white/10',
        ],
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-7 rounded px-2 text-xs gap-1',
        sm: 'h-9 rounded-md px-3 gap-1.5',
        lg: 'h-11 rounded-md px-8 gap-2 text-base',
        xl: 'h-12 rounded-lg px-10 gap-2 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse-subtle',
        bounce: 'animate-bounce-subtle',
        glow: 'animate-glow',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
);

// ============================================================================
// TYPES
// ============================================================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
}

// ============================================================================
// RIPPLE EFFECT HOOK
// ============================================================================

function useRipple() {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  const createRipple = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  }, []);

  return { ripples, createRipple };
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      animation,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      ripple = true,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { ripples, createRipple } = useRipple();
    const Comp = asChild ? Slot : 'button';

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (ripple && !isLoading && !disabled) {
          createRipple(event);
        }
        onClick?.(event);
      },
      [ripple, isLoading, disabled, createRipple, onClick]
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple Effects */}
        {ripple &&
          ripples.map(ripple => (
            <span
              key={ripple.id}
              className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 20,
                height: 20,
                marginLeft: -10,
                marginTop: -10,
              }}
            />
          ))}

        {/* Loading State */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
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
      </Comp>
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
  size?: 'sm' | 'default' | 'lg';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'default', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      default: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <Button
        ref={ref}
        size="icon"
        className={cn(sizeClasses[size], className)}
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
// ACTION BUTTON COMPONENT (With Tooltip)
// ============================================================================

interface ActionButtonProps extends ButtonProps {
  tooltip?: string;
  shortcut?: string;
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ tooltip, shortcut, className, ...props }, ref) => {
    return (
      <div className="group relative inline-flex">
        <Button ref={ref} className={className} {...props} />
        {tooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {tooltip}
            {shortcut && <span className="ml-1 text-muted-foreground">({shortcut})</span>}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
          </div>
        )}
      </div>
    );
  }
);

ActionButton.displayName = 'ActionButton';

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

function ButtonGroup({ children, className, orientation = 'horizontal' }: ButtonGroupProps) {
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
// FLOATING ACTION BUTTON COMPONENT
// ============================================================================

interface FloatingActionButtonProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: number;
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = 'bottom-right', offset = 24, className, children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': `fixed bottom-[${offset}px] right-[${offset}px]`,
      'bottom-left': `fixed bottom-[${offset}px] left-[${offset}px]`,
      'top-right': `fixed top-[${offset}px] right-[${offset}px]`,
      'top-left': `fixed top-[${offset}px] left-[${offset}px]`,
    };

    return (
      <Button
        ref={ref}
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40',
          'transition-all duration-300 hover:scale-110',
          'animate-fade-in-up',
          positionClasses[position],
          className
        )}
        style={{
          position: 'fixed',
          ...(position.includes('bottom') && { bottom: offset }),
          ...(position.includes('top') && { top: offset }),
          ...(position.includes('right') && { right: offset }),
          ...(position.includes('left') && { left: offset }),
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

// ============================================================================
// EXPORTS
// ============================================================================

export { Button, IconButton, ActionButton, ButtonGroup, FloatingActionButton, buttonVariants };
export default Button;
