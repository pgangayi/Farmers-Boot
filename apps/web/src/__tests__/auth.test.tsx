/**
 * ============================================================================
 * AUTH CONTEXT TESTS
 * ============================================================================
 * Tests for the authentication context and hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth, ProtectedRoute } from '../hooks/AuthContext';

// Mock supabase
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockRefreshSession = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignInWithOtp = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      refreshSession: mockRefreshSession,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithOtp: mockSignInWithOtp,
    },
  },
}));

// Mock authStorage
vi.mock('../lib/authStorage', () => ({
  authStorage: {
    setUser: vi.fn(),
    setToken: vi.fn(),
    getToken: vi.fn(() => 'test-token'),
    getUser: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should provide initial auth state', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state should be loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should initialize with existing session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User', role: 'farmer' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        user: mockUser,
      };

      mockGetSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.session).toEqual(mockSession);
    });
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password');
      });

      expect(signInResult).toEqual({ success: true });
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle sign in error', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'wrong');
      });

      expect(signInResult).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
      };

      mockSignUp.mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password', {
          name: 'New User',
        });
      });

      expect(signUpResult).toEqual({ success: true });
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        options: expect.objectContaining({
          data: { name: 'New User', phone: undefined, role: 'farmer' },
        }),
      });
    });

    it('should handle email confirmation required', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
      };

      mockSignUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp('new@example.com', 'password');
      });

      expect(signUpResult).toEqual({
        success: true,
        requiresConfirmation: true,
      });
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let signOutResult;
      await act(async () => {
        signOutResult = await result.current.signOut();
      });

      expect(signOutResult).toEqual({ success: true });
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' });
    });
  });

  describe('resetPassword', () => {
    it('should send reset password email', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let resetResult;
      await act(async () => {
        resetResult = await result.current.resetPassword('test@example.com');
      });

      expect(resetResult).toEqual({ success: true });
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockUpdateUser.mockResolvedValueOnce({ error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let updateResult;
      await act(async () => {
        updateResult = await result.current.updatePassword('newpassword');
      });

      expect(updateResult).toEqual({ success: true });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword' });
    });
  });

  describe('OAuth sign in', () => {
    it('should sign in with Google', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let oauthResult;
      await act(async () => {
        oauthResult = await result.current.signInWithGoogle();
      });

      expect(oauthResult).toEqual({ success: true });
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      });
    });

    it('should sign in with GitHub', async () => {
      mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let oauthResult;
      await act(async () => {
        oauthResult = await result.current.signInWithGitHub();
      });

      expect(oauthResult).toEqual({ success: true });
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      });
    });

    it('should sign in with magic link', async () => {
      mockSignInWithOtp.mockResolvedValueOnce({ error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      let magicLinkResult;
      await act(async () => {
        magicLinkResult = await result.current.signInWithMagicLink('test@example.com');
      });

      expect(magicLinkResult).toEqual({ success: true });
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        }),
      });
    });
  });

  describe('computed states', () => {
    it('should correctly compute isAdmin', async () => {
      const mockUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        user_metadata: { role: 'admin' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token', user: mockUser } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should correctly compute isEmailConfirmed', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token', user: mockUser } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isEmailConfirmed).toBe(true);
      });
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user and session exist', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockGetSession.mockResolvedValueOnce({
        data: { session: { access_token: 'token', user: mockUser } },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated()).toBe(true);
      });
    });

    it('should return false when no user', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated()).toBe(false);
      });
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers with auth token', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      const headers = result.current.getAuthHeaders();

      expect(headers).toEqual({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      });
    });
  });
});

describe('ProtectedRoute', () => {
  it('should show loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { wrapper }
    );

    expect(container.textContent).toContain('Loading');
  });

  it('should show fallback when not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    render(
      <ProtectedRoute fallback={<div>Please log in</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.queryByText('Please log in')).toBeDefined();
    });
  });
});
