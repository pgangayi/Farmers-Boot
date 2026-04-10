import { useCallback, useRef } from 'react';

/**
 * View Transitions API Hook
 * ==========================
 * Smooth page/section transitions using the native View Transitions API.
 * Falls back gracefully on unsupported browsers.
 */

export interface ViewTransitionOptions {
  duration?: number;
  easing?: string;
}

export function useViewTransition() {
  const isSupported = useRef(
    typeof document !== 'undefined' && 'startViewTransition' in document
  );

  const startTransition = useCallback(
    async (callback: () => void | Promise<void>, options?: ViewTransitionOptions) => {
      if (!isSupported.current) {
        // Fallback: just run the callback
        await callback();
        return;
      }

      // Apply custom duration/easing via CSS if needed
      if (options) {
        const root = document.documentElement;
        if (options.duration) {
          root.style.setProperty('--view-transition-duration', `${options.duration}ms`);
        }
        if (options.easing) {
          root.style.setProperty('--view-transition-easing', options.easing);
        }
      }

      // Start the view transition
      const transition = (document as Document & { startViewTransition?: (cb: () => void | Promise<void>) => { ready: Promise<void>; finished: Promise<void> } }).startViewTransition?.(callback);
      
      if (!transition) {
        await callback();
        return;
      }

      // Wait for transition to be ready (DOM captured)
      await transition.ready;

      // Wait for transition to finish
      await transition.finished;

      // Clean up custom properties
      if (options) {
        const root = document.documentElement;
        root.style.removeProperty('--view-transition-duration');
        root.style.removeProperty('--view-transition-easing');
      }
    },
    []
  );

  const navigateWithTransition = useCallback(
    async (navigate: () => void, options?: ViewTransitionOptions) => {
      await startTransition(navigate, options);
    },
    [startTransition]
  );

  return {
    isSupported: isSupported.current,
    startTransition,
    navigateWithTransition,
  };
}

/**
 * Hook for element-level view transitions
 * Useful for list reordering, image galleries, etc.
 */
export function useElementTransition(name: string) {
  const ref = useRef<HTMLElement>(null);

  const setTransitionName = useCallback((newName?: string) => {
    if (ref.current) {
      ref.current.style.viewTransitionName = newName || name;
    }
  }, [name]);

  const clearTransitionName = useCallback(() => {
    if (ref.current) {
      ref.current.style.viewTransitionName = 'none';
    }
  }, []);

  return {
    ref,
    style: { viewTransitionName: name } as React.CSSProperties,
    setTransitionName,
    clearTransitionName,
  };
}

export default useViewTransition;
