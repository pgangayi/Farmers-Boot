// ============================================================================
// SHARED REPOSITORY BASE CLASSES
// ============================================================================
// This module provides common repository base classes for the Farmers-Boot
// monorepo. Following Turbo monorepo principles, shared code is placed in
// packages/shared to be used by both apps/api and apps/web.
//
// Date: 2026-02-10
// ============================================================================

/**
 * Type definitions for DatabaseOperations interface
 */
export interface DatabaseOperations {
  findById(table: string, id: string | number, columns?: string, options?: any): Promise<any>;
  findMany(table: string, filters?: Record<string, any>, options?: any): Promise<any>;
  count(table: string, filters?: Record<string, any>, options?: any): Promise<number>;
  create(table: string, data: Record<string, any>, options?: any): Promise<any>;
  updateById(
    table: string,
    id: string | number,
    data: Record<string, any>,
    options?: any
  ): Promise<any>;
  deleteById(table: string, id: string | number, options?: any): Promise<any>;
  executeQuery(query: string, params: any[], options?: any): Promise<{ results?: any; data?: any }>;
}

/**
 * Type definitions for query options
 */
export interface QueryOptions {
  columns?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  userId?: string;
  context?: Record<string, any>;
  skipRateLimit?: boolean;
}

/**
 * Base Repository - Provides common CRUD operations
 * This is the single source of truth for repository base functionality
 */
export class BaseRepository {
  protected db: DatabaseOperations;
  protected tableName: string;

  constructor(dbOperations: DatabaseOperations, tableName: string) {
    if (!dbOperations || !tableName) {
      throw new Error('DatabaseOperations instance and table name are required.');
    }
    this.db = dbOperations;
    this.tableName = tableName;
  }

  /**
   * Find a record by its ID.
   */
  async findById(id: string | number, options: QueryOptions = {}): Promise<any> {
    return await this.db.findById(this.tableName, id, options.columns || '*', options);
  }

  /**
   * Find multiple records with filtering and pagination
   */
  async findMany(filters: Record<string, any> = {}, options: QueryOptions = {}): Promise<any> {
    return await this.db.findMany(this.tableName, filters, options);
  }

  /**
   * Count records with optional filtering
   */
  async count(filters: Record<string, any> = {}, options: QueryOptions = {}): Promise<number> {
    return await this.db.count(this.tableName, filters, options);
  }

  /**
   * Create a new record.
   */
  async create(data: Record<string, any>, options: QueryOptions = {}): Promise<any> {
    return await this.db.create(this.tableName, data, options);
  }

  /**
   * Update a record by its ID.
   */
  async updateById(
    id: string | number,
    data: Record<string, any>,
    options: QueryOptions = {}
  ): Promise<any> {
    return await this.db.updateById(this.tableName, id, data, options);
  }

  /**
   * Delete a record by its ID.
   */
  async deleteById(id: string | number, options: QueryOptions = {}): Promise<any> {
    return await this.db.deleteById(this.tableName, id, options);
  }
}

/**
 * Farm Repository - Handles farm-specific checks and operations
 */
export class FarmRepository extends BaseRepository {
  constructor(dbOperations: DatabaseOperations) {
    super(dbOperations, 'farms');
  }

  /**
   * Check if a user has access to a specific farm.
   */
  async hasUserAccess(farmId: string | number, userId: string): Promise<boolean> {
    // 1. Check if user owns the farm
    const farm = await this.db.findById('farms', farmId);
    if (farm && farm.owner_id === userId) return true;

    // 2. Check if user is assigned to the farm
    const profile = await this.db.findById('profiles', userId);
    return profile && profile.farm_id === farmId;
  }

  /**
   * Get farms owned by a user
   */
  async findByOwner(ownerId: string, options: QueryOptions = {}): Promise<any> {
    return await this.db.findMany('farms', { owner_id: ownerId }, options);
  }

  /**
   * Get farms accessible by a user
   */
  async findByUser(userId: string, options: QueryOptions = {}): Promise<any> {
    const profile = await this.db.findById('profiles', userId);
    if (!profile) return [];

    const farms = [];
    if (profile.farm_id) {
      const assignedFarm = await this.db.findById('farms', profile.farm_id);
      if (assignedFarm) farms.push(assignedFarm);
    }

    // Also include owned farms
    const ownedFarms = await this.findByOwner(userId, options);
    const farmIds = new Set(farms.map((f) => f.id));
    ownedFarms.forEach((f: any) => {
      if (!farmIds.has(f.id)) farms.push(f);
    });

    return farms;
  }

  /**
   * Get farm with statistics
   */
  async findWithStats(farmId: string | number, options: QueryOptions = {}): Promise<any> {
    // Note: In Supabase, we can use RPC or complex selects for counts.
    // Simplifying for now to findById and manual counts if needed.
    return await this.db.findById('farms', farmId, '*', options);
  }

  /**
   * Create farm with initial setup
   */
  async create(data: Record<string, any>, options: QueryOptions = {}): Promise<any> {
    const { userId } = options;

    const newFarm = await super.create(
      {
        ...data,
        owner_id: userId,
      },
      options
    );

    // Initial setup (statistics/etc) should be handled via DB triggers/functions in Supabase
    return newFarm;
  }
}

/**
 * User Repository - Handles all user-related database operations
 */
export class UserRepository extends BaseRepository {
  constructor(dbOperations: DatabaseOperations) {
    super(dbOperations, 'users');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string, options: QueryOptions = {}): Promise<any> {
    const results = await this.db.findMany('profiles', { email }, { ...options, limit: 1 });
    return results[0] || null;
  }

  /**
   * Find user with farm count
   */
  async findWithFarmCount(userId: string | number, options: QueryOptions = {}): Promise<any> {
    // Simplified for migration
    return await this.db.findById('profiles', userId, '*', options);
  }

  /**
   * Create user with validation
   */
  async createUser(data: Record<string, any>, options: QueryOptions = {}): Promise<any> {
    // Check if email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return await this.create(data, options);
  }

  /**
   * Get user authentication data
   */
  async findAuthData(userId: string, options: QueryOptions = {}): Promise<any> {
    return await this.db.findById('profiles', userId, '*', options);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string, options: QueryOptions = {}): Promise<any> {
    return await this.updateById(userId, { last_login_at: new Date().toISOString() }, options);
  }
}

// Export all repository classes
export default {
  BaseRepository,
  FarmRepository,
  UserRepository,
};
