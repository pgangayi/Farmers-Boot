/**
 * ENVIRONMENT CONFIGURATION
 * =========================
 * Supabase-focused environment configuration.
 * Legacy external API exports removed.
 */

import { z } from 'zod';

// Define environment schema with Zod for validation
const envSchema = z.object({
  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z.string().min(1, 'Supabase URL is required'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),

  // Third-party Services (Optional)
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_MAPBOX_TOKEN: z.string().optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_VERSION: z.string().default('0.1.0'),
});

/**
 * Parsed and validated environment variables
 */
export const env = envSchema.parse(import.meta.env);

// Re-export from unified API config (legacy exports removed)
export {
  CACHE_CONFIG as cacheConfig,
  STORAGE_KEYS as storageKeys,
  FEATURES as features,
  TABLES as tables,
} from '../api/config';

// Legacy apiEndpoints removed - use supabaseApi from '../lib/supabase' instead
export const apiEndpoints = {} as const;

/**
 * Application configuration
 */
export const appConfig = {
  name: 'Farmers Boot',
  version: env.VITE_APP_VERSION,
  environment: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

export default {
  env,
  appConfig,
};
