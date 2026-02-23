/**
 * REACT QUERY CONFIGURATION
 * =========================
 * Enhanced React Query setup with offline persistence and caching
 */

import { QueryClient } from '@tanstack/react-query';
import { CacheManager, SyncManager } from './offline-db';

// ============================================================================
// QUERY CLIENT CONFIGURATION
// ============================================================================

interface QueryClientOptions {
  onError?: (error: Error) => void;
}

export function createQueryClient(options: QueryClientOptions = {}) {
  const { onError } = options;

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes - data is fresh for 5 minutes
        staleTime: 1000 * 60 * 5,

        // Cache time: 30 minutes - unused data stays in cache for 30 minutes
        gcTime: 1000 * 60 * 30,

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          const status = (error as any)?.status || (error as any)?.statusCode;
          if (status >= 400 && status < 500) {
            return false;
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },

        // Exponential backoff for retries
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (can be disabled for better UX)
        refetchOnWindowFocus: false,

        // Refetch on reconnect (important for offline-first)
        refetchOnReconnect: true,

        // Don't refetch on mount if data is fresh
        refetchOnMount: true,

        // Network mode - always try to fetch, fall back to cache
        networkMode: 'online',
      },

      mutations: {
        // Retry mutations once
        retry: 1,

        // Global mutation error handler
        onError: (error: Error) => {
          console.error('[QueryClient] Mutation error:', error);
          onError?.(error);
        },
      },
    },

    // Query cache configuration
    queryCache: undefined,

    // Mutation cache configuration
    mutationCache: undefined,
  });
}

// ============================================================================
// PERSISTENCE LAYER
// ============================================================================

/**
 * Persist query data to IndexedDB for offline access
 */
export async function persistQueryData(
  queryKey: unknown[],
  data: unknown,
  tableName?: string
): Promise<void> {
  try {
    const keyString = JSON.stringify(queryKey);

    // If we have a table name, also cache in the offline database
    if (tableName && data) {
      const items = Array.isArray(data) ? data : [data];
      const cacheItems = items
        .filter((item: any) => item && item.id)
        .map((item: any) => ({
          id: item.id,
          data: item,
        }));

      if (cacheItems.length > 0) {
        await CacheManager.setAll(tableName as any, cacheItems, {
          ttl: 1000 * 60 * 60, // 1 hour
        });

        await SyncManager.updateMetadata(tableName, {
          lastSyncTime: Date.now(),
          recordCount: items.length,
        });
      }
    }
  } catch (error) {
    console.error('[QueryClient] Error persisting query data:', error);
  }
}

/**
 * Restore query data from IndexedDB
 */
export async function restoreQueryData<T>(
  tableName: string,
  queryClient: QueryClient,
  queryKey: unknown[]
): Promise<T[] | null> {
  try {
    const cachedData = await CacheManager.getAll<T>(tableName as any);

    if (cachedData.length > 0) {
      queryClient.setQueryData(queryKey, cachedData);
      return cachedData;
    }

    return null;
  } catch (error) {
    console.error('[QueryClient] Error restoring query data:', error);
    return null;
  }
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Generate query key factory for consistent key management
 */
export function createQueryKeys<T extends string>(entity: T) {
  return {
    all: [entity] as const,
    lists: () => [...createQueryKeys(entity).all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...createQueryKeys(entity).lists(), filters] as const,
    details: () => [...createQueryKeys(entity).all, 'detail'] as const,
    detail: (id: string) => [...createQueryKeys(entity).details(), id] as const,
    infinite: () => [...createQueryKeys(entity).all, 'infinite'] as const,
  } as const;
}

// Pre-defined query keys for all entities
export const queryKeys = {
  farms: createQueryKeys('farms'),
  animals: createQueryKeys('animals'),
  livestock: createQueryKeys('livestock'),
  crops: createQueryKeys('crops'),
  tasks: createQueryKeys('tasks'),
  inventory: createQueryKeys('inventory'),
  finance: createQueryKeys('finance'),
  locations: createQueryKeys('locations'),
  user: createQueryKeys('user'),
  analytics: createQueryKeys('analytics'),
  weather: createQueryKeys('weather'),
};

// ============================================================================
// OFFLINE-AWARE QUERY OPTIONS
// ============================================================================

interface OfflineQueryOptions {
  tableName?: string;
  enableOfflineCache?: boolean;
}

/**
 * Create query options with offline support
 */
export function createOfflineQueryOptions<T extends { id: string }>(
  queryKey: unknown[],
  fetchFn: () => Promise<T[]>,
  options: OfflineQueryOptions = {}
) {
  const { tableName, enableOfflineCache = true } = options;

  return {
    queryKey,
    queryFn: async () => {
      const data = await fetchFn();

      // Persist to offline cache
      if (enableOfflineCache && tableName && data) {
        await persistQueryData(queryKey, data, tableName);
      }

      return data;
    },
    // Try to restore from cache on mount if offline
    initialData: async () => {
      if (!navigator.onLine && enableOfflineCache && tableName) {
        const cached = await CacheManager.getAll<T>(tableName as any);
        if (cached.length > 0) {
          return cached;
        }
      }
      return undefined;
    },
  };
}

// ============================================================================
// MUTATION HELPERS
// ============================================================================

interface OptimisticUpdateOptions<T, TVariables> {
  queryKey: unknown[];
  getCurrentData: () => T[] | undefined;
  optimisticUpdate: (old: T[] | undefined, variables: TVariables) => T[];
  rollback: (old: T[] | undefined) => void;
  onSuccess?: (data: T, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

/**
 * Create optimistic update mutation options
 */
export function createOptimisticUpdateOptions<T extends { id: string }, TVariables>(
  options: OptimisticUpdateOptions<T, TVariables>
) {
  const { queryKey, getCurrentData, optimisticUpdate, rollback, onSuccess, onError } = options;

  return {
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches
      // This is called from the mutation context

      // Snapshot the previous value
      const previousData = getCurrentData();

      // Optimistically update to the new value
      const newData = optimisticUpdate(previousData, variables);

      return { previousData, newData };
    },
    onError: (error: Error, variables: TVariables, context: any) => {
      // Rollback to the previous value
      if (context?.previousData) {
        rollback(context.previousData);
      }
      onError?.(error, variables);
    },
    onSettled: () => {
      // Refetch after error or success
      // This should be called with queryClient.invalidateQueries
    },
    onSuccess: (data: T, variables: TVariables) => {
      onSuccess?.(data, variables);
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { QueryClient };

// Default query client instance
export const queryClient = createQueryClient();
