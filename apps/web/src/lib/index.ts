// Barrel export for lib utilities
// This file provides a single import point for all library utilities

// Supabase Client
export {
  supabaseApi,
  supabase,
  supabaseClient,
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  getCurrentSession,
  refreshSession,
  resetPassword,
  updatePassword,
  updateUserMetadata,
  signInWithOAuth,
  signInWithMagicLink,
  onAuthStateChange,
  type AuthState,
} from './supabase';

// HTTP API Client
export { apiClient, ApiError, safeApiCall } from './supabaseApi';

// Environment Configuration
export {
  env,
  createEnvConfig,
  validateEnvConfig,
  isConfigValid,
  type EnvConfig,
} from './env-config';

// Utilities
export { cn } from './utils';

// Query Client
export {
  queryClient,
  createQueryClient,
  queryKeys,
  createQueryKeys,
  persistQueryData,
  restoreQueryData,
  createOfflineQueryOptions,
  createOptimisticUpdateOptions,
} from './queryClient';
