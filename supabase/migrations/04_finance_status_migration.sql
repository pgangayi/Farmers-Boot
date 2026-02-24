-- ============================================================================
-- FARMERS BOOT - DATA MIGRATION: FINANCE STATUS
-- ============================================================================
-- This migration updates existing financial records with 'draft' status
-- to 'pending' status to match the updated type definitions.
-- Version: 04_finance_status_migration
-- ============================================================================

-- Record this migration
INSERT INTO public.schema_migrations (version, description)
VALUES ('04_finance_status_migration', 'Migrate draft finance records to pending')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- FINANCIAL RECORDS STATUS MIGRATION
-- ============================================================================

-- Update any existing 'draft' status records to 'pending'
-- Note: This assumes a status column exists or will be added to financial_records
-- If the column doesn't exist yet, this will be a no-op

-- First, check if the status column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'financial_records' 
        AND column_name = 'status'
    ) THEN
        -- Add status column with default 'pending'
        ALTER TABLE public.financial_records 
        ADD COLUMN status text DEFAULT 'pending' 
        CHECK (status IN ('pending', 'completed', 'cancelled'));
        
        RAISE NOTICE 'Added status column to financial_records table';
    END IF;
END $$;

-- Update any 'draft' status records to 'pending'
UPDATE public.financial_records 
SET status = 'pending' 
WHERE status = 'draft';

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Finance status migration completed successfully';
END
$$;