/**
 * OFFLINE DATABASE
 * ================
 * IndexedDB-based offline storage using Dexie
 * Enables full offline-first functionality with automatic sync
 */

import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface OfflineOperation {
  id?: number;
  uuid: string;
  tableName: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  error?: string;
  conflictData?: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
}

export interface SyncMetadata {
  id?: number;
  tableName: string;
  lastSyncTime: number;
  lastSyncHash?: string;
  recordCount: number;
}

export interface CachedData<T> {
  id: string;
  data: T;
  cachedAt: number;
  expiresAt?: number;
  etag?: string;
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

class FarmersBootDatabase extends Dexie {
  // Operation queue for offline mutations
  operations!: Table<OfflineOperation, number>;

  // Sync metadata for each table
  syncMetadata!: Table<SyncMetadata, number>;

  // Cached data stores
  cachedFarms!: Table<CachedData<unknown>, string>;
  cachedAnimals!: Table<CachedData<unknown>, string>;
  cachedCrops!: Table<CachedData<unknown>, string>;
  cachedTasks!: Table<CachedData<unknown>, string>;
  cachedInventory!: Table<CachedData<unknown>, string>;
  cachedFinance!: Table<CachedData<unknown>, string>;
  cachedLocations!: Table<CachedData<unknown>, string>;

  constructor() {
    super('FarmersBootOfflineDB');

    this.version(1).stores({
      // Primary key is auto-incremented id
      operations: '++id, uuid, tableName, operation, status, timestamp, priority',
      syncMetadata: '++id, tableName',

      // Cached data with string IDs
      cachedFarms: 'id, cachedAt',
      cachedAnimals: 'id, cachedAt',
      cachedCrops: 'id, cachedAt',
      cachedTasks: 'id, cachedAt',
      cachedInventory: 'id, cachedAt',
      cachedFinance: 'id, cachedAt',
      cachedLocations: 'id, cachedAt',
    });
  }
}

// Singleton instance
export const db = new FarmersBootDatabase();

// ============================================================================
// OPERATION QUEUE
// ============================================================================

export const OperationQueue = {
  /**
   * Add a new operation to the queue
   */
  async add(
    tableName: string,
    operation: OfflineOperation['operation'],
    data: Record<string, unknown>,
    options: {
      originalData?: Record<string, unknown>;
      priority?: OfflineOperation['priority'];
    } = {}
  ): Promise<OfflineOperation> {
    const op: OfflineOperation = {
      uuid: uuidv4(),
      tableName,
      operation,
      data,
      originalData: options.originalData,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
      priority: options.priority || 'normal',
    };

    const id = await db.operations.add(op);
    return { ...op, id };
  },

  /**
   * Get all pending operations
   */
  async getPending(): Promise<OfflineOperation[]> {
    return db.operations.where('status').equals('pending').sortBy('timestamp');
  },

  /**
   * Get operations by status
   */
  async getByStatus(status: OfflineOperation['status']): Promise<OfflineOperation[]> {
    return db.operations.where('status').equals(status).toArray();
  },

  /**
   * Get operations by table
   */
  async getByTable(tableName: string): Promise<OfflineOperation[]> {
    return db.operations.where('tableName').equals(tableName).toArray();
  },

  /**
   * Update operation status
   */
  async updateStatus(
    id: number,
    status: OfflineOperation['status'],
    error?: string
  ): Promise<void> {
    await db.operations.update(id, { status, error });
  },

  /**
   * Mark operation as syncing
   */
  async markSyncing(id: number): Promise<void> {
    await db.operations.update(id, { status: 'syncing' });
  },

  /**
   * Mark operation as synced and remove it
   */
  async markSynced(id: number): Promise<void> {
    await db.operations.delete(id);
  },

  /**
   * Mark operation as failed
   */
  async markFailed(id: number, error: string): Promise<void> {
    const op = await db.operations.get(id);
    if (op) {
      await db.operations.update(id, {
        status: 'failed',
        error,
        retryCount: op.retryCount + 1,
      });
    }
  },

  /**
   * Mark operation as conflict
   */
  async markConflict(id: number, conflictData: Record<string, unknown>): Promise<void> {
    await db.operations.update(id, {
      status: 'conflict',
      conflictData,
    });
  },

  /**
   * Retry a failed operation
   */
  async retry(id: number): Promise<void> {
    await db.operations.update(id, {
      status: 'pending',
      error: undefined,
    });
  },

  /**
   * Remove an operation
   */
  async remove(id: number): Promise<void> {
    await db.operations.delete(id);
  },

  /**
   * Clear all operations
   */
  async clear(): Promise<void> {
    await db.operations.clear();
  },

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    syncing: number;
    failed: number;
    conflicts: number;
  }> {
    const all = await db.operations.toArray();
    return {
      total: all.length,
      pending: all.filter(op => op.status === 'pending').length,
      syncing: all.filter(op => op.status === 'syncing').length,
      failed: all.filter(op => op.status === 'failed').length,
      conflicts: all.filter(op => op.status === 'conflict').length,
    };
  },
};

// ============================================================================
// CACHE MANAGER
// ============================================================================

type TableName = 'farms' | 'animals' | 'crops' | 'tasks' | 'inventory' | 'finance' | 'locations';

const tableMap: Record<TableName, Table<CachedData<unknown>, string>> = {
  farms: db.cachedFarms,
  animals: db.cachedAnimals,
  crops: db.cachedCrops,
  tasks: db.cachedTasks,
  inventory: db.cachedInventory,
  finance: db.cachedFinance,
  locations: db.cachedLocations,
};

export const CacheManager = {
  /**
   * Get cached data by ID
   */
  async get<T>(tableName: TableName, id: string): Promise<T | null> {
    const table = tableMap[tableName];
    const cached = await table.get(id);

    if (!cached) return null;

    // Check expiration
    if (cached.expiresAt && cached.expiresAt < Date.now()) {
      await table.delete(id);
      return null;
    }

    return cached.data as T;
  },

  /**
   * Get all cached data for a table
   */
  async getAll<T>(tableName: TableName): Promise<T[]> {
    const table = tableMap[tableName];
    const all = await table.toArray();

    // Filter out expired entries
    const now = Date.now();
    const valid = all.filter(item => !item.expiresAt || item.expiresAt > now);

    return valid.map(item => item.data as T);
  },

  /**
   * Set cached data
   */
  async set<T>(
    tableName: TableName,
    id: string,
    data: T,
    options: { ttl?: number; etag?: string } = {}
  ): Promise<void> {
    const table = tableMap[tableName];
    const cached: CachedData<T> = {
      id,
      data,
      cachedAt: Date.now(),
      expiresAt: options.ttl ? Date.now() + options.ttl : undefined,
      etag: options.etag,
    };

    await table.put(cached as CachedData<unknown>);
  },

  /**
   * Set multiple items at once
   */
  async setAll<T>(
    tableName: TableName,
    items: Array<{ id: string; data: T }>,
    options: { ttl?: number } = {}
  ): Promise<void> {
    const table = tableMap[tableName];
    const now = Date.now();

    const cachedItems = items.map(item => ({
      id: item.id,
      data: item.data as unknown,
      cachedAt: now,
      expiresAt: options.ttl ? now + options.ttl : undefined,
    }));

    await table.bulkPut(cachedItems);
  },

  /**
   * Remove cached data
   */
  async remove(tableName: TableName, id: string): Promise<void> {
    const table = tableMap[tableName];
    await table.delete(id);
  },

  /**
   * Clear all cached data for a table
   */
  async clearTable(tableName: TableName): Promise<void> {
    const table = tableMap[tableName];
    await table.clear();
  },

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    await Promise.all(Object.values(tableMap).map(table => table.clear()));
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<TableName, { count: number; oldestEntry: number | null }>> {
    const stats: Record<string, { count: number; oldestEntry: number | null }> = {};

    for (const [name, table] of Object.entries(tableMap)) {
      const all = await table.toArray();
      stats[name] = {
        count: all.length,
        oldestEntry: all.length > 0 ? Math.min(...all.map(item => item.cachedAt)) : null,
      };
    }

    return stats as Record<TableName, { count: number; oldestEntry: number | null }>;
  },
};

// ============================================================================
// SYNC MANAGER
// ============================================================================

export const SyncManager = {
  /**
   * Update sync metadata for a table
   */
  async updateMetadata(
    tableName: string,
    data: Partial<Omit<SyncMetadata, 'id' | 'tableName'>>
  ): Promise<void> {
    const existing = await db.syncMetadata.where('tableName').equals(tableName).first();

    if (existing) {
      await db.syncMetadata.update(existing.id!, data);
    } else {
      await db.syncMetadata.add({
        tableName,
        lastSyncTime: Date.now(),
        recordCount: 0,
        ...data,
      });
    }
  },

  /**
   * Get sync metadata for a table
   */
  async getMetadata(tableName: string): Promise<SyncMetadata | undefined> {
    return db.syncMetadata.where('tableName').equals(tableName).first();
  },

  /**
   * Get all sync metadata
   */
  async getAllMetadata(): Promise<SyncMetadata[]> {
    return db.syncMetadata.toArray();
  },

  /**
   * Check if sync is needed for a table
   */
  async needsSync(tableName: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
    const metadata = await this.getMetadata(tableName);
    if (!metadata) return true;

    return Date.now() - metadata.lastSyncTime > maxAge;
  },
};

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Initialize the database
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('[OfflineDB] Database initialized successfully');
  } catch (error) {
    console.error('[OfflineDB] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  await Promise.all([OperationQueue.clear(), CacheManager.clearAll(), db.syncMetadata.clear()]);
  console.log('[OfflineDB] All offline data cleared');
}

/**
 * Export database for debugging
 */
export async function exportDatabase(): Promise<{
  operations: OfflineOperation[];
  syncMetadata: SyncMetadata[];
  cacheStats: Record<TableName, { count: number; oldestEntry: number | null }>;
}> {
  const operations = await db.operations.toArray();
  const syncMetadata = await db.syncMetadata.toArray();
  const cacheStats = await CacheManager.getStats();

  return { operations, syncMetadata, cacheStats };
}

export default db;
