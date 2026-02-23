#!/usr/bin/env node

var child_process = require('child_process');
var execSync = child_process.execSync;
var fs = require('fs');
var path = require('path');

console.log('🚀 Initializing Supabase database migration...');

// Check if Supabase CLI is installed
if (!fs.existsSync(path.join(process.cwd(), 'node_modules', '.bin', 'supabase'))) {
  console.log('❌ Supabase CLI not found. Please install it first:');
  console.log('npm install -g supabase');
  process.exit(1);
}

// Initialize Supabase project if not already initialized
if (!fs.existsSync('supabase/.supabase')) {
  console.log('📦 Initializing Supabase project...');
  execSync('npx supabase init', { stdio: 'inherit' });
}

// Copy the schema file to the migrations directory
var schemaPath = path.join(process.cwd(), 'migrations', 'supabase', '001_initial_schema.sql');
var migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');

if (!fs.existsSync(migrationsPath)) {
  fs.mkdirSync(migrationsPath, { recursive: true });
}

var targetPath = path.join(migrationsPath, '001_initial_schema.sql');
fs.copyFileSync(schemaPath, targetPath);

console.log('📝 Schema file copied to migrations directory');

// Run the migration
console.log('🗄️  Running database migration...');
execSync('npx supabase db push', { stdio: 'inherit' });

console.log('✅ Database migration completed successfully!');

// Generate types
console.log('🔧 Generating TypeScript types...');
execSync('npx supabase gen types typescript --local > supabase.types.ts', { stdio: 'inherit' });

console.log('✅ TypeScript types generated successfully!');
console.log('🎉 Supabase setup completed!');
