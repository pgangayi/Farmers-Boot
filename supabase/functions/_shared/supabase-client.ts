/**
 * ============================================================================
 * SUPABASE CLIENT
 * ============================================================================
 * Provides Supabase client for Edge Functions
 * ============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Service role client (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client with user context (respects RLS)
export function createClientWithAuth(authHeader: string) {
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Get user from auth header
export async function getUserFromAuth(authHeader: string) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

// Verify user has required role
export async function verifyUserRole(
  authHeader: string,
  requiredRoles: string[]
): Promise<{ user: any; profile: any } | null> {
  const user = await getUserFromAuth(authHeader);
  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  if (!requiredRoles.includes(profile.role)) {
    return null;
  }

  return { user, profile };
}

// Check if user is admin
export async function isAdmin(authHeader: string): Promise<boolean> {
  const result = await verifyUserRole(authHeader, ['admin']);
  return result !== null;
}

// Get user's farm access
export async function getUserFarmIds(authHeader: string): Promise<string[]> {
  const user = await getUserFromAuth(authHeader);
  if (!user) {
    return [];
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('farm_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return [];
  }

  // If user has a farm_id, return it
  if (profile.farm_id) {
    return [profile.farm_id];
  }

  // If user is admin, return all farms
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role === 'admin') {
    const { data: farms } = await supabase.from('farms').select('id').eq('is_active', true);

    return farms?.map((f: any) => f.id) || [];
  }

  return [];
}
