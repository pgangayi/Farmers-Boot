#!/usr/bin/env node
/**
 * ============================================================================
 * DATABASE MIGRATION RUNNER
 * ============================================================================
 * This script manages database migrations for Farmers-Boot.
 * It supports running migrations up, down, and checking status.
 *
 * Usage:
 *   node scripts/run-migrations.mjs up       - Run all pending migrations
 *   node scripts/run-migrations.mjs down     - Rollback last migration
 *   node scripts/run-migrations.mjs status   - Show migration status
 *   node scripts/run-migrations.mjs create   - Create a new migration file
 *
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   SUPABASE_URL - Supabase project URL (alternative to DATABASE_URL)
 * ============================================================================
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

// Get database connection
function getPool() {
  let connectionString;

  if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
  } else if (process.env.SUPABASE_URL) {
    // Convert Supabase URL to direct database URL
    const supabaseUrl = new URL(process.env.SUPABASE_URL);
    connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD || 'postgres'}@db.${supabaseUrl.hostname.replace('https://', '')}.supabase.co:5432/postgres`;
  } else {
    // Default local development
    connectionString = 'postgresql://postgres:postgres@localhost:54322/postgres';
  }

  return new Pool({ connectionString });
}

// Ensure migrations table exists
async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      description TEXT,
      checksum TEXT
    )
  `);
}

// Get list of migration files
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

// Get applied migrations
async function getAppliedMigrations(pool) {
  const result = await pool.query(`SELECT version FROM ${MIGRATIONS_TABLE} ORDER BY version`);
  return result.rows.map((r) => r.version);
}

// Calculate checksum of file
function getChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

// Run a single migration
async function runMigration(pool, filePath) {
  const filename = path.basename(filePath);
  const version = filename.replace('.sql', '');
  const sql = fs.readFileSync(filePath, 'utf8');
  const checksum = getChecksum(filePath);

  console.log(`Running migration: ${filename}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Run the migration SQL
    await client.query(sql);

    // Record the migration (if not already recorded by the migration itself)
    await client.query(
      `
      INSERT INTO ${MIGRATIONS_TABLE} (version, description, checksum)
      VALUES ($1, $2, $3)
      ON CONFLICT (version) DO UPDATE SET checksum = $3
    `,
      [version, `Migration ${version}`, checksum]
    );

    await client.query('COMMIT');
    console.log(`✓ Migration ${filename} completed successfully`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Migration ${filename} failed:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run all pending migrations
async function migrateUp() {
  const pool = getPool();

  try {
    await ensureMigrationsTable(pool);

    const files = getMigrationFiles();
    const applied = await getAppliedMigrations(pool);

    const pending = files.filter((f) => {
      const version = f.replace('.sql', '');
      return !applied.includes(version);
    });

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s)`);

    for (const file of pending) {
      await runMigration(pool, path.join(MIGRATIONS_DIR, file));
    }

    console.log('\n✓ All migrations completed successfully');
  } finally {
    await pool.end();
  }
}

// Rollback last migration
async function migrateDown() {
  const pool = getPool();

  try {
    await ensureMigrationsTable(pool);

    const applied = await getAppliedMigrations(pool);

    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastVersion = applied[applied.length - 1];
    console.log(`Rolling back migration: ${lastVersion}`);

    // Note: This requires each migration to have a corresponding down migration
    // For now, we just remove the record
    await pool.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`, [lastVersion]);

    console.log(`✓ Migration ${lastVersion} rolled back (record removed)`);
    console.log('Note: You may need to manually revert schema changes');
  } finally {
    await pool.end();
  }
}

// Show migration status
async function migrateStatus() {
  const pool = getPool();

  try {
    await ensureMigrationsTable(pool);

    const files = getMigrationFiles();
    const applied = await getAppliedMigrations(pool);

    console.log('\nMigration Status:');
    console.log('================\n');

    for (const file of files) {
      const version = file.replace('.sql', '');
      const isApplied = applied.includes(version);
      const status = isApplied ? '✓ Applied' : '○ Pending';
      console.log(`${status}  ${file}`);
    }

    console.log(
      `\nTotal: ${files.length} migrations, ${applied.length} applied, ${files.length - applied.length} pending`
    );
  } finally {
    await pool.end();
  }
}

// Create a new migration file
async function createMigration(name) {
  if (!name) {
    console.error('Please provide a migration name');
    console.log('Usage: node scripts/run-migrations.mjs create <name>');
    process.exit(1);
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
  const version = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}`;
  const filename = `${version}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- ============================================================================
-- ${name.toUpperCase()}
-- ============================================================================
-- Description: [Add description here]
-- Version: ${version}
-- ============================================================================

-- Record this migration
INSERT INTO public.schema_migrations (version, description)
VALUES ('${version}', '${name}')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- MIGRATION CONTENT
-- ============================================================================

-- Add your migration SQL here

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration ${version} completed successfully';
END
$$;
`;

  fs.writeFileSync(filePath, template);
  console.log(`Created migration: ${filename}`);
}

// Main CLI
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  console.log('Farmers-Boot Migration Runner\n');

  try {
    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'status':
        await migrateStatus();
        break;
      case 'create':
        await createMigration(arg);
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/run-migrations.mjs up       - Run all pending migrations');
        console.log('  node scripts/run-migrations.mjs down     - Rollback last migration');
        console.log('  node scripts/run-migrations.mjs status   - Show migration status');
        console.log('  node scripts/run-migrations.mjs create <name> - Create a new migration');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
