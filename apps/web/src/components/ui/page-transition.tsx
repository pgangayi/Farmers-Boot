/**
 * PAGE TRANSITION COMPONENT
 * ==========================
 * Smooth page transitions with various animation effects.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type TransitionType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'flip'
  | 'none';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  className?: string;
  onEnter?: () => void;
  onExit?: () => void;
}

// ============================================================================
// TRANSITION STYLES
// ============================================================================

const transitionStyles: Record<TransitionType, { initial: string; animate: string }> = {
  fade: {
    initial: 'opacity-0',
    animate: 'opacity-100',
  },
  'slide-up': {
    initial: 'opacity-0 translate-y-8',
    animate: 'opacity-100 translate-y-0',
  },
  'slide-down': {
    initial: 'opacity-0 -translate-y-8',
    animate: 'opacity-100 translate-y-0',
  },
  'slide-left': {
    initial: 'opacity-0 translate-x-8',
    animate: 'opacity-100 translate-x-0',
  },
  'slide-right': {
    initial: 'opacity-0 -translate-x-8',
    animate: 'opacity-100 translate-x-0',
  },
  scale: {
    initial: 'opacity-0 scale-95',
    animate: 'opacity-100 scale-100',
  },
  flip: {
    initial: 'opacity-0 rotateX-15',
    animate: 'opacity-100 rotateX-0',
  },
  none: {
    initial: '',
    animate: '',
  },
};

// ============================================================================
// PAGE TRANSITION COMPONENT
// ============================================================================

const PageTransition = React.forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, type = 'fade', duration = 300, delay = 0, className, onEnter, onExit }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const styles = transitionStyles[type];

    React.useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
        onEnter?.();
      }, delay);

      return () => {
        clearTimeout(timer);
        onExit?.();
      };
    }, [delay, onEnter, onExit]);

    if (type === 'none') {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'transition-all will-change-transform',
          styles.initial,
          isVisible && styles.animate,
          className
        )}
        style={{
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </div>
    );
  }
);

PageTransition.displayName = 'PageTransition';

// ============================================================================
// STAGGERED CHILDREN TRANSITION
// ============================================================================

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
  childClassName?: string;
}

function StaggerContainer({
  children,
  staggerDelay = 100,
  initialDelay = 0,
  className,
  childClassName,
}: StaggerContainerProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <PageTransition
          key={index}
          type="slide-up"
          delay={initialDelay + index * staggerDelay}
          className={childClassName}
        >
          {child}
        </PageTransition>
      ))}
    </div>
  );
}

// ============================================================================
// LOADING TRANSITION
// ============================================================================

interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

function LoadingTransition({
  isLoading,
  children,
  loadingComponent,
  className,
}: LoadingTransitionProps) {
  const [showContent, setShowContent] = React.useState(!isLoading);
  const [showLoader, setShowLoader] = React.useState(isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setShowContent(false);
      return undefined;
    } else {
      // Small delay before showing content for smooth transition
      const timer = setTimeout(() => {
        setShowLoader(false);
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'transition-all duration-300',
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {children}
      </div>
      {showLoader && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {loadingComponent || (
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <span className="text-muted-foreground text-sm">Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ROUTE TRANSITION WRAPPER
// ============================================================================

interface RouteTransitionProps {
  children: React.ReactNode;
  location: { pathname: string };
  className?: string;
}

function RouteTransition({ children, location, className }: RouteTransitionProps) {
  const [displayChildren, setDisplayChildren] = React.useState(children);
  const [transitionStage, setTransitionStage] = React.useState<'enter' | 'exit'>('enter');

  React.useEffect(() => {
    if (location.pathname !== (displayChildren as any)?.key) {
      setTransitionStage('exit');
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location, children, displayChildren]);

  return (
    <div
      className={cn(
        'transition-all duration-200',
        transitionStage === 'enter' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

// ============================================================================
// ANIMATED LIST
// ============================================================================

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  emptyState?: React.ReactNode;
}

function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
  staggerDelay = 50,
  emptyState,
}: AnimatedListProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <PageTransition
          key={keyExtractor(item)}
          type="slide-up"
          delay={index * staggerDelay}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </PageTransition>
      ))}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { PageTransition, StaggerContainer, LoadingTransition, RouteTransition, AnimatedList };
export type { TransitionType, PageTransitionProps };
