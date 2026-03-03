/**
 * LIVE REGION HOOK
 * ================
 * ARIA live region for screen reader announcements
 */

import { useCallback, useRef, useEffect } from 'react';

type AnnouncePriority = 'polite' | 'assertive';

interface LiveRegionOptions {
  priority?: AnnouncePriority;
  clearAfter?: number;
}

export function useLiveRegion() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  // Create the live region element if it doesn't exist
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Check if live region already exists
    let region = document.getElementById('fb-live-region') as HTMLDivElement | null;

    if (!region) {
      region = document.createElement('div');
      region.id = 'fb-live-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.position = 'absolute';
      region.style.left = '-10000px';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';
      document.body.appendChild(region);
    }

    regionRef.current = region;

    return () => {
      // Don't remove on unmount, other components might use it
    };
  }, []);

  const announce = useCallback((message: string, options: LiveRegionOptions = {}): void => {
    const { priority = 'polite', clearAfter = 1000 } = options;
    const region = regionRef.current;

    if (!region) return;

    // Set priority
    region.setAttribute('aria-live', priority);

    // Clear previous message
    region.textContent = '';

    // Set new message (use setTimeout to ensure screen reader picks up the change)
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // Clear after specified time
    if (clearAfter > 0) {
      setTimeout(() => {
        region.textContent = '';
      }, clearAfter);
    }
  }, []);

  const announceLoading = useCallback(
    (message: string = 'Loading'): void => {
      announce(`${message}...`, { priority: 'polite' });
    },
    [announce]
  );

  const announceSuccess = useCallback(
    (message: string): void => {
      announce(message, { priority: 'polite' });
    },
    [announce]
  );

  const announceError = useCallback(
    (message: string): void => {
      announce(message, { priority: 'assertive' });
    },
    [announce]
  );

  return {
    announce,
    announceLoading,
    announceSuccess,
    announceError,
  };
}

/**
 * Hook for announcing route changes
 */
export function useRouteAnnouncement(pageName: string): void {
  const { announce } = useLiveRegion();

  useEffect(() => {
    announce(`Navigated to ${pageName}`, { priority: 'polite', clearAfter: 2000 });
  }, [pageName, announce]);
}

/**
 * Hook for announcing async operations
 */
export function useAsyncAnnouncement() {
  const { announceLoading, announceSuccess, announceError } = useLiveRegion();

  const wrapAsync = useCallback(
    async <T>(
      promise: Promise<T>,
      messages: {
        loading?: string;
        success?: string;
        error?: string;
      } = {}
    ): Promise<T> => {
      const { loading = 'Loading', success, error = 'An error occurred' } = messages;

      announceLoading(loading);

      try {
        const result = await promise;
        if (success) {
          announceSuccess(success);
        }
        return result;
      } catch (err) {
        announceError(error);
        throw err;
      }
    },
    [announceLoading, announceSuccess, announceError]
  );

  return { wrapAsync };
}
