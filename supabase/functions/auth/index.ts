/**
 * ============================================================================
 * AUTH EDGE FUNCTION
 * ============================================================================
 * Handles authentication-related requests
 * ============================================================================
 */

import { supabase } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  errorHandler,
  createSuccessResponse,
  ValidationError,
  AuthenticationError,
} from '../_shared/error-handler.ts';
import { validate, commonRules } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';
import {
  sendPasswordResetEmail,
  sendEmailVerification,
  sendWelcomeEmail,
} from '../_shared/email.ts';
import { createAuditLoggerFromRequest } from '../_shared/audit.ts';

export async function handleAuthRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/auth', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Auth request: ${method} ${path}`);

  try {
    // Route to appropriate handler
    if (path === '/register' && method === 'POST') {
      return await handleRegister(req, requestId);
    } else if (path === '/login' && method === 'POST') {
      return await handleLogin(req, requestId);
    } else if (path === '/logout' && method === 'POST') {
      return await handleLogout(req, requestId);
    } else if (path === '/refresh' && method === 'POST') {
      return await handleRefresh(req, requestId);
    } else if (path === '/reset-password' && method === 'POST') {
      return await handleResetPassword(req, requestId);
    } else if (path === '/forgot-password' && method === 'POST') {
      return await handleForgotPassword(req, requestId);
    } else if (path === '/verify-email' && method === 'POST') {
      return await handleVerifyEmail(req, requestId);
    } else if (path === '/me' && method === 'GET') {
      return await handleGetMe(req, requestId);
    } else if (path === '/me' && method === 'PATCH') {
      return await handleUpdateMe(req, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Auth endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

// Register new user
async function handleRegister(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    commonRules.email,
    commonRules.password,
    { field: 'full_name', required: true, type: 'string', minLength: 2, maxLength: 100 },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { email, password, full_name } = body;

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });

  if (authError) {
    logger.error('Registration failed', authError);
    throw new AuthenticationError(authError.message);
  }

  if (!authData.user) {
    throw new AuthenticationError('Failed to create user');
  }

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name,
    role: 'farmer',
    is_active: true,
  });

  if (profileError) {
    logger.error('Failed to create profile', profileError);
    // Rollback user creation
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new AuthenticationError('Failed to create user profile');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, authData.user.id);
  await auditLogger.logCreate('profiles', authData.user.id, { email, full_name, role: 'farmer' });

  // Send welcome email
  await sendWelcomeEmail(email, full_name);

  logger.info(`User registered: ${authData.user.id}`);

  return createSuccessResponse(
    {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role: 'farmer',
      },
      session: authData.session,
    },
    201
  );
}

// Login user
async function handleLogin(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();

  // Validate input
  const errors = validate(body, [commonRules.email, commonRules.password]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { email, password } = body;

  // Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.error('Login failed', error);
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login
  await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id);

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  logger.info(`User logged in: ${data.user.id}`);

  return createSuccessResponse({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: profile?.full_name,
      role: profile?.role,
      farm_id: profile?.farm_id,
    },
    session: data.session,
  });
}

// Logout user
async function handleLogout(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error('Logout failed', error);
    throw new AuthenticationError('Logout failed');
  }

  logger.info('User logged out');

  return createSuccessResponse({ message: 'Logged out successfully' });
}

// Refresh token
async function handleRefresh(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();

  if (!body.refresh_token) {
    throw new ValidationError('Refresh token is required');
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: body.refresh_token,
  });

  if (error) {
    logger.error('Token refresh failed', error);
    throw new AuthenticationError('Failed to refresh token');
  }

  return createSuccessResponse({
    session: data.session,
  });
}

// Reset password
async function handleResetPassword(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();

  const errors = validate(body, [
    { field: 'token', required: true, type: 'string' },
    { field: 'password', required: true, type: 'string', minLength: 6 },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { token, password } = body;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    logger.error('Password reset failed', error);
    throw new AuthenticationError('Failed to reset password');
  }

  logger.info('Password reset successful');

  return createSuccessResponse({ message: 'Password reset successful' });
}

// Forgot password
async function handleForgotPassword(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();

  const errors = validate(body, [commonRules.email]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { email } = body;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    logger.error('Forgot password failed', error);
    throw new AuthenticationError('Failed to send reset email');
  }

  logger.info(`Password reset email sent: ${email}`);

  return createSuccessResponse({ message: 'Password reset email sent' });
}

// Verify email
async function handleVerifyEmail(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();

  const errors = validate(body, [{ field: 'token', required: true, type: 'string' }]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { token } = body;

  const { error } = await supabase.auth.verifyOtp({
    token,
    type: 'email',
  });

  if (error) {
    logger.error('Email verification failed', error);
    throw new AuthenticationError('Failed to verify email');
  }

  logger.info('Email verified');

  return createSuccessResponse({ message: 'Email verified successfully' });
}

// Get current user
async function handleGetMe(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthenticationError('Invalid token');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new AuthenticationError('Failed to get user profile');
  }

  return createSuccessResponse({
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
      phone: profile?.phone,
      role: profile?.role,
      farm_id: profile?.farm_id,
      is_active: profile?.is_active,
    },
  });
}

// Update current user
async function handleUpdateMe(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthenticationError('Invalid token');
  }

  const body = await req.json();

  // Update profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: body.full_name,
      avatar_url: body.avatar_url,
      phone: body.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (profileError) {
    throw new AuthenticationError('Failed to update profile');
  }

  logger.info(`User profile updated: ${user.id}`);

  return createSuccessResponse({
    user: {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
      phone: profile?.phone,
      role: profile?.role,
      farm_id: profile?.farm_id,
    },
  });
}
