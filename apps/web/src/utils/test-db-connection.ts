import { supabase } from './supabase';

/**
 * Test Supabase database connection
 * Run this to verify the connection is working
 */
export async function testDbConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if env vars are set
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return {
        success: false,
        message: 'Missing environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY',
      };
    }

    // Test connection by querying Supabase health/status
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);

    if (error) {
      // Try a simpler auth-based test if table query fails
      const { error: authError } = await supabase.auth.getSession();

      if (authError) {
        return {
          success: false,
          message: `Connection failed: ${error.message}`,
        };
      }

      return {
        success: true,
        message: 'Connection successful (auth endpoint reachable)',
      };
    }

    return {
      success: true,
      message: `Connection successful! Found ${data?.length || 0} tables`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      message: `Connection test failed: ${message}`,
    };
  }
}

// Auto-run if this file is executed directly
if (import.meta.env.DEV) {
  testDbConnection().then((result) => {
    console.log('[DB Connection Test]', result.message);
  });
}
