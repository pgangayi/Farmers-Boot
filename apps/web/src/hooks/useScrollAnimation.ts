/**
 * SCROLL ANIMATION HOOK
 * ======================
 * Custom hook for triggering animations when elements enter the viewport.
 * Uses Intersection Observer for efficient scroll-based animations.
 */

import { useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

interface ScrollAnimationResult {
  ref: React.RefObject<HTMLElement>;
  isInView: boolean;
  hasAnimated: boolean;
}

// ============================================================================
// USE SCROLL ANIMATION HOOK
// ============================================================================

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
): ScrollAnimationResult & { ref: React.RefObject<T> } {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsInView(true);
              setHasAnimated(true);
            }, delay);
          } else {
            setIsInView(true);
            setHasAnimated(true);
          }

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce && entry) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return { ref, isInView, hasAnimated };
}

// ============================================================================
// USE STAGGER ANIMATION HOOK
// ============================================================================

export function useStaggerAnimation(itemCount: number, baseDelay: number = 100): number[] {
  return Array.from({ length: itemCount }, (_, i) => i * baseDelay);
}

// ============================================================================
// USE PARALLAX HOOK
// ============================================================================

interface UseParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: UseParallaxOptions = {}
): { ref: React.RefObject<T>; transform: string } {
  const { speed = 0.5, direction = 'up' } = options;
  const ref = useRef<T>(null);
  const [transform, setTransform] = useState('translateY(0px)');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (scrollProgress - 0.5) * speed * 100;
      const finalOffset = direction === 'up' ? -offset : offset;
      setTransform(`translateY(${finalOffset}px)`);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed, direction]);

  return { ref, transform };
}

// ============================================================================
// USE SCROLL PROGRESS HOOK
// ============================================================================

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(Math.max(scrollProgress, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return progress;
}

// ============================================================================
// USE INFINITE SCROLL HOOK
// ============================================================================

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseInfiniteScrollOptions
): React.RefObject<T> {
  const { onLoadMore, hasMore, isLoading, threshold = 100 } = options;
  const ref = useRef<T>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && hasMore && !isLoading && !isFetching.current) {
          isFetching.current = true;
          onLoadMore();
          setTimeout(() => {
            isFetching.current = false;
          }, 500);
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isLoading, threshold]);

  return ref;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useScrollAnimation;
