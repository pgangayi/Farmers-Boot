/**
 * OFFLINE INDICATOR COMPONENT
 * ===========================
 * Visual indicator for offline status and sync queue
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, CloudOff, Cloud, RefreshCw, Check, AlertTriangle, X } from 'lucide-react';
import { useOfflineSync, useConflictResolution } from '../hooks/useOfflineSync';
import { cn } from '../lib/utils';

// ============================================================================
// OFFLINE BANNER
// ============================================================================

interface OfflineBannerProps {
  className?: string;
  showQueueCount?: boolean;
}

export function OfflineBanner({ className, showQueueCount = true }: OfflineBannerProps) {
  const { isOnline, isSyncing, syncStats, getQueueStats } = useOfflineSync({
    autoSync: true,
  });
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      getQueueStats().then(stats => setQueueCount(stats.pending));
    }
  }, [isOnline, getQueueStats]);

  if (isOnline && queueCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm font-medium transition-all',
        isOnline ? 'bg-blue-500' : 'bg-orange-500',
        'text-white',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
            <span>
              {isSyncing ? 'Syncing changes...' : 'Back online!'}
              {showQueueCount && queueCount > 0 && ` (${queueCount} pending)`}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>
              You're offline. Changes will sync when connection is restored.
              {showQueueCount && queueCount > 0 && ` (${queueCount} pending)`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SYNC STATUS INDICATOR
// ============================================================================

interface SyncStatusProps {
  className?: string;
  compact?: boolean;
}

export function SyncStatus({ className, compact = false }: SyncStatusProps) {
  const { isOnline, isSyncing, syncStats, sync } = useOfflineSync();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (syncStats.synced > 0 && !isSyncing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStats.synced, isSyncing]);

  if (compact) {
    return (
      <button
        onClick={() => isOnline && sync()}
        disabled={!isOnline || isSyncing}
        className={cn(
          'p-2 rounded-full transition-colors',
          isOnline ? 'hover:bg-gray-100' : 'bg-orange-100',
          className
        )}
        title={isOnline ? 'Sync status' : 'Offline'}
      >
        {showSuccess ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : isSyncing ? (
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
        ) : isOnline ? (
          <Cloud className="h-5 w-5 text-gray-500" />
        ) : (
          <CloudOff className="h-5 w-5 text-orange-500" />
        )}
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-lg bg-gray-50', className)}>
      {showSuccess ? (
        <>
          <Check className="h-5 w-5 text-green-500" />
          <span className="text-sm text-green-600">Synced</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          <span className="text-sm text-blue-600">Syncing...</span>
        </>
      ) : isOnline ? (
        <>
          <Cloud className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">Online</span>
        </>
      ) : (
        <>
          <CloudOff className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-orange-600">Offline</span>
        </>
      )}

      {syncStats.total > 0 && (
        <span className="text-xs text-gray-500">
          {syncStats.synced}/{syncStats.total} synced
        </span>
      )}
    </div>
  );
}

// ============================================================================
// SYNC QUEUE PANEL
// ============================================================================

interface SyncQueuePanelProps {
  className?: string;
  onClose?: () => void;
}

export function SyncQueuePanel({ className, onClose }: SyncQueuePanelProps) {
  const { isOnline, isSyncing, syncStats, sync, retryFailed, getQueueStats } = useOfflineSync();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    syncing: 0,
    failed: 0,
    conflicts: 0,
  });

  useEffect(() => {
    getQueueStats().then(setStats);
    const interval = setInterval(() => getQueueStats().then(setStats), 5000);
    return () => clearInterval(interval);
  }, [getQueueStats]);

  return (
    <div className={cn('bg-white rounded-lg shadow-lg p-4 max-w-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Sync Queue</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Pending</span>
            <span className="font-medium">{stats.pending}</span>
          </div>
          <div className="flex justify-between p-2 bg-blue-50 rounded">
            <span className="text-blue-600">Syncing</span>
            <span className="font-medium text-blue-600">{stats.syncing}</span>
          </div>
          <div className="flex justify-between p-2 bg-red-50 rounded">
            <span className="text-red-600">Failed</span>
            <span className="font-medium text-red-600">{stats.failed}</span>
          </div>
          <div className="flex justify-between p-2 bg-yellow-50 rounded">
            <span className="text-yellow-600">Conflicts</span>
            <span className="font-medium text-yellow-600">{stats.conflicts}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => sync()}
            disabled={!isOnline || isSyncing}
            className={cn(
              'flex-1 py-2 px-3 rounded text-sm font-medium transition-colors',
              isOnline && !isSyncing
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>

          {stats.failed > 0 && (
            <button
              onClick={retryFailed}
              disabled={!isOnline || isSyncing}
              className={cn(
                'py-2 px-3 rounded text-sm font-medium transition-colors',
                isOnline && !isSyncing
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              )}
            >
              Retry Failed
            </button>
          )}
        </div>

        {!isOnline && (
          <p className="text-xs text-gray-500 text-center">
            Changes will sync automatically when you're back online.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONFLICT RESOLUTION MODAL
// ============================================================================

interface ConflictResolutionModalProps {
  className?: string;
  onClose?: () => void;
}

export function ConflictResolutionModal({ className, onClose }: ConflictResolutionModalProps) {
  const { conflicts, resolveConflict } = useConflictResolution();
  const [selectedConflict, setSelectedConflict] = useState<number | null>(null);

  if (conflicts.length === 0) return null;

  const currentConflict = selectedConflict
    ? conflicts.find(c => c.id === selectedConflict)
    : conflicts[0];

  if (!currentConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn('bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4', className)}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900">Sync Conflict</h2>
        </div>

        <p className="text-gray-600 mb-4">
          There are {conflicts.length} conflict(s) that need to be resolved. The server has a
          different version of this data.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Your Version</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(currentConflict.data, null, 2)}
            </pre>
          </div>
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Server Version</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(currentConflict.conflictData, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => resolveConflict(currentConflict.id!, 'keep-local')}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Keep My Version
          </button>
          <button
            onClick={() => resolveConflict(currentConflict.id!, 'keep-server')}
            className="flex-1 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Keep Server Version
          </button>
        </div>

        {onClose && (
          <button onClick={onClose} className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OFFLINE WRAPPER
// ============================================================================

interface OfflineWrapperProps {
  children: React.ReactNode;
  showBanner?: boolean;
  showSyncStatus?: boolean;
}

export function OfflineWrapper({
  children,
  showBanner = true,
  showSyncStatus = true,
}: OfflineWrapperProps) {
  const { hasConflicts } = useConflictResolution();

  return (
    <>
      {showBanner && <OfflineBanner />}
      <div className={cn(showBanner && 'pt-10')}>
        {showSyncStatus && (
          <div className="fixed bottom-4 right-4 z-40">
            <SyncStatus compact />
          </div>
        )}
        {hasConflicts && <ConflictResolutionModal />}
        {children}
      </div>
    </>
  );
}

export default OfflineBanner;
