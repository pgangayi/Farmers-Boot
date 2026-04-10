import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Handle both Unix and Windows line endings
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
    console.log('   📁 Loaded .env.local');
  } catch (e) {
    console.log('   ⚠️  Could not load .env.local:', e.message);
  }
}

loadEnvFile(envPath);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cuphhtdjgkasvlrdqvmp.supabase.co';
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_QwubF1Iu00DqP7o3v2K1kA_zVtlO9XB';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('═══════════════════════════════════════════════════════');
console.log('  SUPABASE CONNECTION TEST');
console.log('═══════════════════════════════════════════════════════');
console.log('URL:', supabaseUrl);
console.log('Publishable Key:', publishableKey ? '***' + publishableKey.slice(-8) : 'NOT SET');
console.log('Service Role Key:', serviceRoleKey ? '***' + serviceRoleKey.slice(-8) : 'NOT SET');
console.log('');

// Test 1: Auth with publishable key
console.log('1️⃣  AUTH TEST (Publishable Key)');
console.log('─────────────────────────────────');
const publicClient = createClient(supabaseUrl, publishableKey);

try {
  const { data: authData, error: authError } = await publicClient.auth.getSession();
  if (authError) {
    console.log('   ❌ Auth failed:', authError.message);
  } else {
    console.log('   ✅ Auth endpoint working');
    console.log('   Session:', authData.session ? 'Active' : 'No active session');
  }
} catch (e) {
  console.log('   ❌ Auth error:', e.message);
}

console.log('');

// Test 2: DB with service role key (if available)
console.log('2️⃣  DATABASE TEST (Service Role Key)');
console.log('─────────────────────────────────────');

if (!serviceRoleKey) {
  console.log('   ⚠️  No service role key - skipping DB tests');
  console.log('   Set SUPABASE_SERVICE_ROLE_KEY in .env.local');
} else {
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let tablesFound = 0;

  // Try to query common tables
  console.log('   Testing common tables...');
  const commonTables = ['users', 'profiles', 'farms', 'livestock', 'crops', 'inventory', 'tasks', 'events'];

  for (const table of commonTables) {
    try {
      const { data, error, count } = await adminClient
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        tablesFound++;
        console.log(`   ✅ ${table}: ${count ?? '?'} rows`);
      }
    } catch (e) {
      // Table doesn't exist - skip
    }
  }

  if (tablesFound === 0) {
    console.log('   ⚠️  No tables found. Database may be empty or tables have different names.');
  } else {
    console.log(`   ✅ Found ${tablesFound} tables`);
  }

  // Test raw query via RPC if available
  console.log('');
  console.log('3️⃣  RPC/FUNCTIONS TEST');
  console.log('──────────────────────');
  try {
    const { data, error } = await adminClient.rpc('version');
    if (!error) {
      console.log('   ✅ RPC working, version:', data);
    } else {
      console.log('   ℹ️  RPC version() not available:', error.message);
    }
  } catch (e) {
    console.log('   ℹ️  RPC test skipped');
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  TEST COMPLETE');
console.log('═══════════════════════════════════════════════════════');
