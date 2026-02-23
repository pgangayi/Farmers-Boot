// Core Entity Types for Farmers-Boot Application

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Backwards-compatible top-level total count */
  total?: number;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: string;
  statusCode?: number;
  status_code?: number;
  details?: any;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'farmer' | 'worker';
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
// FARM TYPES
// ============================================================================

export interface Farm {
  id: string;
  name: string;
  owner_id: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  total_area?: number;
  area_hectares?: number;
  timezone?: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

// ============================================================================
// FIELD TYPES
// ============================================================================

export interface Field {
  id: string;
  farm_id: string;
  farm_name?: string;
  name: string;
  area_hectares?: number;
  crop_type?: string;
  notes?: string;
  soil_type?: string;
  field_capacity?: number;
  current_cover_crop?: string;
  irrigation_system?: string;
  drainage_quality?: string;
  accessibility_score?: number;
  environmental_factors?: string;
  maintenance_schedule?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CROP TYPES
// ============================================================================

export interface Crop {
  id: string;
  farm_id: string;
  field_id: string;
  name: string;
  variety?: string;
  // Backwards-compatible field used in older UI
  crop_type?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  area_planted?: number;
  expected_yield?: number;
  actual_yield?: number;
  notes?: string;
  // Compatibility properties
  health_status?: string;
  growth_stage?: string;
  irrigation_schedule?: any;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// LIVESTOCK TYPES (Updated from Animal terminology)
// ============================================================================

export interface Livestock {
  id: string;
  farm_id: string;
  tag_number?: string;
  identification_tag?: string; // compatibility
  name?: string;
  species: string;
  breed?: string;
  sex: 'male' | 'female';
  date_of_birth?: string;
  weight?: number;
  health_status: 'healthy' | 'sick' | 'under_observation' | 'quarantine';
  production_type?: string;
  status: 'active' | 'sold' | 'deceased' | 'transferred';
  location?: string;
  intake_type?: string;
  pedigree?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LivestockHealth {
  id: string;
  livestock_id: string;
  health_status: 'healthy' | 'sick' | 'under_observation' | 'quarantine';
  checkup_date: string;
  next_checkup?: string;
  notes?: string;
  veterinarian?: string;
  treatments?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANIMAL TYPES (Legacy - for backward compatibility)
// ============================================================================

export interface Animal {
  id: string;
  farm_id: string;
  tag_number?: string;
  identification_tag?: string;
  name?: string;
  species: string;
  breed?: string;
  sex: 'male' | 'female';
  date_of_birth?: string;
  acquisition_date?: string;
  weight?: number;
  health_status: 'healthy' | 'sick' | 'under_observation' | 'quarantine';
  production_type?: string;
  status: 'active' | 'sold' | 'deceased' | 'transferred';
  location?: string;
  intake_type?: string;
  pedigree?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INVENTORY TYPES
// ============================================================================

export interface InventoryItem {
  id: string;
  farm_id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  unit_price?: number; // compatibility
  total_value?: number;
  location?: string;
  supplier?: string;
  sku?: string; // compatibility
  purchase_date?: string;
  expiry_date?: string;
  minimum_stock?: number;
  min_stock_threshold?: number; // compatibility
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  notes?: string;
  // Compatibility aliases for older/snake_case APIs
  cost_per_unit?: number;
  minimum_quantity?: number;
  reorder_level?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export interface Task {
  id: string;
  farm_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  task_type?: string;
  due_date?: string;
  completed_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  location?: string;
  resources_needed?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Convenience type aliases exported for compatibility
export type TaskPriority = Task['priority'];
export type TaskStatus = Task['status'];
export type FinanceRecord = FinanceEntry;

// ============================================================================
// FINANCE TYPES
// ============================================================================

export interface FinanceEntry {
  id: string;
  farm_id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method?: string;
  reference?: string;
  supplier?: string;
  customer?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
// Supplier entity for procurement features
export interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  contact_person?: string; // compatibility
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location {
  id: string;
  farm_id: string;
  name: string;
  type:
    | 'field'
    | 'barn'
    | 'storage'
    | 'pasture'
    | 'other'
    | 'paddock'
    | 'corral'
    | 'structure'
    | 'building';
  description?: string;
  area?: number;
  capacity?: number;
  current_occupancy?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// OPERATION TYPES
// ============================================================================

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

// ============================================================================
// TREATMENT TYPES
// ============================================================================

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

// ============================================================================
// ADDITIONAL TYPES
// ============================================================================

// Backwards-compatible small utility / legacy type aliases
export type BaseEntity = { id: string; created_at?: string; updated_at?: string };
export type PaginationParams = {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
};

// Auth helper types
export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  user?: User;
}
export interface AuthResponse {
  success: boolean;
  data?: any;
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

// Form helpers
export type FarmFormData = Partial<Farm> & { name?: string };

// Animal aliases (legacy names)
export type AnimalStatus = Livestock['status'];
export type AnimalSex = Livestock['sex'];
export type HealthStatus = LivestockHealth['health_status'];
export type IntakeType = string | undefined;

export interface AnimalMovement {
  id: string;
  animal_id: string;
  from?: string;
  to?: string;
  date: string;
  reason?: string;
}
export interface PedigreeNode {
  id: string;
  parent?: string;
  generation?: number;
}
export interface LivestockStats {
  total: number;
  healthy: number;
  sick: number;
}

// Crop aliases
export type CropStatus = Crop['status'];
export type CropHealthStatus = string;
export type CropTreatment = Treatment;
export type CropActivity = string;

// Finance and budget helpers
export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  net: number; // snake_case compatibility
  total_income?: number;
  total_expenses?: number;
}
export interface BudgetCategory {
  id: string;
  name?: string;
  category?: string; // compatibility - UI expects 'category'
  budget_limit?: number; // compatibility alias for allocated
  allocated?: number;
  spent?: number;
  fiscal_year?: number;
  farm_id?: string;
}
export type TransactionType = 'income' | 'expense';

// Inventory helpers
export interface InventoryAlert {
  id: string;
  item_id: string;
  level: 'low' | 'critical';
  created_at: string;
}
export type InventoryCategory = string;

// UI helpers
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
  onAdd?: () => void; // callback for creatable selects
}

export interface AnimalHealth {
  id: string;
  animal_id: string;
  health_status: 'healthy' | 'sick' | 'under_observation' | 'quarantine';
  checkup_date: string;
  next_checkup?: string;
  notes?: string;
  veterinarian?: string;
  treatments?: string[];
  created_at: string;
  updated_at: string;
}

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

export interface WeatherData {
  id: string;
  farm_id?: string;
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number;
  conditions: string;
  forecast?: string;
  created_at: string;
  updated_at: string;
}

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

// ============================================================================
// REQUEST TYPES
// ============================================================================

export type CreateRequest<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

export type UpdateRequest<T> = Partial<T>;

export interface InventoryAlert {
  id: string;
  inventory_item_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiry_warning' | 'discontinued';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}
