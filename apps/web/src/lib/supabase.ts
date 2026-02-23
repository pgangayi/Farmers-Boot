/**
 * Supabase API Client
 * Latest Supabase Auth implementation with enhanced features
 */

import { createClient, SupabaseClient, Session, AuthError } from '@supabase/supabase-js';
import type { User as SupabaseUserAuth } from '@supabase/supabase-js';
import type { User as AppUser } from '../api/types';
import { env } from './env-config.ts';

// Supabase environment configuration
const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

// Debug logger that only logs in development
const debugLog = (...args: unknown[]) => {
  if (env.isDevelopment) {
    console.log('[Supabase]', ...args);
  }
};

const debugError = (...args: unknown[]) => {
  if (env.isDevelopment) {
    console.error('[Supabase]', ...args);
  }
};

debugLog('Initializing client with URL:', supabaseUrl);

// Create Supabase client with latest auth configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Latest Supabase Auth options
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Enhanced security options
    flowType: 'implicit', // Use implicit flow for web
    debug: env.isDevelopment,
    // Session storage configuration
    storage: {
      // Use localStorage by default, can be customized
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Silent fail for storage issues
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Silent fail for storage issues
        }
      },
    },
  },
  global: {
    headers: {
      'x-application-name': 'farmers-boot-web',
      'x-client-version': '1.0.0',
    },
  },
  // Enable realtime for live updates
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Extended user type for Supabase auth responses
interface ExtendedSupabaseUser extends SupabaseUserAuth {
  user_metadata: {
    name?: string;
    avatar_url?: string;
    role?: string;
    farm_id?: string;
    phone?: string;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
    role?: string;
  };
}

// Auth state management
export interface AuthState {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

// Enhanced auth helper functions with better error handling
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // Enable email confirmation if required
        captchaToken: undefined, // Add captcha if needed
      },
    });

    if (error) {
      debugError('Sign in error:', error);
      return { data: null, error: { message: error.message, code: error.name } };
    }

    if (!data.user || !data.session) {
      return { data: null, error: { message: 'No user session created', code: 'NO_SESSION' } };
    }

    const user = transformUser(data.user as ExtendedSupabaseUser);
    const token = data.session.access_token;

    debugLog('User signed in successfully:', user.id);
    return { data: { user, token, session: data.session }, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    debugError('Unexpected sign in error:', error);
    return { data: null, error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

export const signUp = async (
  email: string,
  password: string,
  metadata?: { name?: string; phone?: string }
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata?.name,
          phone: metadata?.phone,
          role: 'farmer', // Default role
        },
        // Enable email confirmation
        emailRedirectTo: `${env.appUrl}/auth/callback`,
      },
    });

    if (error) {
      debugError('Sign up error:', error);
      return { data: null, error: { message: error.message, code: error.name } };
    }

    // Handle email confirmation case
    if (data.user && !data.session) {
      debugLog('User registered, email confirmation required');
      return {
        data: {
          user: transformUser(data.user as ExtendedSupabaseUser),
          requiresConfirmation: true,
        },
        error: null,
      };
    }

    if (!data.user) {
      return { data: null, error: { message: 'Failed to create user', code: 'NO_USER' } };
    }

    const user = transformUser(data.user as ExtendedSupabaseUser);
    const token = data.session?.access_token;

    debugLog('User signed up successfully:', user.id);
    return { data: { user, token, session: data.session }, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Signup failed';
    debugError('Unexpected sign up error:', error);
    return { data: null, error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut({
      scope: 'global', // Sign out from all sessions
    });

    if (error) {
      debugError('Sign out error:', error);
      return { error: { message: error.message, code: error.name } };
    }

    debugLog('User signed out successfully');
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    debugError('Unexpected sign out error:', error);
    return { error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      debugError('Get session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    debugError('Unexpected get session error:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<AppUser | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      debugError('Get user error:', error);
      return null;
    }

    if (!data.user) {
      return null;
    }

    return transformUser(data.user as ExtendedSupabaseUser);
  } catch (error) {
    debugError('Unexpected get user error:', error);
    return null;
  }
};

export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      debugError('Refresh session error:', error);
      return { error: { message: error.message, code: error.name } };
    }

    if (!data.session) {
      return { error: { message: 'No session refreshed', code: 'NO_SESSION' } };
    }

    debugLog('Session refreshed successfully');
    return { data: { session: data.session }, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Session refresh failed';
    debugError('Unexpected refresh session error:', error);
    return { data: null, error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.appUrl}/reset-password`,
    });

    if (error) {
      debugError('Reset password error:', error);
      return { error: { message: error.message, code: error.name } };
    }

    debugLog('Password reset email sent:', email);
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
    debugError('Unexpected reset password error:', error);
    return { error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      debugError('Update password error:', error);
      return { error: { message: error.message, code: error.name } };
    }

    debugLog('Password updated successfully');
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Password update failed';
    debugError('Unexpected update password error:', error);
    return { error: { message: errorMessage, code: 'UPDATE_PASSWORD_FAILED' } };
  }
};

// New: Update user metadata
export const updateUserMetadata = async (metadata: Record<string, unknown>) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) {
      debugError('Update metadata error:', error);
      return { data: null, error: { message: error.message, code: error.name } };
    }

    if (!data.user) {
      return { data: null, error: { message: 'No user found', code: 'NO_USER' } };
    }

    const user = transformUser(data.user as ExtendedSupabaseUser);
    debugLog('User metadata updated successfully');
    return { data: { user }, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Metadata update failed';
    debugError('Unexpected update metadata error:', error);
    return { data: null, error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

// New: Sign in with OAuth providers
export const signInWithOAuth = async (provider: 'google' | 'github' | 'azure') => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${env.appUrl}/auth/callback`,
      },
    });

    if (error) {
      debugError('OAuth sign in error:', error);
      return { data: null, error: { message: error.message, code: error.name } };
    }

    debugLog('OAuth sign in initiated for provider:', provider);
    return { data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'OAuth sign in failed';
    debugError('Unexpected OAuth sign in error:', error);
    return { data: null, error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

// New: Sign in with magic link
export const signInWithMagicLink = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${env.appUrl}/auth/callback`,
      },
    });

    if (error) {
      debugError('Magic link sign in error:', error);
      return { error: { message: error.message, code: error.name } };
    }

    debugLog('Magic link sent to:', email);
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Magic link sign in failed';
    debugError('Unexpected magic link sign in error:', error);
    return { error: { message: errorMessage, code: 'UNKNOWN_ERROR' } };
  }
};

// Valid user roles matching the User type
type UserRole = 'admin' | 'user' | 'farmer' | 'worker';

// Enhanced user transformation with better metadata handling
function transformUser(supabaseUser: ExtendedSupabaseUser): AppUser {
  const metadata = supabaseUser.user_metadata || {};
  const appMetadata = supabaseUser.app_metadata || {};

  // Validate and default the role
  const rawRole = metadata.role || appMetadata.role || 'farmer';
  const role: UserRole = ['admin', 'user', 'farmer', 'worker'].includes(rawRole)
    ? (rawRole as UserRole)
    : 'farmer';

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: metadata.name || supabaseUser.email?.split('@')[0] || 'User',
    role,
    avatar_url: metadata.avatar_url,
    phone: metadata.phone,
    farm_id: metadata.farm_id,
    created_at: supabaseUser.created_at || new Date().toISOString(),
    updated_at: supabaseUser.updated_at || new Date().toISOString(),
    // Additional fields for enhanced user profile
    email_confirmed_at: supabaseUser.email_confirmed_at,
    phone_confirmed_at: supabaseUser.phone_confirmed_at,
    last_sign_in_at: supabaseUser.last_sign_in_at,
    provider: appMetadata.provider,
  };
}

// Auth state listener setup
export const onAuthStateChange = (callback: (authState: AuthState) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    debugLog('Auth state changed:', event);

    const user = session?.user ? transformUser(session.user as ExtendedSupabaseUser) : null;

    callback({
      user,
      session,
      loading: false,
      error: null,
    });
  });
};

// Data access helpers for Supabase tables (unchanged but with better error handling)
export const supabaseApi = {
  async get<T>(
    table: string,
    options?: {
      columns?: string;
      eq?: Record<string, unknown>;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    let query = supabase.from(table).select(options?.columns || '*');

    if (options?.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        query = query.eq(key, value);
      }
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection === 'asc',
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      debugError(`get error on ${table}:`, error);
      throw new Error(error.message);
    }

    return data as T[];
  },

  async getById<T>(table: string, id: string, columns?: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select(columns || '*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      debugError(`getById error on ${table}:`, error);
      throw new Error(error.message);
    }

    return data as T;
  },

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase.from(table).insert(data).select().single();

    if (error) {
      debugError(`create error on ${table}:`, error);
      throw new Error(error.message);
    }

    return result as T;
  },

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      debugError(`update error on ${table}:`, error);
      throw new Error(error.message);
    }

    return result as T;
  },

  async delete(table: string, id: string): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      debugError(`delete error on ${table}:`, error);
      throw new Error(error.message);
    }
  },

  async count(table: string, filters?: Record<string, unknown>): Promise<number> {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { count, error } = await query;

    if (error) {
      debugError(`count error on ${table}:`, error);
      throw new Error(error.message);
    }

    return count || 0;
  },
};

// Re-export supabase client for direct access
export { supabase as supabaseClient };
