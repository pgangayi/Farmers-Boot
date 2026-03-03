/**
 * SWIPE HOOK
 * ==========
 * Touch swipe detection for mobile interactions
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type { UseSwipeOptions, UseSwipeResult } from '../types';

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

export function useSwipe<T extends HTMLElement = HTMLDivElement>(
  options: UseSwipeOptions = {}
): UseSwipeResult & { ref: React.RefObject<T> } {
  const { threshold = 50, timeout = 300, preventDefault = false } = options;

  const ref = useRef<T>(null);
  const swipeState = useRef<SwipeState | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(
    null
  );
  const [swipeProgress, setSwipeProgress] = useState(0);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
    };
    setSwipeDirection(null);
    setSwipeProgress(0);
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!swipeState.current) return;

      const touch = event.touches[0];
      swipeState.current.currentX = touch.clientX;
      swipeState.current.currentY = touch.clientY;

      const deltaX = touch.clientX - swipeState.current.startX;
      const deltaY = touch.clientY - swipeState.current.startY;

      // Calculate progress (0 to 1)
      const progress = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / threshold, 1);
      setSwipeProgress(progress);

      if (preventDefault && progress > 0.1) {
        event.preventDefault();
      }
    },
    [threshold, preventDefault]
  );

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.current) return;

    const { startX, startY, startTime, currentX, currentY } = swipeState.current;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const elapsed = Date.now() - startTime;

    // Check if swipe was fast enough
    if (elapsed > timeout) {
      swipeState.current = null;
      setSwipeProgress(0);
      return;
    }

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < threshold) {
      // Swipe was too short
      swipeState.current = null;
      setSwipeProgress(0);
      return;
    }

    let direction: 'left' | 'right' | 'up' | 'down';

    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setSwipeDirection(direction);
    swipeState.current = null;

    // Reset progress after a delay
    setTimeout(() => {
      setSwipeProgress(0);
    }, 150);
  }, [threshold, timeout]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return { ref, swipeDirection, swipeProgress };
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh<T extends HTMLElement = HTMLDivElement>(
  onRefresh: () => void | Promise<void>,
  options: { threshold?: number; maxPull?: number } = {}
) {
  const { threshold = 80, maxPull = 150 } = options;
  const ref = useRef<T>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull if at top of scroll
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      const dampedDistance = Math.min(distance * 0.5, maxPull);

      setPullDistance(dampedDistance);

      if (dampedDistance > 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }

      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, onRefresh, threshold, maxPull]);

  return {
    ref,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
}
