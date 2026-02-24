-- ============================================================================
-- FARMERS BOOT - INDEXES AND FUNCTIONS
-- ============================================================================
-- This migration creates indexes and database functions
-- Version: 02_indexes_functions
-- ============================================================================

-- Record this migration
INSERT INTO public.schema_migrations (version, description)
VALUES ('02_indexes_functions', 'Create indexes and database functions')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_farm_id_idx ON public.profiles(farm_id);

-- Farms indexes
CREATE INDEX IF NOT EXISTS farms_owner_id_idx ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS farms_location_id_idx ON public.farms(location_id);
CREATE INDEX IF NOT EXISTS farms_is_active_idx ON public.farms(is_active);

-- Fields indexes
CREATE INDEX IF NOT EXISTS fields_farm_id_idx ON public.fields(farm_id);
CREATE INDEX IF NOT EXISTS fields_is_active_idx ON public.fields(is_active);

-- Crops indexes
CREATE INDEX IF NOT EXISTS crops_name_idx ON public.crops(name);
CREATE INDEX IF NOT EXISTS crops_is_active_idx ON public.crops(is_active);

-- Crop plans indexes
CREATE INDEX IF NOT EXISTS crop_plans_field_id_idx ON public.crop_plans(field_id);
CREATE INDEX IF NOT EXISTS crop_plans_crop_id_idx ON public.crop_plans(crop_id);
CREATE INDEX IF NOT EXISTS crop_plans_status_idx ON public.crop_plans(status);
CREATE INDEX IF NOT EXISTS crop_plans_planting_date_idx ON public.crop_plans(planting_date);

-- Crop activities indexes
CREATE INDEX IF NOT EXISTS crop_activities_crop_plan_id_idx ON public.crop_activities(crop_plan_id);
CREATE INDEX IF NOT EXISTS crop_activities_status_idx ON public.crop_activities(status);
CREATE INDEX IF NOT EXISTS crop_activities_scheduled_date_idx ON public.crop_activities(scheduled_date);

-- Livestock indexes
CREATE INDEX IF NOT EXISTS livestock_farm_id_idx ON public.livestock(farm_id);
CREATE INDEX IF NOT EXISTS livestock_type_idx ON public.livestock(type);
CREATE INDEX IF NOT EXISTS livestock_status_idx ON public.livestock(status);
CREATE INDEX IF NOT EXISTS livestock_tag_number_idx ON public.livestock(tag_number);

-- Livestock health indexes
CREATE INDEX IF NOT EXISTS livestock_health_livestock_id_idx ON public.livestock_health(livestock_id);
CREATE INDEX IF NOT EXISTS livestock_health_check_date_idx ON public.livestock_health(check_date);

-- Livestock production indexes
CREATE INDEX IF NOT EXISTS livestock_production_livestock_id_idx ON public.livestock_production(livestock_id);
CREATE INDEX IF NOT EXISTS livestock_production_date_idx ON public.livestock_production(production_date);

-- Livestock breeding indexes
CREATE INDEX IF NOT EXISTS livestock_breeding_livestock_id_idx ON public.livestock_breeding(livestock_id);
CREATE INDEX IF NOT EXISTS livestock_breeding_date_idx ON public.livestock_breeding(breeding_date);
CREATE INDEX IF NOT EXISTS livestock_breeding_status_idx ON public.livestock_breeding(status);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS inventory_farm_id_idx ON public.inventory(farm_id);
CREATE INDEX IF NOT EXISTS inventory_category_idx ON public.inventory(category);
CREATE INDEX IF NOT EXISTS inventory_name_idx ON public.inventory(name);

-- Inventory transactions indexes
CREATE INDEX IF NOT EXISTS inventory_transactions_inventory_id_idx ON public.inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS inventory_transactions_type_idx ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS inventory_transactions_created_at_idx ON public.inventory_transactions(created_at);

-- Equipment indexes
CREATE INDEX IF NOT EXISTS equipment_farm_id_idx ON public.equipment(farm_id);
CREATE INDEX IF NOT EXISTS equipment_type_idx ON public.equipment(type);
CREATE INDEX IF NOT EXISTS equipment_status_idx ON public.equipment(status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS tasks_farm_id_idx ON public.tasks(farm_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);

-- Task time logs indexes
CREATE INDEX IF NOT EXISTS tasks_time_logs_task_id_idx ON public.tasks_time_logs(task_id);

-- Financial records indexes
CREATE INDEX IF NOT EXISTS financial_records_farm_id_idx ON public.financial_records(farm_id);
CREATE INDEX IF NOT EXISTS financial_records_type_idx ON public.financial_records(type);
CREATE INDEX IF NOT EXISTS financial_records_category_idx ON public.financial_records(category);
CREATE INDEX IF NOT EXISTS financial_records_date_idx ON public.financial_records(transaction_date);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS budgets_farm_id_idx ON public.budgets(farm_id);
CREATE INDEX IF NOT EXISTS budgets_fiscal_year_idx ON public.budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS budgets_status_idx ON public.budgets(status);

-- Budget categories indexes
CREATE INDEX IF NOT EXISTS budget_categories_budget_id_idx ON public.budget_categories(budget_id);

-- Weather data indexes
CREATE INDEX IF NOT EXISTS weather_data_location_id_idx ON public.weather_data(location_id);
CREATE INDEX IF NOT EXISTS weather_data_recorded_at_idx ON public.weather_data(recorded_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_table_name_idx ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);

-- Irrigation systems indexes
CREATE INDEX IF NOT EXISTS irrigation_systems_field_id_idx ON public.irrigation_systems(field_id);
CREATE INDEX IF NOT EXISTS irrigation_systems_status_idx ON public.irrigation_systems(status);

-- Irrigation schedules indexes
CREATE INDEX IF NOT EXISTS irrigation_schedules_system_id_idx ON public.irrigation_schedules(irrigation_system_id);
CREATE INDEX IF NOT EXISTS irrigation_schedules_status_idx ON public.irrigation_schedules(status);

-- Pest and disease indexes
CREATE INDEX IF NOT EXISTS pest_disease_records_field_id_idx ON public.pest_disease_records(field_id);
CREATE INDEX IF NOT EXISTS pest_disease_records_crop_id_idx ON public.pest_disease_records(crop_id);
CREATE INDEX IF NOT EXISTS pest_disease_records_livestock_id_idx ON public.pest_disease_records(livestock_id);
CREATE INDEX IF NOT EXISTS pest_disease_records_detection_date_idx ON public.pest_disease_records(detection_date);
CREATE INDEX IF NOT EXISTS pest_disease_records_status_idx ON public.pest_disease_records(status);

-- Crop rotation indexes
CREATE INDEX IF NOT EXISTS crop_rotations_field_id_idx ON public.crop_rotations(field_id);
CREATE INDEX IF NOT EXISTS crop_rotations_status_idx ON public.crop_rotations(status);

-- Crop rotation details indexes
CREATE INDEX IF NOT EXISTS crop_rotation_details_rotation_id_idx ON public.crop_rotation_details(rotation_id);
CREATE INDEX IF NOT EXISTS crop_rotation_details_crop_id_idx ON public.crop_rotation_details(crop_id);

-- Lookup tables indexes
CREATE INDEX IF NOT EXISTS lookup_breeds_species_idx ON public.lookup_breeds(species);
CREATE INDEX IF NOT EXISTS lookup_breeds_name_idx ON public.lookup_breeds(name);
CREATE INDEX IF NOT EXISTS lookup_varieties_crop_type_idx ON public.lookup_varieties(crop_type);
CREATE INDEX IF NOT EXISTS lookup_varieties_name_idx ON public.lookup_varieties(name);

-- Locations indexes
CREATE INDEX IF NOT EXISTS locations_country_idx ON public.locations(country);
CREATE INDEX IF NOT EXISTS locations_city_idx ON public.locations(city);

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

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

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

CREATE TRIGGER set_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_budget_categories_updated_at BEFORE UPDATE ON public.budget_categories
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_irrigation_systems_updated_at BEFORE UPDATE ON public.irrigation_systems
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_irrigation_schedules_updated_at BEFORE UPDATE ON public.irrigation_schedules
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_pest_disease_records_updated_at BEFORE UPDATE ON public.pest_disease_records
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_crop_rotations_updated_at BEFORE UPDATE ON public.crop_rotations
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_lookup_breeds_updated_at BEFORE UPDATE ON public.lookup_breeds
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

CREATE TRIGGER set_lookup_varieties_updated_at BEFORE UPDATE ON public.lookup_varieties
    FOR EACH ROW EXECUTE FUNCTION public.updated_at_column();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to safely delete a farm (soft delete)
CREATE OR REPLACE FUNCTION public.soft_delete_farm(farm_uuid uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.farms 
    SET is_active = false, updated_at = timezone('utc'::text, now())
    WHERE id = farm_uuid;
    
    UPDATE public.fields 
    SET is_active = false, updated_at = timezone('utc'::text, now())
    WHERE farm_id = farm_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get farm statistics
CREATE OR REPLACE FUNCTION public.get_farm_stats(farm_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_fields', (SELECT COUNT(*) FROM public.fields WHERE farm_id = farm_uuid AND is_active = true),
        'total_livestock', (SELECT COUNT(*) FROM public.livestock WHERE farm_id = farm_uuid),
        'healthy_livestock', (SELECT COUNT(*) FROM public.livestock WHERE farm_id = farm_uuid AND status = 'healthy'),
        'sick_livestock', (SELECT COUNT(*) FROM public.livestock WHERE farm_id = farm_uuid AND status = 'sick'),
        'pending_tasks', (SELECT COUNT(*) FROM public.tasks WHERE farm_id = farm_uuid AND status = 'pending'),
        'total_inventory_items', (SELECT COUNT(*) FROM public.inventory WHERE farm_id = farm_uuid),
        'low_stock_items', (SELECT COUNT(*) FROM public.inventory WHERE farm_id = farm_uuid AND quantity <= min_quantity),
        'active_crop_plans', (SELECT COUNT(*) FROM public.crop_plans cp 
                              JOIN public.fields f ON f.id = cp.field_id 
                              WHERE f.farm_id = farm_uuid AND cp.status IN ('planted', 'growing'))
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to calculate task duration
CREATE OR REPLACE FUNCTION public.calculate_task_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task duration calculation
CREATE TRIGGER calculate_time_log_duration BEFORE INSERT OR UPDATE ON public.tasks_time_logs
    FOR EACH ROW EXECUTE FUNCTION public.calculate_task_duration();

-- Function to update inventory on transaction
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    inv_quantity numeric;
    inv_min_quantity numeric;
BEGIN
    -- Get current inventory
    SELECT quantity, min_quantity INTO inv_quantity, inv_min_quantity
    FROM public.inventory WHERE id = NEW.inventory_id;
    
    -- Update quantity based on transaction type
    CASE NEW.transaction_type
        WHEN 'purchase' THEN
            UPDATE public.inventory SET quantity = quantity + NEW.quantity WHERE id = NEW.inventory_id;
        WHEN 'usage' THEN
            UPDATE public.inventory SET quantity = quantity - NEW.quantity WHERE id = NEW.inventory_id;
        WHEN 'sale' THEN
            UPDATE public.inventory SET quantity = quantity - NEW.quantity WHERE id = NEW.inventory_id;
        WHEN 'loss' THEN
            UPDATE public.inventory SET quantity = quantity - NEW.quantity WHERE id = NEW.inventory_id;
        WHEN 'adjustment' THEN
            UPDATE public.inventory SET quantity = NEW.quantity WHERE id = NEW.inventory_id;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inventory transactions
CREATE TRIGGER update_inventory_trigger AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_transaction();

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Indexes and functions created successfully';
END
$$;