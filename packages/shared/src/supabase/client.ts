// ============================================================================
// SHARED SUPABASE CLIENT
// ============================================================================
// This module provides a centralized Supabase client for the Farmers-Boot
// monorepo. Following Turbo monorepo principles, shared code is placed in
// packages/shared to be used by both apps/api and apps/web.
//
// Date: 2026-02-10
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase configuration interface
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Get Supabase client instance
 * This is the single source of truth for Supabase client creation
 *
 * @param config - Supabase configuration
 * @param useServiceRole - Whether to use service role key (default: false)
 * @returns SupabaseClient instance
 */
export function getSupabaseClient(
  config: SupabaseConfig,
  useServiceRole: boolean = false
): SupabaseClient {
  const key = useServiceRole && config.serviceRoleKey ? config.serviceRoleKey : config.anonKey;

  return createClient(config.url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'farmers-boot',
      },
    },
  });
}

/**
 * Get Supabase client from environment variables
 *
 * @param env - Environment object containing SUPABASE_URL and SUPABASE_ANON_KEY
 * @param useServiceRole - Whether to use service role key (default: false)
 * @returns SupabaseClient instance
 */
export function getSupabaseClientFromEnv(
  env: any,
  useServiceRole: boolean = false
): SupabaseClient {
  const config: SupabaseConfig = {
    url: env.SUPABASE_URL || env.supabaseUrl || env.VITE_SUPABASE_URL || '',
    anonKey: env.SUPABASE_ANON_KEY || env.supabaseAnonKey || env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || env.supabaseServiceRoleKey || '',
  };

  if (!config.url || !config.anonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }

  return getSupabaseClient(config, useServiceRole);
}

/**
 * Supabase client manager for caching instances
 */
export class SupabaseClientManager {
  private static instance: SupabaseClientManager;
  private clients: Map<string, SupabaseClient> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SupabaseClientManager {
    if (!SupabaseClientManager.instance) {
      SupabaseClientManager.instance = new SupabaseClientManager();
    }
    return SupabaseClientManager.instance;
  }

  /**
   * Get or create a client
   */
  getClient(config: SupabaseConfig, useServiceRole: boolean = false): SupabaseClient {
    const cacheKey = `${config.url}-${useServiceRole ? 'service' : 'anon'}`;

    if (!this.clients.has(cacheKey)) {
      const client = getSupabaseClient(config, useServiceRole);
      this.clients.set(cacheKey, client);
    }

    return this.clients.get(cacheKey)!;
  }

  /**
   * Clear all cached clients
   */
  clearCache(): void {
    this.clients.clear();
  }
}

/**
 * Get cached Supabase client
 *
 * @param config - Supabase configuration
 * @param useServiceRole - Whether to use service role key (default: false)
 * @returns SupabaseClient instance
 */
export function getCachedSupabaseClient(
  config: SupabaseConfig,
  useServiceRole: boolean = false
): SupabaseClient {
  return SupabaseClientManager.getInstance().getClient(config, useServiceRole);
}

/**
 * Handle Supabase errors consistently
 *
 * @param error - Supabase error object
 * @returns Formatted error object
 */
export function handleSupabaseError(error: any): { error: string; code?: string; details?: any } {
  if (!error) {
    return { error: 'Unknown error occurred' };
  }

  return {
    error: error.message || 'An error occurred',
    code: error.code,
    details: error.details,
  };
}

/**
 * Format Supabase responses consistently
 *
 * @param response - Supabase response object
 * @returns Formatted response object
 */
export function formatSupabaseResponse<T>(response: { data: T | null; error: any }): {
  success: boolean;
  data?: T;
  error?: string;
} {
  if (response.error) {
    const handledError = handleSupabaseError(response.error);
    return {
      success: false,
      error: handledError.error,
    };
  }

  return {
    success: true,
    data: response.data || undefined,
  };
}

// Export all utilities
export default {
  getSupabaseClient,
  getSupabaseClientFromEnv,
  getCachedSupabaseClient,
  handleSupabaseError,
  formatSupabaseResponse,
  SupabaseClientManager,
};
