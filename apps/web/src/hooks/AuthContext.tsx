/**
 * ============================================================================
 * AUTH CONTEXT
 * ============================================================================
 * Consolidated authentication context for Farmers Boot
 * Provides Supabase authentication with OAuth support
 * ============================================================================
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { requiredEnv } from '../utils/env';
import type { User } from '../api/types';
import type { Session, AuthError } from '@supabase/supabase-js';
import { authStorage } from '../lib/authStorage';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthContextType extends AuthState {
  // Authentication actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { name?: string; phone?: string }
  ) => Promise<{
    success: boolean;
    requiresConfirmation?: boolean;
    error?: string;
  }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // OAuth authentication
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithGitHub: () => Promise<{ success: boolean; error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;

  // User management
  updateUserMetadata: (
    metadata: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<{ success: boolean; error?: string }>;

  // Legacy compatibility
  isAuthenticated: () => boolean;
  getAuthHeaders: () => HeadersInit;

  // Computed states
  isAdmin: boolean;
  isEmailConfirmed: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformUser(supabaseUser: any): User {
  const metadata = supabaseUser.user_metadata || {};
  const appMetadata = supabaseUser.app_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: metadata.name || supabaseUser.email?.split('@')[0] || 'User',
    role: metadata.role || appMetadata.role || 'farmer',
    avatar_url: metadata.avatar_url,
    phone: metadata.phone,
    farm_id: metadata.farm_id,
    created_at: supabaseUser.created_at || new Date().toISOString(),
    updated_at: supabaseUser.updated_at || new Date().toISOString(),
    email_confirmed_at: supabaseUser.email_confirmed_at,
    phone_confirmed_at: supabaseUser.phone_confirmed_at,
    last_sign_in_at: supabaseUser.last_sign_in_at,
    provider: appMetadata.provider,
  };
}

function getRedirectUrl(): string {
  // `VITE_APP_URL` must be defined in .env to avoid surprises during OAuth flows.
  return requiredEnv('VITE_APP_URL');
}

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Initialize auth state and set up listener
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          if (mounted) {
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error,
            });
          }
          return;
        }

        const user = session?.user ? transformUser(session.user) : null;

        if (mounted) {
          setAuthState({
            user,
            session,
            loading: false,
            error: null,
          });

          if (user) {
            authStorage.setUser(user);
            if (session) {
              authStorage.setToken(session.access_token);
            }
          }
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error as AuthError,
          });
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const user = session?.user ? transformUser(session.user) : null;

      setAuthState({
        user,
        session,
        loading: false,
        error: null,
      });

      if (user) {
        authStorage.setUser(user);
        if (session) {
          authStorage.setToken(session.access_token);
        }
      } else {
        authStorage.clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Authentication actions
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, metadata?: { name?: string; phone?: string }) => {
      try {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: metadata?.name,
              phone: metadata?.phone,
              role: 'farmer',
            },
            emailRedirectTo: `${getRedirectUrl()}/auth/callback`,
          },
        });

        if (result.error) {
          return { success: false, error: result.error.message };
        }

        // Handle email confirmation case
        if (result.data.user && !result.data.session) {
          return { success: true, requiresConfirmation: true };
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed';
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      authStorage.clear();

      const { error } = await supabase.auth.signOut({
        scope: 'global',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getRedirectUrl()}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // OAuth authentication
  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getRedirectUrl()}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithGitHub = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${getRedirectUrl()}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GitHub sign in failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getRedirectUrl()}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Magic link sign in failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // User management
  const updateUserMetadata = useCallback(async (metadata: Record<string, unknown>) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Metadata update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session refresh failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Legacy compatibility methods
  const isAuthenticated = useCallback(
    () => !!authState.user && !!authState.session,
    [authState.user, authState.session]
  );

  const getAuthHeaders = useCallback(() => {
    const token = authStorage.getToken();
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }, []);

  // Computed states
  const computedStates = useMemo(
    () => ({
      isAdmin: authState.user?.role === 'admin',
      isEmailConfirmed: !!authState.user?.email_confirmed_at,
    }),
    [authState.user]
  );

  const contextValue: AuthContextType = {
    ...authState,
    // Authentication actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    // OAuth authentication
    signInWithGoogle,
    signInWithGitHub,
    signInWithMagicLink,
    // User management
    updateUserMetadata,
    refreshSession,
    // Legacy compatibility
    isAuthenticated,
    getAuthHeaders,
    // Computed states
    ...computedStates,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: 'admin' | 'farmer' | 'worker' | 'viewer';
  requireEmailConfirmation?: boolean;
}

export function ProtectedRoute({
  children,
  fallback = <div>Loading...</div>,
  requiredRole,
  requireEmailConfirmation = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, isEmailConfirmed } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <>{fallback}</>;
  }

  if (requireEmailConfirmation && !isEmailConfirmed) {
    return <div>Please confirm your email address</div>;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <div>Access denied. Insufficient permissions.</div>;
  }

  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Default export
export default AuthContext;
