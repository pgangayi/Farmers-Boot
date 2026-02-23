-- ============================================================================
-- CORE APPLICATION TABLES
-- ============================================================================
-- This migration creates all core tables for the Farmers Boot application
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('admin', 'farmer', 'worker', 'viewer')),
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================================
-- FARMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    description TEXT,
    total_area NUMERIC(10,2),
    area_hectares NUMERIC(10,2),
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Farms policies
CREATE POLICY "Users can view farms they own or are assigned to" ON public.farms
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id)
    );

CREATE POLICY "Users can create farms" ON public.farms
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their farms" ON public.farms
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their farms" ON public.farms
    FOR DELETE USING (owner_id = auth.uid());

-- ============================================================================
-- FIELDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area_hectares NUMERIC(10,2),
    crop_type TEXT,
    notes TEXT,
    soil_type TEXT,
    field_capacity NUMERIC(10,2),
    current_cover_crop TEXT,
    irrigation_system TEXT,
    drainage_quality TEXT,
    accessibility_score INTEGER CHECK (accessibility_score BETWEEN 1 AND 10),
    environmental_factors TEXT,
    maintenance_schedule TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- Fields policies (inherit access from farm)
CREATE POLICY "Users can view fields in accessible farms" ON public.fields
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = fields.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can create fields in accessible farms" ON public.fields
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = fields.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can update fields in accessible farms" ON public.fields
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = fields.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can delete fields in accessible farms" ON public.fields
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = fields.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- CROPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    variety TEXT,
    crop_type TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'planted', 'growing', 'harvested', 'failed')),
    health_status TEXT CHECK (health_status IN ('healthy', 'stress', 'disease', 'pest_damage')),
    growth_stage TEXT,
    area_planted NUMERIC(10,2),
    expected_yield NUMERIC(10,2),
    actual_yield NUMERIC(10,2),
    irrigation_schedule JSONB,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Crops policies (inherit access from farm)
CREATE POLICY "Users can view crops in accessible farms" ON public.crops
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = crops.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can create crops in accessible farms" ON public.crops
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = crops.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can update crops in accessible farms" ON public.crops
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = crops.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can delete crops in accessible farms" ON public.crops
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = crops.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- LIVESTOCK TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    tag_number TEXT,
    identification_tag TEXT,
    name TEXT,
    type TEXT NOT NULL CHECK (type IN ('cattle', 'goats', 'sheep', 'pigs', 'poultry', 'other')),
    species TEXT,
    breed TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    birth_date DATE,
    acquisition_date DATE,
    weight_kg NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deceased', 'quarantine', 'pregnant')),
    health_status TEXT CHECK (health_status IN ('healthy', 'sick', 'under_observation', 'quarantine')),
    production_type TEXT,
    location TEXT,
    intake_type TEXT,
    pedigree TEXT,
    purchase_price NUMERIC(12,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

-- Livestock policies
CREATE POLICY "Users can view livestock in accessible farms" ON public.livestock
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = livestock.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can create livestock in accessible farms" ON public.livestock
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = livestock.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can update livestock in accessible farms" ON public.livestock
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = livestock.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can delete livestock in accessible farms" ON public.livestock
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = livestock.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- LIVESTOCK HEALTH RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.livestock_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    livestock_id UUID NOT NULL REFERENCES public.livestock(id) ON DELETE CASCADE,
    check_date DATE NOT NULL,
    health_status TEXT NOT NULL,
    weight_kg NUMERIC(10,2),
    temperature NUMERIC(5,2),
    notes TEXT,
    veterinarian TEXT,
    treatment TEXT,
    cost NUMERIC(10,2),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.livestock_health ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('seed', 'fertilizer', 'equipment', 'feed', 'medicine', 'supply', 'other')),
    description TEXT,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    unit_cost NUMERIC(10,2),
    unit_price NUMERIC(10,2),
    total_value NUMERIC(12,2),
    location TEXT,
    supplier TEXT,
    sku TEXT,
    purchase_date DATE,
    expiry_date DATE,
    minimum_stock NUMERIC(10,2),
    min_stock_threshold NUMERIC(10,2),
    reorder_level NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock', 'discontinued')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Inventory policies
CREATE POLICY "Users can view inventory in accessible farms" ON public.inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = inventory.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can create inventory in accessible farms" ON public.inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = inventory.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can update inventory in accessible farms" ON public.inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = inventory.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can delete inventory in accessible farms" ON public.inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = inventory.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category TEXT,
    task_type TEXT,
    due_date DATE,
    completed_date DATE,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    location TEXT,
    resources_needed TEXT[],
    related_entity_type TEXT,
    related_entity_id UUID,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view tasks in accessible farms" ON public.tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = tasks.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can create tasks in accessible farms" ON public.tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = tasks.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can update tasks in accessible farms" ON public.tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = tasks.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can delete tasks in accessible farms" ON public.tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = tasks.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- FINANCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.finance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    entry_type TEXT CHECK (entry_type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_method TEXT,
    reference TEXT,
    supplier TEXT,
    customer TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.finance ENABLE ROW LEVEL SECURITY;

-- Finance policies
CREATE POLICY "Users can view finance records in accessible farms" ON public.finance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = finance.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can create finance records in accessible farms" ON public.finance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = finance.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can update finance records in accessible farms" ON public.finance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = finance.farm_id 
            AND (farms.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND farm_id = farms.id))
        )
    );

CREATE POLICY "Users can delete finance records in accessible farms" ON public.finance
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.farms 
            WHERE farms.id = finance.farm_id 
            AND farms.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('field', 'barn', 'storage', 'pasture', 'paddock', 'corral', 'structure', 'building', 'other')),
    description TEXT,
    area NUMERIC(10,2),
    capacity INTEGER,
    current_occupancy INTEGER,
    coordinates JSONB,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    products_supplied TEXT[],
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_farm_id ON public.profiles(farm_id);
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm_id ON public.fields(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON public.crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_crops_field_id ON public.crops(field_id);
CREATE INDEX IF NOT EXISTS idx_crops_status ON public.crops(status);
CREATE INDEX IF NOT EXISTS idx_livestock_farm_id ON public.livestock(farm_id);
CREATE INDEX IF NOT EXISTS idx_livestock_health_livestock_id ON public.livestock_health(livestock_id);
CREATE INDEX IF NOT EXISTS idx_inventory_farm_id ON public.inventory(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_tasks_farm_id ON public.tasks(farm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_farm_id ON public.finance(farm_id);
CREATE INDEX IF NOT EXISTS idx_finance_type ON public.finance(type);
CREATE INDEX IF NOT EXISTS idx_finance_date ON public.finance(transaction_date);
CREATE INDEX IF NOT EXISTS idx_locations_farm_id ON public.locations(farm_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON public.fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_livestock_health_updated_at BEFORE UPDATE ON public.livestock_health
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_updated_at BEFORE UPDATE ON public.finance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;