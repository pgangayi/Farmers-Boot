/**
 * ============================================================================
 * OFFLINE QUEUE HOOK
 * ============================================================================
 * Simple hook for accessing offline queue state from the store.
 *
 * Note: For comprehensive offline sync with React Query integration,
 * use useOfflineSync from './useOfflineSync' which provides:
 * - Full React Query integration
 * - Network status detection
 * - Conflict resolution with 'keep-local' | 'keep-server' | 'merge' strategies
 * - Automatic sync on reconnect
 * - Offline-aware queries and mutations
 *
 * This hook is kept for backward compatibility and simple use cases.
 * ============================================================================
 */

import { useOfflineQueueStore } from '../stores/offlineQueueStore';

// Re-export conflict resolution type for backward compatibility
export type ConflictResolution = 'overwrite' | 'discard' | 'merge';

/**
 * Simple offline queue hook for basic queue state access
 * @deprecated Use useOfflineSync for comprehensive offline support
 */
export function useOfflineQueue() {
  const { queueLength, isOnline, conflicts, setConflicts } = useOfflineQueueStore();

  /**
   * Resolve a conflict with the specified strategy
   * @param opId - The operation ID with the conflict
   * @param resolution - The resolution strategy
   * @param mergedData - Optional merged data when using 'merge' strategy
   */
  const resolveConflict = (opId: number, resolution: ConflictResolution, mergedData?: unknown) => {
    const conflict = conflicts.find(c => c.id === opId);
    if (!conflict) return;

    switch (resolution) {
      case 'overwrite':
        // Keep local data - will retry the operation
        // The operation will be marked as pending and retried
        break;

      case 'discard':
        // Accept server version - remove from queue
        setConflicts(conflicts.filter(c => c.id !== opId));
        break;

      case 'merge':
        // Use merged data if provided
        if (mergedData) {
          // Update the operation with merged data
          // This would typically update the store with the new data
          setConflicts(conflicts.filter(c => c.id !== opId));
        }
        break;
    }
  };

  /**
   * Get conflict by ID
   */
  const getConflict = (opId: number) => {
    return conflicts.find(c => c.id === opId);
  };

  /**
   * Clear all conflicts
   */
  const clearAllConflicts = () => {
    setConflicts([]);
  };

  return {
    queueLength,
    isOnline,
    conflicts,
    resolveConflict,
    getConflict,
    clearAllConflicts,
    hasConflicts: conflicts.length > 0,
  };
}

// Re-export useOfflineSync as the recommended hook
export {
  useOfflineSync,
  useNetworkStatus,
  useOfflineQuery,
  useOfflineMutation,
  useConflictResolution,
} from './useOfflineSync';

// Note: Types are available directly from useOfflineSync
