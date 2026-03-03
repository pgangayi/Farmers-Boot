/**
 * SCROLL ANIMATION COMPONENTS
 * ===========================
 * React components for scroll-based animations using Intersection Observer.
 */

import * as React from 'react';
import { cn } from '../../lib/utils';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

// ============================================================================
// ANIMATED SECTION COMPONENT
// ============================================================================

interface AnimatedSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

export function AnimatedSection({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 500,
  threshold = 0.1,
  className,
  ...props
}: AnimatedSectionProps) {
  const { ref, isInView } = useScrollAnimation<HTMLDivElement>({
    threshold,
    delay,
  });

  const animationClasses: Record<string, string> = {
    'fade-in': 'opacity-0',
    'slide-up': 'opacity-0 translate-y-8',
    'slide-down': 'opacity-0 -translate-y-8',
    'slide-left': 'opacity-0 translate-x-8',
    'slide-right': 'opacity-0 -translate-x-8',
    scale: 'opacity-0 scale-95',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all',
        animationClasses[animation],
        isInView && 'opacity-100 translate-y-0 translate-x-0 scale-100',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// STAGGER CONTAINER COMPONENT
// ============================================================================

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 100,
  initialDelay = 0,
  className,
  ...props
}: StaggerContainerProps) {
  const { ref, isInView } = useScrollAnimation<HTMLDivElement>();
  const childrenArray = React.Children.toArray(children);

  return (
    <div ref={ref} className={className} {...props}>
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-500',
            'opacity-0 translate-y-4',
            isInView && 'opacity-100 translate-y-0'
          )}
          style={{
            transitionDelay: isInView ? `${initialDelay + index * staggerDelay}ms` : '0ms',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// REVEAL ON SCROLL WRAPPER
// ============================================================================

interface RevealOnScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function RevealOnScroll({
  children,
  direction = 'up',
  distance = 30,
  duration = 600,
  delay = 0,
  className,
  ...props
}: RevealOnScrollProps) {
  const { ref, isInView } = useScrollAnimation<HTMLDivElement>({ delay });

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(${distance}px)`;
      case 'down':
        return `translateY(-${distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(-${distance}px)`;
      default:
        return `translateY(${distance}px)`;
    }
  };

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translate(0)' : getInitialTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ANIMATED LIST COMPONENT
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

export function AnimatedList<T>({
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
        <AnimatedSection
          key={keyExtractor(item)}
          animation="slide-up"
          delay={index * staggerDelay}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </AnimatedSection>
      ))}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { useScrollAnimation } from '../../hooks/useScrollAnimation';
