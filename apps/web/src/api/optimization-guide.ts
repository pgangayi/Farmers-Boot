/**
 * ============================================================================
 * QUERY OPTIMIZATION GUIDE
 * ============================================================================
 * Best practices for optimizing database queries in Farmers-Boot application
 * ============================================================================
 */

// ============================================================================
// INDEXING STRATEGIES
// ============================================================================

/**
 * Recommended database indexes for optimal performance
 */

export const RECOMMENDED_INDEXES = {
  // Livestock table indexes
  livestock: [
    'CREATE INDEX CONCURRENTLY idx_livestock_farm_id ON livestock(farm_id)',
    'CREATE INDEX CONCURRENTLY idx_livestock_type ON livestock(type)',
    'CREATE INDEX CONCURRENTLY idx_livestock_status ON livestock(status)',
    'CREATE INDEX CONCURRENTLY idx_livestock_created_at ON livestock(created_at DESC)',
    'CREATE INDEX CONCURRENTLY idx_livestock_composite ON livestock(farm_id, status, created_at DESC)',
  ],

  // Tasks table indexes
  tasks: [
    'CREATE INDEX CONCURRENTLY idx_tasks_farm_id ON tasks(farm_id)',
    'CREATE INDEX CONCURRENTLY idx_tasks_status ON tasks(status)',
    'CREATE INDEX CONCURRENTLY idx_tasks_priority ON tasks(priority)',
    'CREATE INDEX CONCURRENTLY idx_tasks_due_date ON tasks(due_date)',
    'CREATE INDEX CONCURRENTLY idx_tasks_assignee_id ON tasks(assignee_id)',
    'CREATE INDEX CONCURRENTLY idx_tasks_composite ON tasks(farm_id, status, due_date, priority)',
  ],

  // Crops table indexes
  crops: [
    'CREATE INDEX CONCURRENTLY idx_crops_farm_id ON crops(farm_id)',
    'CREATE INDEX CONCURRENTLY idx_crops_status ON crops(status)',
    'CREATE INDEX CONCURRENTLY idx_crops_planting_date ON crops(planting_date)',
    'CREATE INDEX CONCURRENTLY idx_crops_composite ON crops(farm_id, status, planting_date)',
  ],

  // Inventory table indexes
  inventory: [
    'CREATE INDEX CONCURRENTLY idx_inventory_farm_id ON inventory(farm_id)',
    'CREATE INDEX CONCURRENTLY idx_inventory_category ON inventory(category)',
    'CREATE INDEX CONCURRENTLY idx_inventory_quantity ON inventory(quantity)',
    'CREATE INDEX CONCURRENTLY idx_inventory_composite ON inventory(farm_id, category, quantity)',
  ],
};

// ============================================================================
// QUERY OPTIMIZATION PATTERNS
// ============================================================================

/**
 * Optimized query patterns for common operations
 */

export const OPTIMIZED_QUERIES = {
  // Optimized livestock listing with pagination
  getLivestockByFarm: `
    SELECT 
      l.*,
      p.full_name,
      p.email
    FROM livestock l
    LEFT JOIN profiles p ON l.id = p.id
    WHERE l.farm_id = $1
    ORDER BY l.created_at DESC
    LIMIT $2 OFFSET $3
  `,

  // Optimized task listing with filters
  getTasksByFarm: `
    SELECT 
      t.*,
      a.full_name as assignee_name
    FROM tasks t
    LEFT JOIN profiles a ON t.assignee_id = a.id
    WHERE t.farm_id = $1
      AND ($2::text IS NULL OR t.status = $2::text)
      AND ($3::text IS NULL OR t.priority = $3::text)
    ORDER BY 
      CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
      END,
      t.due_date ASC NULLS LAST
    LIMIT $4 OFFSET $5
  `,

  // Optimized inventory with low stock alerts
  getLowStockInventory: `
    SELECT 
      i.*,
      (i.quantity <= i.min_quantity) as is_low_stock
    FROM inventory i
    WHERE i.farm_id = $1
      AND i.quantity <= i.min_quantity
    ORDER BY i.quantity ASC
  `,

  // Optimized analytics queries
  getFarmStatistics: `
    SELECT 
      COUNT(CASE WHEN l.status = 'healthy' THEN 1 END) as healthy_count,
      COUNT(CASE WHEN l.status = 'sick' THEN 1 END) as sick_count,
      COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_count,
      COUNT(CASE WHEN l.status = 'deceased' THEN 1 END) as deceased_count,
      AVG(EXTRACT(EPOCH FROM (CURRENT_DATE - birth_date))/86400) as avg_age_days
    FROM livestock l
    WHERE l.farm_id = $1
  `,
};

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache configuration for optimal performance
 */

export const CACHE_STRATEGIES = {
  // TTL values in milliseconds
  ttl: {
    // Static data - cache longer
    breeds: 24 * 60 * 60 * 1000, // 24 hours
    lookupData: 12 * 60 * 60 * 1000, // 12 hours

    // Dynamic data - cache shorter
    livestock: 5 * 60 * 1000, // 5 minutes
    tasks: 2 * 60 * 1000, // 2 minutes
    inventory: 3 * 60 * 1000, // 3 minutes

    // Analytics - cache moderate
    statistics: 15 * 60 * 1000, // 15 minutes
    reports: 30 * 60 * 1000, // 30 minutes
  },

  // Cache invalidation strategies
  invalidation: {
    // Invalidate on data changes
    onMutation: ['livestock', 'tasks', 'inventory', 'crops'],

    // Invalidate time-based
    scheduled: ['statistics', 'reports'],

    // Invalidate on user actions
    onUserAction: ['user_preferences', 'farm_settings'],
  },
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance monitoring configuration
 */

export const PERFORMANCE_MONITORING = {
  // Slow query threshold (milliseconds)
  slowQueryThreshold: 1000,

  // Queries to monitor
  monitoredQueries: ['livestock_list', 'tasks_list', 'inventory_list', 'farm_statistics'],

  // Alerting thresholds
  alerts: {
    errorRate: 0.05, // 5% error rate
    responseTime: 2000, // 2 seconds
    cacheHitRate: 0.8, // 80% cache hit rate
  },
};

// ============================================================================
// SUPABASE OPTIMIZATIONS
// ============================================================================

/**
 * Supabase-specific optimization patterns
 */

export const SUPABASE_OPTIMIZATIONS = {
  // Optimized select patterns
  selects: {
    // Use specific columns instead of *
    minimal: 'id, title, status, priority, due_date',

    // Include related data efficiently
    withRelations: 'id, title, status, priority, due_date, profiles(id, full_name)',

    // Aggregate data
    withCounts:
      'id, title, status, (SELECT COUNT(*) FROM subtasks WHERE task_id = tasks.id) as subtask_count',
  },

  // Efficient filtering
  filters: {
    // Use indexed columns
    indexed: 'farm_id=eq.123&status=eq.active',

    // Range queries
    dateRange: 'created_at=gte.2024-01-01&created_at=lte.2024-12-31',

    // In queries for arrays
    inList: 'id=in.(1,2,3,4,5)',
  },

  // Pagination strategies
  pagination: {
    // Offset-based (for small datasets)
    offset: 'limit=20&offset=0',

    // Cursor-based (for large datasets)
    cursor: 'limit=20&order=created_at.desc&after=2024-01-01T00:00:00Z',
  },
};

// ============================================================================
// IMPLEMENTATION EXAMPLES
// ============================================================================

/**
 * Example implementations of optimized hooks
 */

export const OPTIMIZED_HOOK_EXAMPLES = `
// Example: Optimized livestock hook
export function useOptimizedLivestock(farmId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['livestock', 'list', farmId, page, limit],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const response = await apiClient.get<Livestock[]>(
        \`livestock?farm_id=eq.\${farmId}&select=id,type,status,created_at,profiles(full_name)&order=created_at.desc&limit=\${limit}&offset=\${offset}\`
      );
      return response || [];
    },
    staleTime: CACHE_STRATEGIES.ttl.livestock,
    gcTime: CACHE_STRATEGIES.ttl.livestock * 2,
    keepPreviousData: true, // For smooth pagination
  });
}

// Example: Optimized statistics hook
export function useOptimizedFarmStats(farmId: string) {
  return useQuery({
    queryKey: ['farm', 'statistics', farmId],
    queryFn: async () => {
      // Use RPC for complex aggregations
      const { data } = await apiClient.rpc('get_farm_statistics', { 
        farm_id: farmId 
      });
      return data;
    },
    staleTime: CACHE_STRATEGIES.ttl.statistics,
    refetchInterval: CACHE_STRATEGIES.ttl.statistics, // Refresh periodically
  });
}
`;

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Step-by-step migration guide for existing queries
 */

export const MIGRATION_STEPS = [
  {
    step: 1,
    title: 'Add Database Indexes',
    description: 'Execute the recommended indexes on your database tables',
    commands: [
      'Connect to your Supabase dashboard',
      'Navigate to SQL Editor',
      'Execute indexes from RECOMMENDED_INDEXES',
    ],
  },
  {
    step: 2,
    title: 'Update Query Selects',
    description: 'Replace * selects with specific columns',
    example: 'Change "SELECT *" to "SELECT id, title, status"',
  },
  {
    step: 3,
    title: 'Implement Caching',
    description: 'Add appropriate TTL values to query hooks',
    example: 'Add staleTime: 5 * 60 * 1000 for dynamic data',
  },
  {
    step: 4,
    title: 'Add Performance Monitoring',
    description: 'Implement query performance tracking',
    example: 'Add console.time() around API calls',
  },
  {
    step: 5,
    title: 'Test and Validate',
    description: 'Test optimizations and measure performance improvements',
    metrics: ['Query response time', 'Cache hit rate', 'Error rate'],
  },
];
