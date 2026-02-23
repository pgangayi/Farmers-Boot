-- ============================================================================
-- FARMERS BOOT DATABASE SCHEMA (Simplified for Local Development)
-- ============================================================================
-- This script creates the database schema for the Farmers Boot application
-- WITHOUT foreign key constraints for initial setup
-- ============================================================================

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text,
    full_name text,
    avatar_url text,
    phone text,
    role text DEFAULT 'farmer' CHECK (role IN ('admin', 'farmer', 'worker', 'viewer')),
    farm_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- FARMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.farms (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    description text,
    location_id uuid,
    owner_id uuid,
    area_hectares numeric,
    soil_type text,
    climate_zone text,
    elevation_meters numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    address text,
    city text,
    state text,
    country text DEFAULT 'Zimbabwe',
    postal_code text,
    latitude numeric,
    longitude numeric,
    timezone text DEFAULT 'Africa/Harare',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- FIELDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fields (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid,
    name text NOT NULL,
    description text,
    area_hectares numeric NOT NULL,
    soil_type text,
    soil_ph numeric,
    irrigation_type text,
    coordinates jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CROPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crops (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    scientific_name text,
    variety text,
    description text,
    growing_season_days integer,
    optimal_temp_min numeric,
    optimal_temp_max numeric,
    water_requirement_mm numeric,
    planting_depth_cm numeric,
    spacing_cm numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CROP PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crop_plans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    field_id uuid,
    crop_id uuid,
    season text NOT NULL,
    planting_date date,
    expected_harvest_date date,
    actual_harvest_date date,
    area_hectares numeric,
    expected_yield_kg_per_hectare numeric,
    actual_yield_kg numeric,
    status text DEFAULT 'planned' CHECK (status IN ('planned', 'planted', 'growing', 'harvested', 'failed')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CROP ACTIVITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crop_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    crop_plan_id uuid,
    activity_type text NOT NULL CHECK (activity_type IN ('planting', 'watering', 'fertilizing', 'pest_control', 'weeding', 'harvesting', 'other')),
    description text,
    scheduled_date date,
    completed_date date,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    cost numeric,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- LIVESTOCK
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid,
    type text NOT NULL CHECK (type IN ('cattle', 'goats', 'sheep', 'pigs', 'poultry', 'other')),
    breed text,
    tag_number text UNIQUE,
    name text,
    gender text CHECK (gender IN ('male', 'female', 'unknown')),
    birth_date date,
    weight_kg numeric,
    status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'sick', 'sold', 'deceased', 'pregnant')),
    purchase_date date,
    purchase_price numeric,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- LIVESTOCK HEALTH RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock_health (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    livestock_id uuid,
    check_date date NOT NULL,
    health_status text NOT NULL,
    weight_kg numeric,
    temperature numeric,
    notes text,
    veterinarian text,
    treatment text,
    cost numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid,
    name text NOT NULL,
    category text NOT NULL CHECK (category IN ('seeds', 'fertilizer', 'pesticide', 'equipment', 'feed', 'medicine', 'other')),
    description text,
    unit text NOT NULL,
    quantity numeric NOT NULL,
    min_quantity numeric,
    unit_price numeric,
    supplier text,
    expiry_date date,
    location text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INVENTORY TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_id uuid,
    transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'sale', 'loss', 'adjustment')),
    quantity numeric NOT NULL,
    unit_price numeric,
    total_price numeric,
    reason text,
    reference_number text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- EQUIPMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.equipment (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('tractor', 'plow', 'harvester', 'irrigation', 'sprayer', 'trailer', 'other')),
    brand text,
    model text,
    serial_number text UNIQUE,
    purchase_date date,
    purchase_price numeric,
    status text DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'broken', 'retired')),
    last_maintenance_date date,
    next_maintenance_date date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid,
    title text NOT NULL,
    description text,
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    assigned_to uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- FINANCIAL RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_records (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    category text NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'USD',
    description text,
    transaction_date date NOT NULL,
    reference_number text,
    payment_method text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- WEATHER DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.weather_data (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_id uuid,
    recorded_at timestamp with time zone NOT NULL,
    temperature_c numeric,
    humidity_percent numeric,
    wind_speed_kmh numeric,
    precipitation_mm numeric,
    pressure_hpa numeric,
    condition text,
    source text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL,
    type text NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title text NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    action_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS farms_owner_id_idx ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS farms_location_id_idx ON public.farms(location_id);
CREATE INDEX IF NOT EXISTS fields_farm_id_idx ON public.fields(farm_id);
CREATE INDEX IF NOT EXISTS crop_plans_field_id_idx ON public.crop_plans(field_id);
CREATE INDEX IF NOT EXISTS crop_plans_crop_id_idx ON public.crop_plans(crop_id);
CREATE INDEX IF NOT EXISTS crop_activities_crop_plan_id_idx ON public.crop_activities(crop_plan_id);
CREATE INDEX IF NOT EXISTS livestock_farm_id_idx ON public.livestock(farm_id);
CREATE INDEX IF NOT EXISTS livestock_type_idx ON public.livestock(type);
CREATE INDEX IF NOT EXISTS livestock_health_livestock_id_idx ON public.livestock_health(livestock_id);
CREATE INDEX IF NOT EXISTS inventory_farm_id_idx ON public.inventory(farm_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_inventory_id_idx ON public.inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS equipment_farm_id_idx ON public.equipment(farm_id);
CREATE INDEX IF NOT EXISTS tasks_farm_id_idx ON public.tasks(farm_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS financial_records_farm_id_idx ON public.financial_records(farm_id);
CREATE INDEX IF NOT EXISTS weather_data_location_id_idx ON public.weather_data(location_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_farms_updated_at BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_fields_updated_at BEFORE UPDATE ON public.fields
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_crops_updated_at BEFORE UPDATE ON public.crops
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_crop_plans_updated_at BEFORE UPDATE ON public.crop_plans
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_crop_activities_updated_at BEFORE UPDATE ON public.crop_activities
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_livestock_updated_at BEFORE UPDATE ON public.livestock
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_equipment_updated_at BEFORE UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- Lookup table for animal breeds
CREATE TABLE IF NOT EXISTS public.lookup_breeds (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    species text NOT NULL,
    characteristics text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Lookup table for crop varieties
CREATE TABLE IF NOT EXISTS public.lookup_varieties (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    crop_type text NOT NULL,
    name text NOT NULL,
    description text,
    days_to_maturity integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- LIVESTOCK HEALTH RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock_health (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    livestock_id uuid NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    check_date date NOT NULL,
    health_status text NOT NULL,
    weight_kg numeric,
    temperature numeric,
    notes text,
    veterinarian text,
    treatment text,
    medication text,
    dosage text,
    cost numeric,
    next_due_date date,
    vet_contact text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- LIVESTOCK PRODUCTION RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock_production (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    livestock_id uuid NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    production_date date NOT NULL,
    production_type text NOT NULL,
    quantity numeric NOT NULL,
    unit text NOT NULL,
    quality_grade text,
    price_per_unit numeric,
    total_value numeric,
    market_destination text,
    storage_location text,
    notes text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- LIVESTOCK BREEDING RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock_breeding (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    livestock_id uuid NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    breeding_date date NOT NULL,
    breeding_method text NOT NULL CHECK (breeding_method IN ('natural', 'artificial_insemination')),
    breeding_type text,
    mate_id uuid REFERENCES public.livestock(id),
    sire_id uuid REFERENCES public.livestock(id),
    technician_name text,
    notes text,
    breeding_notes text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    breeding_result text,
    expected_due_date date,
    expected_calving_date date,
    actual_date date,
    actual_calving_date date,
    offspring_count integer,
    breeding_fee numeric,
    vet_supervision boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TASK TIME LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks_time_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer,
    notes text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BUDGETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budgets (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    budget_name text NOT NULL,
    fiscal_year integer NOT NULL,
    period text NOT NULL,
    total_budget numeric NOT NULL,
    spent_amount numeric DEFAULT 0,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    description text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- BUDGET CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.budget_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    category text NOT NULL,
    allocated_amount numeric NOT NULL,
    spent_amount numeric DEFAULT 0,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- IRRIGATION SYSTEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.irrigation_systems (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    system_type text NOT NULL CHECK (system_type IN ('drip', 'sprinkler', 'flood', 'center_pivot', 'other')),
    name text NOT NULL,
    description text,
    installation_date date,
    last_maintenance_date date,
    next_maintenance_date date,
    status text DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'broken', 'retired')),
    water_source text,
    flow_rate_liters_per_hour numeric,
    coverage_area_hectares numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- IRRIGATION SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.irrigation_schedules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    irrigation_system_id uuid NOT NULL REFERENCES public.irrigation_systems(id) ON DELETE CASCADE,
    schedule_name text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    frequency_days integer,
    duration_minutes integer,
    water_amount_mm numeric,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    notes text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PEST AND DISEASE RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pest_disease_records (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    field_id uuid REFERENCES public.fields(id) ON DELETE CASCADE,
    crop_id uuid REFERENCES public.crops(id) ON DELETE SET NULL,
    livestock_id uuid REFERENCES public.livestock(id) ON DELETE SET NULL,
    record_type text NOT NULL CHECK (record_type IN ('pest', 'disease')),
    name text NOT NULL,
    scientific_name text,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'severe')),
    affected_area_hectares numeric,
    detection_date date NOT NULL,
    treatment_method text,
    treatment_date date,
    treatment_cost numeric,
    status text DEFAULT 'active' CHECK (status IN ('active', 'treated', 'resolved', 'monitoring')),
    notes text,
    reported_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CROP ROTATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crop_rotations (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
    rotation_name text NOT NULL,
    description text,
    start_year integer NOT NULL,
    duration_years integer NOT NULL,
    status text DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- CROP ROTATION DETAILS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crop_rotation_details (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rotation_id uuid NOT NULL REFERENCES public.crop_rotations(id) ON DELETE CASCADE,
    sequence_order integer NOT NULL,
    crop_id uuid NOT NULL REFERENCES public.crops(id),
    planting_date date,
    harvest_date date,
    area_hectares numeric,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES FOR NEW TABLES
-- ============================================================================

-- Lookup tables indexes
CREATE INDEX IF NOT EXISTS lookup_breeds_species_idx ON public.lookup_breeds(species);
CREATE INDEX IF NOT EXISTS lookup_breeds_name_idx ON public.lookup_breeds(name);
CREATE INDEX IF NOT EXISTS lookup_varieties_crop_type_idx ON public.lookup_varieties(crop_type);
CREATE INDEX IF NOT EXISTS lookup_varieties_name_idx ON public.lookup_varieties(name);

-- Livestock records indexes
CREATE INDEX IF NOT EXISTS livestock_health_livestock_id_idx ON public.livestock_health(livestock_id);
CREATE INDEX IF NOT EXISTS livestock_health_check_date_idx ON public.livestock_health(check_date);
CREATE INDEX IF NOT EXISTS livestock_production_livestock_id_idx ON public.livestock_production(livestock_id);
CREATE INDEX IF NOT EXISTS livestock_production_date_idx ON public.livestock_production(production_date);
CREATE INDEX IF NOT EXISTS livestock_breeding_livestock_id_idx ON public.livestock_breeding(livestock_id);
CREATE INDEX IF NOT EXISTS livestock_breeding_date_idx ON public.livestock_breeding(breeding_date);

-- Tasks and budgets indexes
CREATE INDEX IF NOT EXISTS tasks_time_logs_task_id_idx ON public.tasks_time_logs(task_id);
CREATE INDEX IF NOT EXISTS budgets_farm_id_idx ON public.budgets(farm_id);
CREATE INDEX IF NOT EXISTS budgets_fiscal_year_idx ON public.budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS budget_categories_budget_id_idx ON public.budget_categories(budget_id);

-- Irrigation indexes
CREATE INDEX IF NOT EXISTS irrigation_systems_field_id_idx ON public.irrigation_systems(field_id);
CREATE INDEX IF NOT EXISTS irrigation_schedules_system_id_idx ON public.irrigation_schedules(irrigation_system_id);

-- Pest and disease indexes
CREATE INDEX IF NOT EXISTS pest_disease_records_field_id_idx ON public.pest_disease_records(field_id);
CREATE INDEX IF NOT EXISTS pest_disease_records_crop_id_idx ON public.pest_disease_records(crop_id);
CREATE INDEX IF NOT EXISTS pest_disease_records_livestock_id_idx ON public.pest_disease_records(livestock_id);
CREATE INDEX IF NOT EXISTS pest_disease_records_detection_date_idx ON public.pest_disease_records(detection_date);

-- Crop rotation indexes
CREATE INDEX IF NOT EXISTS crop_rotations_field_id_idx ON public.crop_rotations(field_id);
CREATE INDEX IF NOT EXISTS crop_rotation_details_rotation_id_idx ON public.crop_rotation_details(rotation_id);
CREATE INDEX IF NOT EXISTS crop_rotation_details_crop_id_idx ON public.crop_rotation_details(crop_id);

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Farmers Boot database schema created successfully (simplified version)';
END
$$;
