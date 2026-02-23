// ============================================================================
// SHARED PACKAGE EXPORTS
// ============================================================================
// This is the main entry point for the @farmers-boot/shared package.
// Following Turbo monorepo principles, all shared code is exported from here.
//
// Date: 2026-02-10
// ============================================================================

// Type exports
export * from './types/api-types';
export * from './types/audit';
export * from './types/dashboard';
export * from './types/entities';
export * from './types/ui';

// Repository exports
export * from './repositories/base-repository';

// Utility exports
export * from './utils/response-utils';
export * from './utils/logger';

// Supabase exports
export * from './supabase/client';
