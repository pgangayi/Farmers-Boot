#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var execSync = child_process.execSync;

console.log('🚀 Running Supabase migrations...');

// Get all migration files
var migrationsDir = path.join(process.cwd(), 'migrations', 'supabase');
var migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter(function (file) {
    return file.endsWith('.sql');
  })
  .sort();

if (migrationFiles.length === 0) {
  console.log('⚠️  No migration files found');
  process.exit(0);
}

// Run each migration
for (var i = 0; i < migrationFiles.length; i++) {
  var file = migrationFiles[i];
  var filePath = path.join(migrationsDir, file);
  var sql = fs.readFileSync(filePath, 'utf8');

  console.log('🗄️  Running migration: ' + file);

  try {
    // Execute the SQL
    execSync('psql -h localhost -U postgres -d postgres -f ' + filePath, { stdio: 'inherit' });
    console.log('✅ Migration ' + file + ' completed successfully');
  } catch (error) {
    console.error('❌ Error running migration ' + file + ':', error.message);
    process.exit(1);
  }
}

console.log('🎉 All migrations completed successfully!');
console.log('🔧 Generating TypeScript types...');

// Generate types
execSync('npx supabase gen types typescript --local > supabase.types.ts', { stdio: 'inherit' });

console.log('✅ TypeScript types generated successfully!');
console.log('🎉 Supabase setup completed!');
