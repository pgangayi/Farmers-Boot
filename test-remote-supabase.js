const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jonguuhhsjfvjhmdgtuh.supabase.co';
const supabaseKey = ''; // It's empty in apps/web/.env - I need to find the anon key if possible

async function test() {
  console.log(`Testing Supabase at ${supabaseUrl}`);
  if (!supabaseKey) {
    console.log('❌ No anon key provided');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('farms').select('*').limit(1);
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Success! Data fetched:', data);
  }
}

test();
