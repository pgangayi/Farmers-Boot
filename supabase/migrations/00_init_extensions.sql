-- ============================================================================
-- FARMERS BOOT - INITIAL EXTENSIONS SETUP
-- ============================================================================
-- This is the first migration that sets up required PostgreSQL extensions
-- Must run before any other migrations
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pgvector for AI/ML features (optional, may not be available in all instances)
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable PostGIS for geospatial data (optional)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- SCHEMA VERSION TABLE
-- ============================================================================

-- Create a table to track migration versions
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Record this migration
INSERT INTO public.schema_migrations (version, description)
VALUES ('00_init_extensions', 'Enable required PostgreSQL extensions')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Extensions and schema migrations table created successfully';
END
$$;
