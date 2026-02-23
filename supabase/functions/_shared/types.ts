/**
 * ============================================================================
 * SHARED TYPES
 * ============================================================================
 * Common types used across Supabase Edge Functions
 * ============================================================================
 */

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'admin' | 'farmer' | 'worker' | 'viewer';
  farm_id: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface Farm {
  id: string;
  name: string;
  description: string | null;
  location_id: string | null;
  owner_id: string | null;
  area_hectares: number | null;
  soil_type: string | null;
  climate_zone: string | null;
  elevation_meters: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  description: string | null;
  area_hectares: number;
  soil_type: string | null;
  soil_ph: number | null;
  irrigation_type: string | null;
  coordinates: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface Crop {
  id: string;
  name: string;
  scientific_name: string | null;
  variety: string | null;
  description: string | null;
  growing_season_days: number | null;
  optimal_temp_min: number | null;
  optimal_temp_max: number | null;
  water_requirement_mm: number | null;
  planting_depth_cm: number | null;
  spacing_cm: number | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface CropPlan {
  id: string;
  field_id: string;
  crop_id: string;
  season: string;
  planting_date: string | null;
  expected_harvest_date: string | null;
  actual_harvest_date: string | null;
  area_hectares: number | null;
  expected_yield_kg_per_hectare: number | null;
  actual_yield_kg: number | null;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  metadata: Record<string, any>;
}

export interface CropActivity {
  id: string;
  crop_plan_id: string;
  activity_type:
    | 'planting'
    | 'watering'
    | 'fertilizing'
    | 'pest_control'
    | 'weeding'
    | 'harvesting'
    | 'other';
  description: string | null;
  scheduled_date: string | null;
  completed_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  metadata: Record<string, any>;
}

export interface Livestock {
  id: string;
  farm_id: string;
  type: 'cattle' | 'goats' | 'sheep' | 'pigs' | 'poultry' | 'other';
  breed: string | null;
  tag_number: string | null;
  name: string | null;
  gender: 'male' | 'female' | 'unknown';
  birth_date: string | null;
  weight_kg: number | null;
  status: 'healthy' | 'sick' | 'sold' | 'deceased' | 'pregnant';
  purchase_date: string | null;
  purchase_price: number | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface LivestockHealth {
  id: string;
  livestock_id: string;
  check_date: string;
  health_status: string;
  weight_kg: number | null;
  temperature: number | null;
  notes: string | null;
  veterinarian: string | null;
  treatment: string | null;
  cost: number | null;
  created_at: string;
  created_by: string | null;
  metadata: Record<string, any>;
}

export interface Inventory {
  id: string;
  farm_id: string;
  name: string;
  category: 'seeds' | 'fertilizer' | 'pesticide' | 'equipment' | 'feed' | 'medicine' | 'other';
  description: string | null;
  unit: string;
  quantity: number;
  min_quantity: number | null;
  unit_price: number | null;
  supplier: string | null;
  expiry_date: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: 'purchase' | 'usage' | 'sale' | 'loss' | 'adjustment';
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  reason: string | null;
  reference_number: string | null;
  created_at: string;
  created_by: string | null;
  metadata: Record<string, any>;
}

export interface Equipment {
  id: string;
  farm_id: string;
  name: string;
  type: 'tractor' | 'plow' | 'harvester' | 'irrigation' | 'sprayer' | 'trailer' | 'other';
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  status: 'operational' | 'maintenance' | 'broken' | 'retired';
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface Task {
  id: string;
  farm_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface FinancialRecord {
  id: string;
  farm_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  transaction_date: string;
  reference_number: string | null;
  payment_method: string | null;
  created_at: string;
  created_by: string | null;
  metadata: Record<string, any>;
}

export interface WeatherData {
  id: string;
  location_id: string;
  recorded_at: string;
  temperature_c: number | null;
  humidity_percent: number | null;
  wind_speed_kmh: number | null;
  precipitation_mm: number | null;
  pressure_hpa: number | null;
  condition: string | null;
  source: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

// API Request/Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface FilterOptions {
  where?: Record<string, any>;
  orderBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: AuthUser;
}

// Webhook types
export interface WebhookEvent {
  id: string;
  event: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// AI types
export interface AIRequest {
  type:
    | 'crop_recommendation'
    | 'pest_detection'
    | 'weather_forecast'
    | 'yield_prediction'
    | 'custom';
  input: Record<string, any>;
}

export interface AIResponse {
  type: string;
  result: any;
  confidence?: number;
  metadata?: Record<string, any>;
}

// Search types
export interface SearchResult<T = any> {
  id: string;
  type: string;
  title: string;
  description?: string;
  data: T;
  score?: number;
}

export interface SearchOptions {
  query: string;
  types?: string[];
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}
