/**
 * API TYPES
 * =========
 * Re-exports types from the shared package for backward compatibility
 * All types are centrally defined in @farmers-boot/shared
 */

// ============================================================================
// RE-EXPORT FROM SHARED PACKAGE
// ============================================================================

// Re-export all types from shared package
export type {
  // API Response types
  ApiResponse,
  PaginatedResponse,
  ApiErrorResponse,
  ListOptions,
  PaginationParams,

  // User & Auth types
  User,
  AuthSession,
  AuthResponse,
  LoginCredentials,
  SignupData,

  // Farm types
  Farm,
  FarmFormData,

  // Field types
  Field,
  Location,

  // Crop types
  Crop,
  CropStatus,
  CropHealthStatus,
  CropTreatment,
  CropActivity,

  // Livestock types
  Livestock,
  LivestockHealth,
  Animal,
  AnimalStatus,
  AnimalSex,
  HealthStatus,
  IntakeType,
  AnimalMovement,
  PedigreeNode,
  LivestockStats,
  Breed,
  AnimalHealth,
  ProductionRecord,
  BreedingRecord,

  // Inventory types
  InventoryItem,
  InventoryAlert,
  InventoryCategory,
  Supplier,

  // Task types
  Task,
  TaskPriority,
  TaskStatus,

  // Finance types
  FinanceEntry,
  FinanceRecord,
  FinanceSummary,
  BudgetCategory,
  TransactionType,
  Operation,
  Treatment,

  // Weather types
  WeatherData,
  WeatherImpact,

  // Query types
  QueryFilters,
  CreateRequest,
  UpdateRequest,
  CreateHealthRecordRequest,
  CreateProductionRecordRequest,
  CreateBreedingRecordRequest,

  // UI types
  ModalField,
  BaseEntity,
} from '@farmers-boot/shared';

// ============================================================================
// LOCAL EXTENSIONS (if needed)
// ============================================================================

import type { Task } from '@farmers-boot/shared';

// Extended task type for UI with additional computed fields
export interface TaskWithComputed extends Task {
  isOverdue?: boolean;
  daysUntilDue?: number;
}

// Entity types with farm relationship for UI
export interface FarmEntityBase {
  farm_id: string;
  farm_name?: string;
}
