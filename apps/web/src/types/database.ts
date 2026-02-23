/**
 * ============================================================================
 * DATABASE TYPES
 * ============================================================================
 * TypeScript types aligned with database schema
 * ============================================================================
 */

// Base types
export type UUID = string;
export type Timestamp = string; // ISO 8601 timestamp string
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export interface JSONArray extends Array<JSONValue> {}

// Base entity interface
export interface BaseEntity {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// User and authentication types
export interface User extends BaseEntity {
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: Timestamp;
  farm_id?: UUID;
  metadata?: JSONObject;
}

export type UserRole = 'admin' | 'farmer' | 'worker' | 'viewer';

// Farm management types
export interface Farm extends BaseEntity {
  name: string;
  description?: string;
  location_id?: UUID;
  owner_id: UUID;
  area_hectares?: number;
  soil_type?: SoilType;
  climate_zone?: ClimateZone;
  elevation_meters?: number;
  is_active: boolean;
  metadata?: JSONObject;
}

export type SoilType = 'clay' | 'sandy' | 'loam' | 'silt' | 'peat' | 'chalk';
export type ClimateZone = 'tropical' | 'temperate' | 'arid' | 'mediterranean' | 'continental';

export interface Location extends BaseEntity {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  metadata?: JSONObject;
}

// Field management types
export interface Field extends BaseEntity {
  name: string;
  farm_id: string;
  location_id?: string;
  area_hectares: number;
  soil_type: string;
  soil_ph?: number;
  irrigation_system_id?: string;
  is_active: boolean;
  coordinates?: GeoJSON.Polygon;
}

export interface IrrigationSystem extends BaseEntity {
  name: string;
  type: 'drip' | 'sprinkler' | 'flood' | 'center_pivot' | 'manual';
  field_id: string;
  coverage_area_hectares: number;
  water_source?: string;
  efficiency_rating?: number;
  installation_date?: string;
  last_maintenance_date?: string;
  is_active: boolean;
}

// Crop management types
export interface Crop extends BaseEntity {
  name: string;
  variety?: string;
  category: 'cereals' | 'vegetables' | 'fruits' | 'legumes' | 'tubers' | 'other';
  growing_season_days: number;
  expected_yield_kg_per_hectare: number;
  planting_depth_cm?: number;
  spacing_cm?: number;
  water_requirements_mm?: number;
  optimal_temperature_min?: number;
  optimal_temperature_max?: number;
  optimal_ph_min?: number;
  optimal_ph_max?: number;
  is_active: boolean;
  metadata?: CropMetadata;
}

export interface CropMetadata {
  suitable_seasons: string[];
  suitable_soils: string[];
  suitable_climates: string[];
  optimal_ph: {
    min: number;
    max: number;
  };
  fertilizer_requirements?: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
  };
  common_pests?: string[];
  common_diseases?: string[];
}

export interface CropPlan extends BaseEntity {
  field_id: string;
  crop_id: string;
  farm_id: string;
  planned_area_hectares: number;
  actual_area_hectares?: number;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  notes?: string;
  expected_yield_kg?: number;
  actual_yield_kg?: number;
}

// Livestock management types
export interface Livestock extends BaseEntity {
  tag_id: string;
  breed_id: string;
  farm_id: string;
  name?: string;
  gender: 'male' | 'female';
  birth_date?: string;
  weight_kg?: number;
  status: 'healthy' | 'sick' | 'sold' | 'deceased';
  location?: string;
  notes?: string;
  mother_id?: string;
  father_id?: string;
}

export interface Breed extends BaseEntity {
  name: string;
  species: 'cattle' | 'sheep' | 'goats' | 'pigs' | 'poultry' | 'other';
  characteristics?: string;
  average_weight_kg?: number;
  maturity_days?: number;
  typical_use: 'meat' | 'dairy' | 'wool' | 'eggs' | 'mixed' | 'other';
  climate_suitability?: string;
  is_active: boolean;
}

export interface LivestockHealth extends BaseEntity {
  livestock_id: string;
  farm_id: string;
  check_date: string;
  weight_kg?: number;
  temperature_c?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  dosage?: string;
  next_check_date?: string;
  veterinarian_id?: string;
  notes?: string;
}

export interface LivestockProduction extends BaseEntity {
  livestock_id: string;
  farm_id: string;
  production_type: 'milk' | 'eggs' | 'wool' | 'meat' | 'other';
  production_date: string;
  quantity: number;
  unit: 'liters' | 'kilograms' | 'grams' | 'pieces' | 'other';
  quality_grade?: string;
  notes?: string;
}

export interface LivestockBreeding extends BaseEntity {
  female_id: string;
  male_id: string;
  farm_id: string;
  breeding_date: string;
  expected_birth_date?: string;
  actual_birth_date?: string;
  success: boolean;
  offspring_count?: number;
  notes?: string;
}

// Task management types
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  farm_id: string;
  field_id?: string;
  livestock_id?: string;
  equipment_id?: string;
  assigned_to?: string;
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  estimated_duration_hours?: number;
  actual_duration_hours?: number;
  task_type:
    | 'planting'
    | 'harvesting'
    | 'irrigation'
    | 'fertilizing'
    | 'pest_control'
    | 'maintenance'
    | 'feeding'
    | 'health_check'
    | 'other';
  notes?: string;
}

export interface TaskTimeLog extends BaseEntity {
  task_id: string;
  user_id: string;
  farm_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  notes?: string;
}

// Inventory and equipment types
export interface Inventory extends BaseEntity {
  name: string;
  description?: string;
  farm_id: string;
  category:
    | 'seed'
    | 'fertilizer'
    | 'pesticide'
    | 'feed'
    | 'medicine'
    | 'fuel'
    | 'spare_part'
    | 'tool'
    | 'other';
  current_quantity: number;
  unit: 'kg' | 'liters' | 'pieces' | 'bags' | 'bottles' | 'boxes' | 'other';
  minimum_quantity: number;
  maximum_quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  supplier?: string;
  storage_location?: string;
  expiration_date?: string;
  batch_number?: string;
  notes?: string;
}

export interface Equipment extends BaseEntity {
  name: string;
  description?: string;
  farm_id: string;
  category:
    | 'tractor'
    | 'plow'
    | 'harvester'
    | 'irrigation'
    | 'sprayer'
    | 'tiller'
    | 'trailer'
    | 'tool'
    | 'other';
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  current_value?: number;
  status: 'operational' | 'maintenance' | 'repair' | 'retired';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  operating_hours?: number;
  fuel_type?: 'diesel' | 'gasoline' | 'electric' | 'manual';
  notes?: string;
}

// Financial types
export interface Budget extends BaseEntity {
  name: string;
  description?: string;
  farm_id: string;
  fiscal_year: string;
  total_budgeted: number;
  total_spent?: number;
  status: 'draft' | 'active' | 'closed';
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface BudgetCategory extends BaseEntity {
  budget_id: string;
  name: string;
  category_type: 'income' | 'expense';
  budgeted_amount: number;
  actual_amount?: number;
  description?: string;
}

export interface Transaction extends BaseEntity {
  farm_id: string;
  category_id?: string;
  description: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  transaction_date: string;
  reference_number?: string;
  supplier?: string;
  customer?: string;
  notes?: string;
  receipt_url?: string;
}

// Weather and environmental types
export interface WeatherData extends BaseEntity {
  location_id: string;
  recorded_at: string;
  temperature_c: number;
  humidity_percent: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  wind_direction_degrees?: number;
  pressure_hpa?: number;
  visibility_km?: number;
  uv_index?: number;
  condition: 'sunny' | 'cloudy' | 'partly_cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy';
  data_source: 'manual' | 'api' | 'sensor';
}

// Pest and disease management types
export interface PestDiseaseRecord extends BaseEntity {
  field_id?: string;
  crop_id?: string;
  livestock_id?: string;
  farm_id: string;
  record_date: string;
  type: 'pest' | 'disease';
  name: string;
  scientific_name?: string;
  severity: 'low' | 'medium' | 'high' | 'severe';
  affected_area_hectares?: number;
  affected_count?: number;
  symptoms?: string;
  treatment_method?: string;
  treatment_product?: string;
  treatment_cost?: number;
  effectiveness?: 'none' | 'low' | 'medium' | 'high';
  prevention_measures?: string;
  notes?: string;
  images?: string[];
}

// Crop rotation types
export interface CropRotation extends BaseEntity {
  field_id: string;
  farm_id: string;
  rotation_name: string;
  start_date: string;
  end_date?: string;
  status: 'planned' | 'active' | 'completed';
  description?: string;
  notes?: string;
}

export interface CropRotationPlan extends BaseEntity {
  rotation_id: string;
  crop_id: string;
  sequence_order: number;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  area_hectares: number;
  notes?: string;
}

// Notification types
export interface Notification extends BaseEntity {
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  category: 'task' | 'weather' | 'livestock' | 'inventory' | 'financial' | 'system' | 'other';
  priority: 'low' | 'medium' | 'high';
  expires_at?: string;
}

// Audit and system types
export interface AuditLog extends BaseEntity {
  user_id?: string;
  farm_id?: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'other';
  table_name: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  notes?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    timestamp: string;
    requestId?: string;
  };
}

// Form and validation types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: unknown) => string | undefined;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: unknown;
}

// Export all types for easy importing
export type {
  // Re-export commonly used types
  User as AppUser,
};
