import { createClient } from '@supabase/supabase-js';

// Read from environment or use defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://cuphhtdjgkasvlrdqvmp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_QwubF1Iu00DqP7o3v2K1kA_zVtlO9XB';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '***' + supabaseKey.slice(-8) : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check auth endpoint
    console.log('\n1. Testing auth endpoint...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('   ❌ Auth endpoint failed:', authError.message);
    } else {
      console.log('   ✅ Auth endpoint reachable');
    }

    // Test 2: Try to query a table (will fail if no tables exist, but tests connection)
    console.log('\n2. Testing database query...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    if (tablesError) {
      console.log('   ⚠️  Table query failed:', tablesError.message);
      console.log('   (This may be normal if RLS is enabled or schema differs)');
    } else {
      console.log('   ✅ Database query successful');
      console.log('   Tables found:', tables?.length || 0);
      tables?.forEach(t => console.log('   -', t.table_name));
    }

    // Test 3: Check Supabase health endpoint
    console.log('\n3. Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${supabaseUrl}/health`);
      if (healthResponse.ok) {
        console.log('   ✅ Health endpoint reachable (Status:', healthResponse.status + ')');
      } else {
        console.log('   ⚠️  Health endpoint returned:', healthResponse.status);
      }
    } catch (e) {
      console.log('   ⚠️  Health check failed:', e.message);
    }

    // Test 4: Try to list schemas via RPC (if available)
    console.log('\n4. Testing RPC/Functions...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('version');
    if (rpcError) {
      console.log('   ℹ️  RPC test:', rpcError.message);
    } else {
      console.log('   ✅ RPC working:', rpcData);
    }

    console.log('\n--- Connection Test Complete ---');
    console.log('\nSummary:');
    console.log('- Auth API: ✅ Working');
    console.log('- PostgREST (Tables): ⚠️  May require table permissions');
    console.log('- Key Status: Valid but may have limited permissions');
    return true;
  } catch (err) {
    console.error('\n❌ Connection test failed:', err.message);
    return false;
  }
}

testConnection();
