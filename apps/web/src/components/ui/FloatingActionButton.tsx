import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './button';

export interface FloatingActionButtonProps extends Omit<ButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
}

const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, position = 'bottom-right', size = 'md', children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6',
    };

    const sizeClasses = {
      sm: 'h-12 w-12',
      md: 'h-14 w-14',
      lg: 'h-16 w-16',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105',
          positionClasses[position],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

export { FloatingActionButton };
