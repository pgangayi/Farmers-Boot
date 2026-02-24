-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- This migration enables RLS on all tables and creates appropriate policies
-- for multi-tenant data isolation based on farm ownership and user roles.
--
-- Security Model:
-- - Admin: Full access to all data
-- - Farmer: Full access to their farm's data
-- - Worker: Read/write access to assigned farm's data
-- - Viewer: Read-only access to assigned farm's data
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user's farm_id
CREATE OR REPLACE FUNCTION auth.user_farm_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT farm_id FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user has farm access
CREATE OR REPLACE FUNCTION auth.has_farm_access(farm_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin has access to all farms
  IF auth.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user belongs to the farm
  RETURN auth.user_farm_id() = farm_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.is_admin());

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (auth.is_admin());

-- ============================================================================
-- FARMS TABLE
-- ============================================================================

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Users can view farms they belong to
CREATE POLICY "Users can view their farm"
  ON public.farms FOR SELECT
  USING (
    auth.is_admin() OR
    id = auth.user_farm_id() OR
    owner_id = auth.uid()
  );

-- Admins can insert farms
CREATE POLICY "Admins can insert farms"
  ON public.farms FOR INSERT
  WITH CHECK (auth.is_admin());

-- Farm owners can update their farms
CREATE POLICY "Farm owners can update their farms"
  ON public.farms FOR UPDATE
  USING (
    auth.is_admin() OR
    owner_id = auth.uid()
  );

-- Admins can delete farms
CREATE POLICY "Admins can delete farms"
  ON public.farms FOR DELETE
  USING (auth.is_admin());

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Users can view locations (publicly accessible for address lookup)
CREATE POLICY "All authenticated users can view locations"
  ON public.locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage locations
CREATE POLICY "Admins can insert locations"
  ON public.locations FOR INSERT
  WITH CHECK (auth.is_admin());

CREATE POLICY "Admins can update locations"
  ON public.locations FOR UPDATE
  USING (auth.is_admin());

CREATE POLICY "Admins can delete locations"
  ON public.locations FOR DELETE
  USING (auth.is_admin());

-- ============================================================================
-- FIELDS TABLE
-- ============================================================================

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- Users can view fields in their farm
CREATE POLICY "Users can view fields in their farm"
  ON public.fields FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id)
  );

-- Farmers and workers can insert fields
CREATE POLICY "Farmers and workers can insert fields"
  ON public.fields FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers and workers can update fields
CREATE POLICY "Farmers and workers can update fields"
  ON public.fields FOR UPDATE
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers can delete fields
CREATE POLICY "Farmers can delete fields"
  ON public.fields FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- CROPS TABLE
-- ============================================================================

ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Users can view crops (reference data)
CREATE POLICY "All authenticated users can view crops"
  ON public.crops FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage crops
CREATE POLICY "Admins can manage crops"
  ON public.crops FOR ALL
  USING (auth.is_admin());

-- ============================================================================
-- CROP PLANS TABLE
-- ============================================================================

ALTER TABLE public.crop_plans ENABLE ROW LEVEL SECURITY;

-- Users can view crop plans in their farm
CREATE POLICY "Users can view crop plans in their farm"
  ON public.crop_plans FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    )
  );

-- Farmers and workers can insert crop plans
CREATE POLICY "Farmers and workers can insert crop plans"
  ON public.crop_plans FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    ))
  );

-- Farmers and workers can update crop plans
CREATE POLICY "Farmers and workers can update crop plans"
  ON public.crop_plans FOR UPDATE
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    ))
  );

-- Farmers can delete crop plans
CREATE POLICY "Farmers can delete crop plans"
  ON public.crop_plans FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    ))
  );

-- ============================================================================
-- CROP ACTIVITIES TABLE
-- ============================================================================

ALTER TABLE public.crop_activities ENABLE ROW LEVEL SECURITY;

-- Users can view crop activities in their farm
CREATE POLICY "Users can view crop activities in their farm"
  ON public.crop_activities FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT f.farm_id FROM public.fields f 
       JOIN public.crop_plans cp ON cp.field_id = f.id 
       WHERE cp.id = crop_plan_id)
    )
  );

-- Farmers and workers can manage crop activities
CREATE POLICY "Farmers and workers can manage crop activities"
  ON public.crop_activities FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT f.farm_id FROM public.fields f 
       JOIN public.crop_plans cp ON cp.field_id = f.id 
       WHERE cp.id = crop_plan_id)
    ))
  );

-- ============================================================================
-- LIVESTOCK TABLE
-- ============================================================================

ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

-- Users can view livestock in their farm
CREATE POLICY "Users can view livestock in their farm"
  ON public.livestock FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id)
  );

-- Farmers and workers can insert livestock
CREATE POLICY "Farmers and workers can insert livestock"
  ON public.livestock FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers and workers can update livestock
CREATE POLICY "Farmers and workers can update livestock"
  ON public.livestock FOR UPDATE
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers can delete livestock
CREATE POLICY "Farmers can delete livestock"
  ON public.livestock FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- LIVESTOCK HEALTH TABLE
-- ============================================================================

ALTER TABLE public.livestock_health ENABLE ROW LEVEL SECURITY;

-- Users can view health records for their farm's livestock
CREATE POLICY "Users can view livestock health in their farm"
  ON public.livestock_health FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    )
  );

-- Farmers and workers can manage health records
CREATE POLICY "Farmers and workers can manage livestock health"
  ON public.livestock_health FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    ))
  );

-- ============================================================================
-- LIVESTOCK PRODUCTION TABLE
-- ============================================================================

ALTER TABLE public.livestock_production ENABLE ROW LEVEL SECURITY;

-- Users can view production records for their farm's livestock
CREATE POLICY "Users can view livestock production in their farm"
  ON public.livestock_production FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    )
  );

-- Farmers and workers can manage production records
CREATE POLICY "Farmers and workers can manage livestock production"
  ON public.livestock_production FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    ))
  );

-- ============================================================================
-- LIVESTOCK BREEDING TABLE
-- ============================================================================

ALTER TABLE public.livestock_breeding ENABLE ROW LEVEL SECURITY;

-- Users can view breeding records for their farm's livestock
CREATE POLICY "Users can view livestock breeding in their farm"
  ON public.livestock_breeding FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    )
  );

-- Farmers and workers can manage breeding records
CREATE POLICY "Farmers and workers can manage livestock breeding"
  ON public.livestock_breeding FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    ))
  );

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Users can view inventory in their farm
CREATE POLICY "Users can view inventory in their farm"
  ON public.inventory FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id)
  );

-- Farmers and workers can insert inventory
CREATE POLICY "Farmers and workers can insert inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers and workers can update inventory
CREATE POLICY "Farmers and workers can update inventory"
  ON public.inventory FOR UPDATE
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers can delete inventory
CREATE POLICY "Farmers can delete inventory"
  ON public.inventory FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- INVENTORY TRANSACTIONS TABLE
-- ============================================================================

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions for their farm's inventory
CREATE POLICY "Users can view inventory transactions in their farm"
  ON public.inventory_transactions FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.inventory WHERE id = inventory_id)
    )
  );

-- Farmers and workers can insert transactions
CREATE POLICY "Farmers and workers can insert inventory transactions"
  ON public.inventory_transactions FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.inventory WHERE id = inventory_id)
    ))
  );

-- ============================================================================
-- EQUIPMENT TABLE
-- ============================================================================

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- Users can view equipment in their farm
CREATE POLICY "Users can view equipment in their farm"
  ON public.equipment FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id)
  );

-- Farmers and workers can insert equipment
CREATE POLICY "Farmers and workers can insert equipment"
  ON public.equipment FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers and workers can update equipment
CREATE POLICY "Farmers and workers can update equipment"
  ON public.equipment FOR UPDATE
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers can delete equipment
CREATE POLICY "Farmers can delete equipment"
  ON public.equipment FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks in their farm
CREATE POLICY "Users can view tasks in their farm"
  ON public.tasks FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id) OR
    assigned_to = auth.uid()
  );

-- Farmers and workers can insert tasks
CREATE POLICY "Farmers and workers can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(farm_id))
  );

-- Farmers and workers can update tasks
CREATE POLICY "Farmers and workers can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id) OR
    assigned_to = auth.uid()
  );

-- Farmers can delete tasks
CREATE POLICY "Farmers can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- TASKS TIME LOGS TABLE
-- ============================================================================

ALTER TABLE public.tasks_time_logs ENABLE ROW LEVEL SECURITY;

-- Users can view time logs for tasks in their farm
CREATE POLICY "Users can view time logs in their farm"
  ON public.tasks_time_logs FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.tasks WHERE id = task_id)
    )
  );

-- Farmers and workers can manage time logs
CREATE POLICY "Farmers and workers can manage time logs"
  ON public.tasks_time_logs FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.tasks WHERE id = task_id)
    ))
  );

-- ============================================================================
-- FINANCIAL RECORDS TABLE
-- ============================================================================

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Users can view financial records in their farm
CREATE POLICY "Users can view financial records in their farm"
  ON public.financial_records FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id)
  );

-- Farmers can insert financial records
CREATE POLICY "Farmers can insert financial records"
  ON public.financial_records FOR INSERT
  WITH CHECK (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- Farmers can update financial records
CREATE POLICY "Farmers can update financial records"
  ON public.financial_records FOR UPDATE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- Farmers can delete financial records
CREATE POLICY "Farmers can delete financial records"
  ON public.financial_records FOR DELETE
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Users can view budgets in their farm
CREATE POLICY "Users can view budgets in their farm"
  ON public.budgets FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(farm_id)
  );

-- Farmers can manage budgets
CREATE POLICY "Farmers can manage budgets"
  ON public.budgets FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(farm_id))
  );

-- ============================================================================
-- BUDGET CATEGORIES TABLE
-- ============================================================================

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Users can view budget categories in their farm
CREATE POLICY "Users can view budget categories in their farm"
  ON public.budget_categories FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.budgets WHERE id = budget_id)
    )
  );

-- Farmers can manage budget categories
CREATE POLICY "Farmers can manage budget categories"
  ON public.budget_categories FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(
      (SELECT farm_id FROM public.budgets WHERE id = budget_id)
    ))
  );

-- ============================================================================
-- WEATHER DATA TABLE
-- ============================================================================

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Users can view weather data for their locations
CREATE POLICY "Users can view weather data for their farm"
  ON public.weather_data FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.farms WHERE location_id = location_id)
    )
  );

-- System can insert weather data (service role)
CREATE POLICY "Service role can manage weather data"
  ON public.weather_data FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    auth.is_admin() OR
    user_id = auth.uid()
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- IRRIGATION SYSTEMS TABLE
-- ============================================================================

ALTER TABLE public.irrigation_systems ENABLE ROW LEVEL SECURITY;

-- Users can view irrigation systems in their farm
CREATE POLICY "Users can view irrigation systems in their farm"
  ON public.irrigation_systems FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    )
  );

-- Farmers and workers can manage irrigation systems
CREATE POLICY "Farmers and workers can manage irrigation systems"
  ON public.irrigation_systems FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    ))
  );

-- ============================================================================
-- IRRIGATION SCHEDULES TABLE
-- ============================================================================

ALTER TABLE public.irrigation_schedules ENABLE ROW LEVEL SECURITY;

-- Users can view irrigation schedules in their farm
CREATE POLICY "Users can view irrigation schedules in their farm"
  ON public.irrigation_schedules FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT f.farm_id FROM public.fields f 
       JOIN public.irrigation_systems iss ON iss.field_id = f.id 
       WHERE iss.id = irrigation_system_id)
    )
  );

-- Farmers and workers can manage irrigation schedules
CREATE POLICY "Farmers and workers can manage irrigation schedules"
  ON public.irrigation_schedules FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND auth.has_farm_access(
      (SELECT f.farm_id FROM public.fields f 
       JOIN public.irrigation_systems iss ON iss.field_id = f.id 
       WHERE iss.id = irrigation_system_id)
    ))
  );

-- ============================================================================
-- PEST AND DISEASE RECORDS TABLE
-- ============================================================================

ALTER TABLE public.pest_disease_records ENABLE ROW LEVEL SECURITY;

-- Users can view pest/disease records in their farm
CREATE POLICY "Users can view pest disease records in their farm"
  ON public.pest_disease_records FOR SELECT
  USING (
    auth.is_admin() OR
    (field_id IS NOT NULL AND auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    )) OR
    (livestock_id IS NOT NULL AND auth.has_farm_access(
      (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
    ))
  );

-- Farmers and workers can manage pest/disease records (with farm access check)
CREATE POLICY "Farmers and workers can manage pest disease records"
  ON public.pest_disease_records FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() IN ('farmer', 'worker') AND (
      (field_id IS NOT NULL AND auth.has_farm_access(
        (SELECT farm_id FROM public.fields WHERE id = field_id)
      )) OR
      (livestock_id IS NOT NULL AND auth.has_farm_access(
        (SELECT farm_id FROM public.livestock WHERE id = livestock_id)
      )) OR
      (crop_id IS NOT NULL AND auth.has_farm_access(
        (SELECT f.farm_id FROM public.fields f 
         JOIN public.crop_plans cp ON cp.field_id = f.id 
         WHERE cp.crop_id = crop_id LIMIT 1)
      ))
    ))
  );

-- ============================================================================
-- CROP ROTATIONS TABLE
-- ============================================================================

ALTER TABLE public.crop_rotations ENABLE ROW LEVEL SECURITY;

-- Users can view crop rotations in their farm
CREATE POLICY "Users can view crop rotations in their farm"
  ON public.crop_rotations FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    )
  );

-- Farmers can manage crop rotations
CREATE POLICY "Farmers can manage crop rotations"
  ON public.crop_rotations FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(
      (SELECT farm_id FROM public.fields WHERE id = field_id)
    ))
  );

-- ============================================================================
-- CROP ROTATION DETAILS TABLE
-- ============================================================================

ALTER TABLE public.crop_rotation_details ENABLE ROW LEVEL SECURITY;

-- Users can view crop rotation details in their farm
CREATE POLICY "Users can view crop rotation details in their farm"
  ON public.crop_rotation_details FOR SELECT
  USING (
    auth.is_admin() OR
    auth.has_farm_access(
      (SELECT f.farm_id FROM public.fields f 
       JOIN public.crop_rotations cr ON cr.field_id = f.id 
       WHERE cr.id = rotation_id)
    )
  );

-- Farmers can manage crop rotation details
CREATE POLICY "Farmers can manage crop rotation details"
  ON public.crop_rotation_details FOR ALL
  USING (
    auth.is_admin() OR
    (auth.user_role() = 'farmer' AND auth.has_farm_access(
      (SELECT f.farm_id FROM public.fields f 
       JOIN public.crop_rotations cr ON cr.field_id = f.id 
       WHERE cr.id = rotation_id)
    ))
  );

-- ============================================================================
-- LOOKUP TABLES (Public Read Access)
-- ============================================================================

-- Lookup breeds - read-only for authenticated users
ALTER TABLE public.lookup_breeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view breeds"
  ON public.lookup_breeds FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage breeds"
  ON public.lookup_breeds FOR ALL
  USING (auth.is_admin());

-- Lookup varieties - read-only for authenticated users
ALTER TABLE public.lookup_varieties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view varieties"
  ON public.lookup_varieties FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage varieties"
  ON public.lookup_varieties FOR ALL
  USING (auth.is_admin());

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies created successfully for all tables';
END
$$;
