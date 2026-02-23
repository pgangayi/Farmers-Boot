/**
 * OFFLINE SYNC HOOK
 * =================
 * React hook for managing offline-first data synchronization
 * Integrates with React Query for seamless offline support
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { db, OperationQueue, CacheManager, SyncManager, OfflineOperation } from '../lib/offline-db';
import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface OfflineSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  maxRetries?: number;
  onOnline?: () => void;
  onOffline?: () => void;
  onSyncStart?: () => void;
  onSyncComplete?: (stats: SyncStats) => void;
  onSyncError?: (error: Error) => void;
  onConflict?: (operation: OfflineOperation) => void;
}

interface SyncStats {
  total: number;
  synced: number;
  failed: number;
  conflicts: number;
}

interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number | null;
  lastOfflineTime: number | null;
}

// ============================================================================
// NETWORK DETECTION HOOK
// ============================================================================

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    wasOffline: false,
    lastOnlineTime: navigator.onLine ? Date.now() : null,
    lastOfflineTime: null,
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkState(prev => ({
        isOnline: true,
        wasOffline: prev.wasOffline || !prev.isOnline,
        lastOnlineTime: Date.now(),
        lastOfflineTime: prev.lastOfflineTime,
      }));
    };

    const handleOffline = () => {
      setNetworkState(prev => ({
        isOnline: false,
        wasOffline: true,
        lastOnlineTime: prev.lastOnlineTime,
        lastOfflineTime: Date.now(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return networkState;
}

// ============================================================================
// OFFLINE SYNC HOOK
// ============================================================================

export function useOfflineSync(options: OfflineSyncOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    maxRetries = 3,
    onOnline,
    onOffline,
    onSyncStart,
    onSyncComplete,
    onSyncError,
    onConflict,
  } = options;

  const queryClient = useQueryClient();
  const networkState = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    total: 0,
    synced: 0,
    failed: 0,
    conflicts: 0,
  });
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Process a single operation
  const processOperation = useCallback(
    async (operation: OfflineOperation): Promise<boolean> => {
      const { tableName, operation: op, data, id } = operation;

      try {
        await OperationQueue.markSyncing(id!);

        let result;

        switch (op) {
          case 'create':
            result = await supabase.from(tableName).insert(data).select();
            break;
          case 'update':
            result = await supabase.from(tableName).update(data).eq('id', data.id).select();
            break;
          case 'delete':
            result = await supabase.from(tableName).delete().eq('id', data.id);
            break;
          default:
            throw new Error(`Unknown operation: ${op}`);
        }

        if (result.error) {
          // Check for conflict (409 or version mismatch)
          if (result.error.code === '409' || result.error.message.includes('conflict')) {
            const serverData = result.data ?? {};
            await OperationQueue.markConflict(id!, serverData as Record<string, unknown>);
            onConflict?.(operation);
            return false;
          }

          throw result.error;
        }

        await OperationQueue.markSynced(id!);
        return true;
      } catch (error) {
        console.error(`[OfflineSync] Error processing operation ${id}:`, error);

        const op = await db.operations.get(id!);
        if (op && op.retryCount >= maxRetries) {
          await OperationQueue.markFailed(id!, (error as Error).message);
        } else {
          await OperationQueue.retry(id!);
        }

        return false;
      }
    },
    [maxRetries, onConflict]
  );

  // Sync all pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!networkState.isOnline || isSyncing) return;

    setIsSyncing(true);
    onSyncStart?.();

    const stats: SyncStats = { total: 0, synced: 0, failed: 0, conflicts: 0 };

    try {
      const pendingOps = await OperationQueue.getPending();
      stats.total = pendingOps.length;

      // Sort by priority (high first)
      const sortedOps = pendingOps.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      for (const operation of sortedOps) {
        const success = await processOperation(operation);
        if (success) {
          stats.synced++;
        } else if (operation.status === 'conflict') {
          stats.conflicts++;
        } else {
          stats.failed++;
        }
      }

      setSyncStats(stats);
      onSyncComplete?.(stats);

      // Invalidate queries to refetch fresh data
      if (stats.synced > 0) {
        queryClient.invalidateQueries();
      }
    } catch (error) {
      console.error('[OfflineSync] Sync error:', error);
      onSyncError?.(error as Error);
    } finally {
      setIsSyncing(false);
    }
  }, [
    networkState.isOnline,
    isSyncing,
    processOperation,
    queryClient,
    onSyncStart,
    onSyncComplete,
    onSyncError,
  ]);

  // Handle network status changes
  useEffect(() => {
    if (networkState.isOnline) {
      onOnline?.();
      if (networkState.wasOffline && autoSync) {
        // Sync immediately when coming back online
        syncPendingOperations();
      }
    } else {
      onOffline?.();
    }
  }, [
    networkState.isOnline,
    networkState.wasOffline,
    autoSync,
    syncPendingOperations,
    onOnline,
    onOffline,
  ]);

  // Set up periodic sync
  useEffect(() => {
    if (autoSync && networkState.isOnline) {
      syncIntervalRef.current = setInterval(() => {
        syncPendingOperations();
      }, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, networkState.isOnline, syncInterval, syncPendingOperations]);

  // Manual sync trigger
  const sync = useCallback(async () => {
    await syncPendingOperations();
  }, [syncPendingOperations]);

  // Get queue stats
  const getQueueStats = useCallback(async () => {
    return OperationQueue.getStats();
  }, []);

  // Retry failed operations
  const retryFailed = useCallback(async () => {
    const failed = await OperationQueue.getByStatus('failed');
    for (const op of failed) {
      await OperationQueue.retry(op.id!);
    }
    if (networkState.isOnline) {
      await syncPendingOperations();
    }
  }, [networkState.isOnline, syncPendingOperations]);

  // Resolve conflict
  const resolveConflict = useCallback(
    async (
      operationId: number,
      resolution: 'keep-local' | 'keep-server' | 'merge',
      mergedData?: Record<string, unknown>
    ) => {
      const op = await db.operations.get(operationId);
      if (!op || op.status !== 'conflict') return;

      switch (resolution) {
        case 'keep-local':
          // Retry with local data
          await OperationQueue.retry(operationId);
          break;
        case 'keep-server':
          // Accept server version, remove from queue
          await OperationQueue.remove(operationId);
          break;
        case 'merge':
          // Use merged data
          if (mergedData) {
            await db.operations.update(operationId, {
              data: mergedData,
              status: 'pending',
              conflictData: undefined,
            });
          }
          break;
      }

      if (networkState.isOnline) {
        await syncPendingOperations();
      }
    },
    [networkState.isOnline, syncPendingOperations]
  );

  return {
    isOnline: networkState.isOnline,
    wasOffline: networkState.wasOffline,
    isSyncing,
    syncStats,
    sync,
    getQueueStats,
    retryFailed,
    resolveConflict,
  };
}

// ============================================================================
// OFFLINE-AWARE QUERY HOOK
// ============================================================================

interface UseOfflineQueryOptions<T> {
  queryKey: unknown[];
  tableName: TableName;
  fetchFn: () => Promise<T[]>;
  staleTime?: number;
  cacheTime?: number;
  enableOfflineCache?: boolean;
}

type TableName = 'farms' | 'animals' | 'crops' | 'tasks' | 'inventory' | 'finance' | 'locations';

export function useOfflineQuery<T extends { id: string }>({
  queryKey,
  tableName,
  fetchFn,
  staleTime = 5 * 60 * 1000, // 5 minutes
  enableOfflineCache = true,
}: UseOfflineQueryOptions<T>) {
  const queryClient = useQueryClient();
  const networkState = useNetworkStatus();

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Try to fetch from network
      const data = await fetchFn();

      // Cache the data for offline use
      if (enableOfflineCache && data) {
        await CacheManager.setAll(
          tableName,
          data.map(item => ({ id: item.id, data: item })),
          { ttl: staleTime }
        );
        await SyncManager.updateMetadata(tableName, {
          lastSyncTime: Date.now(),
          recordCount: data.length,
        });
      }

      return data;
    },
    staleTime,
    enabled: networkState.isOnline,
    retry: false,
  });

  // If offline, try to get cached data
  useEffect(() => {
    if (!networkState.isOnline && enableOfflineCache) {
      CacheManager.getAll<T>(tableName).then(cachedData => {
        if (cachedData.length > 0) {
          queryClient.setQueryData(queryKey, cachedData);
        }
      });
    }
  }, [networkState.isOnline, enableOfflineCache, tableName, queryKey, queryClient]);

  return {
    ...query,
    isOffline: !networkState.isOnline,
    isFromCache: !networkState.isOnline && query.data !== undefined,
  };
}

// ============================================================================
// OFFLINE-AWARE MUTATION HOOK
// ============================================================================

interface UseOfflineMutationOptions<TData, TVariables> {
  tableName: TableName;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  getOperationData: (variables: TVariables) => {
    operation: 'create' | 'update' | 'delete';
    data: Record<string, unknown>;
    id: string;
  };
}

export function useOfflineMutation<TData, TVariables>({
  tableName,
  mutationFn,
  onSuccess,
  onError,
  getOperationData,
}: UseOfflineMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const networkState = useNetworkStatus();

  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      const { operation, data, id } = getOperationData(variables);

      if (networkState.isOnline) {
        // Try online mutation
        try {
          const result = await mutationFn(variables);

          // Update local cache
          if (operation === 'delete') {
            await CacheManager.remove(tableName, id);
          } else {
            await CacheManager.set(tableName, id, result as unknown as Record<string, unknown>);
          }

          return result;
        } catch (error) {
          // If network fails, queue for later
          await OperationQueue.add(tableName, operation, data);
          throw error;
        }
      } else {
        // Offline: queue operation and update local cache optimistically
        await OperationQueue.add(tableName, operation, data, { priority: 'high' });

        // Update local cache optimistically
        if (operation === 'delete') {
          await CacheManager.remove(tableName, id);
        } else {
          await CacheManager.set(tableName, id, data);
        }

        // Return optimistic data
        return data as TData;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [tableName] });
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      onError?.(error, variables);
    },
  });

  return {
    ...mutation,
    isOffline: !networkState.isOnline,
  };
}

// ============================================================================
// CONFLICT RESOLUTION UI HOOK
// ============================================================================

export function useConflictResolution() {
  const [conflicts, setConflicts] = useState<OfflineOperation[]>([]);

  const loadConflicts = useCallback(async () => {
    const conflictOps = await OperationQueue.getByStatus('conflict');
    setConflicts(conflictOps);
  }, []);

  useEffect(() => {
    loadConflicts();
    // Poll for new conflicts
    const interval = setInterval(loadConflicts, 5000);
    return () => clearInterval(interval);
  }, [loadConflicts]);

  const resolveConflict = useCallback(
    async (
      operationId: number,
      resolution: 'keep-local' | 'keep-server' | 'merge',
      mergedData?: Record<string, unknown>
    ) => {
      const op = await db.operations.get(operationId);
      if (!op || op.status !== 'conflict') return;

      switch (resolution) {
        case 'keep-local':
          await OperationQueue.retry(operationId);
          break;
        case 'keep-server':
          await OperationQueue.remove(operationId);
          break;
        case 'merge':
          if (mergedData) {
            await db.operations.update(operationId, {
              data: mergedData,
              status: 'pending',
              conflictData: undefined,
            });
          }
          break;
      }

      await loadConflicts();
    },
    [loadConflicts]
  );

  return {
    conflicts,
    loadConflicts,
    resolveConflict,
    hasConflicts: conflicts.length > 0,
  };
}

export default useOfflineSync;
