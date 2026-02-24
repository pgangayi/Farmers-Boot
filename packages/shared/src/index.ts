// ============================================================================
// SHARED PACKAGE EXPORTS
// ============================================================================
// This is the main entry point for the @farmers-boot/shared package.
// Following Turbo monorepo principles, all shared code is exported from here.
//
// Date: 2026-02-24
// ============================================================================

// Database Types - Single source of truth for all entity types
export * from './types/database-types';

// Dashboard-specific types (UI components, not entities)
export type {
  ColorVariant,
  StatCardProps,
  TabConfig,
  BackgroundImageState,
  ColorClasses,
} from './types/dashboard';

// UI types
export * from './types/ui';

// Repository exports
export * from './repositories/base-repository';

// Utility exports
export * from './utils/response-utils';
export * from './utils/logger';

// Supabase exports
export * from './supabase/client';
