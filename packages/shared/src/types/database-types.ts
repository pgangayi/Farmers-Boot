// ============================================================================
// CONSOLIDATED DATABASE TYPES
// ============================================================================
// This file contains all database entity types for Farmers-Boot.
// These types are auto-generated from the database schema and should be
// the single source of truth for all entity types.
//
// Generated: 2026-02-24
// ============================================================================

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export type UserRole = 'admin' | 'user' | 'farmer' | 'worker' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  password_hash?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  farm_id?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  farm_id?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  last_sign_in_at?: string;
  is_active?: boolean;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  provider?: string;
}

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  type?: string;
  description?: string;
  capacity?: number;
  current_occupancy?: number;
}

// ============================================================================
// FARM TYPES
// ============================================================================

export interface Farm {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  owner_id?: string;
  area_hectares?: number;
  soil_type?: string;
  climate_zone?: string;
  elevation_meters?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  location?: string;
  timezone?: string;
}

// ============================================================================
// FIELD TYPES
// ============================================================================

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  description?: string;
  area_hectares: number;
  soil_type?: string;
  soil_ph?: number;
  irrigation_type?: string;
  coordinates?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  farm_name?: string;
  crop_type?: string;
}

// ============================================================================
// CROP TYPES
// ============================================================================

export interface Crop {
  id: string;
  name: string;
  scientific_name?: string;
  variety?: string;
  description?: string;
  growing_season_days?: number;
  optimal_temp_min?: number;
  optimal_temp_max?: number;
  water_requirement_mm?: number;
  planting_depth_cm?: number;
  spacing_cm?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  // UI-expected properties for crop planning
  crop_type?: string;
  field_id?: string;
  status?: CropPlanStatus;
  area_planted?: number;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  expected_yield?: number;
  actual_yield?: number;
  health_status?: string;
  notes?: string;
  farm_id?: string;
}

export type CropPlanStatus = 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';

export interface CropPlan {
  id: string;
  field_id: string;
  crop_id?: string;
  season: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  area_hectares?: number;
  expected_yield_kg_per_hectare?: number;
  actual_yield_kg?: number;
  status: CropPlanStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

export type CropActivityType =
  | 'planting'
  | 'watering'
  | 'fertilizing'
  | 'pest_control'
  | 'weeding'
  | 'harvesting'
  | 'other';
export type CropActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface CropActivity {
  id: string;
  crop_plan_id: string;
  activity_type: CropActivityType;
  description?: string;
  scheduled_date?: string;
  completed_date?: string;
  status: CropActivityStatus;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// LIVESTOCK TYPES
// ============================================================================

export type LivestockType = 'cattle' | 'goats' | 'sheep' | 'pigs' | 'poultry' | 'other';
export type LivestockGender = 'male' | 'female' | 'unknown';
export type LivestockStatus =
  | 'healthy'
  | 'sick'
  | 'sold'
  | 'deceased'
  | 'pregnant'
  | 'active'
  | 'quarantine';

export interface Livestock {
  id: string;
  farm_id: string;
  type: LivestockType;
  breed?: string;
  tag_number?: string;
  name?: string;
  gender: LivestockGender;
  birth_date?: string;
  weight_kg?: number;
  status: LivestockStatus;
  purchase_date?: string;
  purchase_price?: number;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  identification_tag?: string;
  sex?: 'male' | 'female' | 'unknown';
  current_weight?: number;
  date_of_birth?: string;
  species?: string;
  acquisition_date?: string;
}

export interface LivestockHealth {
  id: string;
  livestock_id: string;
  check_date: string;
  health_status: string;
  weight_kg?: number;
  temperature?: number;
  notes?: string;
  veterinarian?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  cost?: number;
  next_due_date?: string;
  vet_contact?: string;
  created_by?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface LivestockProduction {
  id: string;
  livestock_id: string;
  production_date: string;
  production_type: string;
  quantity: number;
  unit: string;
  quality_grade?: string;
  price_per_unit?: number;
  total_value?: number;
  market_destination?: string;
  storage_location?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export type BreedingMethod = 'natural' | 'artificial_insemination';
export type BreedingStatus = 'pending' | 'confirmed' | 'failed';

export interface LivestockBreeding {
  id: string;
  livestock_id: string;
  breeding_date: string;
  breeding_method: BreedingMethod;
  breeding_type?: string;
  mate_id?: string;
  sire_id?: string;
  technician_name?: string;
  notes?: string;
  breeding_notes?: string;
  status: BreedingStatus;
  breeding_result?: string;
  expected_due_date?: string;
  expected_calving_date?: string;
  actual_date?: string;
  actual_calving_date?: string;
  offspring_count?: number;
  breeding_fee?: number;
  vet_supervision: boolean;
  created_by?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export type InventoryCategory =
  | 'seeds'
  | 'fertilizer'
  | 'pesticide'
  | 'equipment'
  | 'feed'
  | 'medicine'
  | 'other';

export interface Inventory {
  id: string;
  farm_id: string;
  name: string;
  category: InventoryCategory;
  description?: string;
  unit: string;
  quantity: number;
  min_quantity?: number;
  unit_price?: number;
  supplier?: string;
  expiry_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  cost_per_unit?: number;
  reorder_level?: number;
  minimum_quantity?: number;
}

export type TransactionType = 'purchase' | 'usage' | 'sale' | 'loss' | 'adjustment';

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: TransactionType;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  reason?: string;
  reference_number?: string;
  created_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EQUIPMENT TYPES
// ============================================================================

export type EquipmentType =
  | 'tractor'
  | 'plow'
  | 'harvester'
  | 'irrigation'
  | 'sprayer'
  | 'trailer'
  | 'other';
export type EquipmentStatus = 'operational' | 'maintenance' | 'broken' | 'retired';

export interface Equipment {
  id: string;
  farm_id: string;
  name: string;
  type: EquipmentType;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  status: EquipmentStatus;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskPriority = 'low' | 'medium' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  farm_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  task_type?: string;
  category?: string;
}

export interface TaskTimeLog {
  id: string;
  task_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

export type FinanceType = 'income' | 'expense';

export interface FinancialRecord {
  id: string;
  farm_id: string;
  type: FinanceType;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  transaction_date: string;
  reference_number?: string;
  payment_method?: string;
  created_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
  // UI-expected properties
  entry_type?: 'income' | 'expense';
  status?: 'pending' | 'completed' | 'cancelled';
  date?: string;
}

export type BudgetStatus = 'active' | 'inactive' | 'completed';

export interface Budget {
  id: string;
  farm_id: string;
  budget_name: string;
  fiscal_year: number;
  period: string;
  total_budget: number;
  spent_amount: number;
  status: BudgetStatus;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// WEATHER TYPES
// ============================================================================

export interface WeatherData {
  id: string;
  location_id?: string;
  recorded_at: string;
  temperature_c?: number;
  humidity_percent?: number;
  wind_speed_kmh?: number;
  precipitation_mm?: number;
  pressure_hpa?: number;
  condition?: string;
  source?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================================================
// IRRIGATION TYPES
// ============================================================================

export type IrrigationSystemType = 'drip' | 'sprinkler' | 'flood' | 'center_pivot' | 'other';
export type IrrigationStatus = 'operational' | 'maintenance' | 'broken' | 'retired';

export interface IrrigationSystem {
  id: string;
  field_id: string;
  system_type: IrrigationSystemType;
  name: string;
  description?: string;
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  status: IrrigationStatus;
  water_source?: string;
  flow_rate_liters_per_hour?: number;
  coverage_area_hectares?: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export type IrrigationScheduleStatus = 'active' | 'inactive' | 'completed';

export interface IrrigationSchedule {
  id: string;
  irrigation_system_id: string;
  schedule_name: string;
  start_date: string;
  end_date?: string;
  frequency_days?: number;
  duration_minutes?: number;
  water_amount_mm?: number;
  status: IrrigationScheduleStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PEST & DISEASE TYPES
// ============================================================================

export type PestDiseaseRecordType = 'pest' | 'disease';
export type PestDiseaseSeverity = 'low' | 'medium' | 'high' | 'severe';
export type PestDiseaseStatus = 'active' | 'treated' | 'resolved' | 'monitoring';

export interface PestDiseaseRecord {
  id: string;
  field_id?: string;
  crop_id?: string;
  livestock_id?: string;
  record_type: PestDiseaseRecordType;
  name: string;
  scientific_name?: string;
  severity: PestDiseaseSeverity;
  affected_area_hectares?: number;
  detection_date: string;
  treatment_method?: string;
  treatment_date?: string;
  treatment_cost?: number;
  status: PestDiseaseStatus;
  notes?: string;
  reported_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CROP ROTATION TYPES
// ============================================================================

export type CropRotationStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface CropRotation {
  id: string;
  field_id: string;
  rotation_name: string;
  description?: string;
  start_year: number;
  duration_years: number;
  status: CropRotationStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface CropRotationDetail {
  id: string;
  rotation_id: string;
  sequence_order: number;
  crop_id: string;
  planting_date?: string;
  harvest_date?: string;
  area_hectares?: number;
  notes?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// LOOKUP TABLE TYPES
// ============================================================================

export interface LookupBreed {
  id: string;
  name: string;
  species: string;
  characteristics?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

export interface LookupVariety {
  id: string;
  crop_type: string;
  name: string;
  description?: string;
  days_to_maturity?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: string;
  statusCode?: number;
  status_code?: number;
  details?: unknown;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  user?: User;
}

export interface AuthResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export type CreateRequest<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateRequest<T> = Partial<T>;

// ============================================================================
// QUERY & FILTER TYPES
// ============================================================================

export interface QueryFilters {
  search?: string;
  status?: string | string[];
  category?: string | string[];
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

// Animal types for backward compatibility
export type Animal = Livestock;
export type AnimalStatus = LivestockStatus;
export type AnimalSex = LivestockGender;
export type HealthStatus = 'healthy' | 'sick' | 'under_observation' | 'quarantine';

export interface AnimalHealth {
  id: string;
  animal_id: string;
  health_status: HealthStatus;
  checkup_date: string;
  next_checkup?: string;
  notes?: string;
  veterinarian?: string;
  treatments?: string[];
  created_at: string;
  updated_at: string;
}

export interface AnimalMovement {
  id: string;
  animal_id: string;
  from?: string;
  to?: string;
  date: string;
  reason?: string;
}

// Finance compatibility
export type FinanceRecord = FinancialRecord;
export type FinanceTransactionType = 'income' | 'expense';

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  total_income?: number;
  total_expenses?: number;
}

// Inventory compatibility
export type InventoryItem = Inventory;

export interface InventoryAlert {
  id: string;
  item_id: string;
  inventory_item_id?: string;
  level: 'low' | 'critical';
  alert_type?: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'discontinued';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  resolved?: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

// Task compatibility (use Task['priority'] and Task['status'] directly)
export type TaskPriorityType = Task['priority'];
export type TaskStatusType = Task['status'];

// Crop compatibility
export type CropStatus = CropPlanStatus;
export type CropHealthStatus = string;
export type CropTreatment = {
  id: string;
  crop_id?: string;
  field_id?: string;
  type: string;
  name: string;
  description?: string;
  date: string;
  next_due?: string;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
};

// UI Helper types
export interface ModalField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  step?: string | number;
  creatable?: boolean;
  min?: number;
  max?: number;
  rows?: number;
  onAdd?: () => void;
}

// Production and breeding records
export interface ProductionRecord {
  id: string;
  livestock_id: string;
  production_type: string;
  quantity: number;
  unit: string;
  date: string;
  quality_grade?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BreedingRecord {
  id: string;
  livestock_id: string;
  breeding_type: string;
  partner_id?: string;
  breeding_date: string;
  expected_birth?: string;
  actual_birth?: string;
  success: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Weather impact
export interface WeatherImpact {
  id: string;
  weather_data_id: string;
  impact_type: 'positive' | 'negative' | 'neutral';
  affected_entity_type: 'crop' | 'animal' | 'field' | 'equipment';
  affected_entity_id: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendations?: string;
  created_at: string;
  updated_at: string;
}

// Breed reference
export interface Breed {
  id: string;
  species: string;
  name: string;
  characteristics?: string;
  origin?: string;
  average_weight?: number;
  lifespan?: number;
  climate_suitability?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Supplier
export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Operation
export interface Operation {
  id: string;
  farm_id: string;
  name: string;
  type: string;
  description?: string;
  scheduled_date?: string;
  completed_date?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  resources_used?: string[];
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Treatment
export interface Treatment {
  id: string;
  animal_id?: string;
  crop_id?: string;
  field_id?: string;
  type: string;
  name: string;
  description?: string;
  administered_by?: string;
  date: string;
  next_due?: string;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Pedigree
export interface PedigreeNode {
  id: string;
  parent?: string;
  generation?: number;
}

// Livestock stats
export interface LivestockStats {
  total: number;
  healthy: number;
  sick: number;
}

// Base entity
export type BaseEntity = { id: string; created_at?: string; updated_at?: string };

// Form data types
export type FarmFormData = Partial<Farm> & { name?: string };

// ============================================================================
// FINANCE ENTRY TYPE (for UI compatibility)
// ============================================================================

export type FinanceEntry = FinancialRecord;

// ============================================================================
// INTAKE TYPE (for livestock acquisition)
// ============================================================================

export type IntakeType = 'born' | 'purchased' | 'gift' | 'rescue' | 'other';
