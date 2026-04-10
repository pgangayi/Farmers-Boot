/**
 * Supabase API Configuration
 * All data access is now through Supabase client directly
 * Legacy REST endpoint definitions removed - use supabaseApi instead
 */

// Storage keys for UI preferences only (not auth tokens)
export const STORAGE_KEYS = {
  theme: 'theme_preference',
  language: 'language',
  lastSync: 'last_sync_timestamp',
};

// Supabase table names for reference
export const TABLES = {
  farms: 'farms',
  fields: 'fields',
  crops: 'crops',
  livestock: 'livestock',
  tasks: 'tasks',
  inventory: 'inventory_items',
  finance: 'finance_records',
  healthRecords: 'health_records',
  production: 'production_records',
  breeding: 'breeding_records',
  users: 'users',
  profiles: 'profiles',
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 100,
};

// Feature flags
export const FEATURES = {
  enableAnalytics: true,
  enableOfflineMode: true,
  enablePushNotifications: false,
  enableRealtime: true,
};

// Legacy exports removed - use supabaseApi for data operations
// import { supabaseApi } from '../lib/supabase'
