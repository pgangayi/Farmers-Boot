/**
 * ============================================================================
 * NOTIFICATIONS EDGE FUNCTION
 * ============================================================================
 * Handles notification-related requests
 * ============================================================================
 */

import { supabase, getUserFromAuth } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  errorHandler,
  createSuccessResponse,
  createPaginatedResponse,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../_shared/error-handler.ts';
import { validate, validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';
import { sendNotification } from '../_shared/realtime.ts';

export async function handleNotificationsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/notifications', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Notifications request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetNotifications(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateNotification(req, requestId);
    } else if (path === '/mark-all-read' && method === 'POST') {
      return await handleMarkAllRead(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const notificationId = path.substring(1);
      return await handleGetNotificationById(req, notificationId, requestId);
    } else if (path.match(/^\/[^\/]+\/read$/) && method === 'POST') {
      const notificationId = path.substring(1, path.lastIndexOf('/read'));
      return await handleMarkAsRead(req, notificationId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const notificationId = path.substring(1);
      return await handleDeleteNotification(req, notificationId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Notifications endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetNotifications(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const unreadOnly = url.searchParams.get('unread_only');
  if (unreadOnly === 'true') {
    query = query.eq('is_read', false);
  }

  const type = url.searchParams.get('type');
  if (type) {
    query = query.eq('type', type);
  }

  const { count } = await query;
  const { data: notifications, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch notifications');

  return createPaginatedResponse(notifications || [], page, pageSize, count || 0);
}

async function handleGetNotificationById(
  req: Request,
  notificationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: notification, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single();

  if (error || !notification) throw new NotFoundError('Notification not found');

  return createSuccessResponse(notification);
}

async function handleCreateNotification(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new AuthenticationError('Only admins can create notifications');
  }

  const body = await req.json();
  const errors = validate(body, [
    { field: 'user_id', required: true, type: 'uuid' },
    {
      field: 'type',
      required: true,
      type: 'string',
      enum: ['info', 'warning', 'error', 'success'],
    },
    { field: 'title', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'message', required: false, type: 'string', maxLength: 1000 },
    { field: 'action_url', required: false, type: 'string', maxLength: 500 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      ...body,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create notification');

  // Send real-time notification
  await sendNotification(body.user_id, notification);

  logger.info(`Notification created: ${notification.id}`);

  return createSuccessResponse(notification, 201);
}

async function handleMarkAsRead(
  req: Request,
  notificationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: notification, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error || !notification) throw new NotFoundError('Notification not found');

  logger.info(`Notification marked as read: ${notificationId}`);

  return createSuccessResponse(notification);
}

async function handleMarkAllRead(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw new Error('Failed to mark notifications as read');

  logger.info(`All notifications marked as read for user: ${user.id}`);

  return createSuccessResponse({ message: 'All notifications marked as read' });
}

async function handleDeleteNotification(
  req: Request,
  notificationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw new Error('Failed to delete notification');

  logger.info(`Notification deleted: ${notificationId}`);

  return createSuccessResponse({ message: 'Notification deleted successfully' });
}
