/**
 * ============================================================================
 * WEBHOOKS EDGE FUNCTION
 * ============================================================================
 * Handles webhook-related requests
 * ============================================================================
 */

import { supabase, getUserFromAuth, getUserFarmIds } from '../_shared/supabase-client.ts';
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
import { createAuditLoggerFromRequest } from '../_shared/audit.ts';

export async function handleWebhooksRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/webhooks', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Webhooks request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetWebhooks(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateWebhook(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const webhookId = path.substring(1);
      return await handleGetWebhookById(req, webhookId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const webhookId = path.substring(1);
      return await handleUpdateWebhook(req, webhookId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const webhookId = path.substring(1);
      return await handleDeleteWebhook(req, webhookId, requestId);
    } else if (path.match(/^\/[^\/]+\/test$/) && method === 'POST') {
      const webhookId = path.substring(1, path.lastIndexOf('/test'));
      return await handleTestWebhook(req, webhookId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Webhooks endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetWebhooks(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  let query = supabase
    .from('webhooks')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const activeOnly = url.searchParams.get('active_only');
  if (activeOnly === 'true') {
    query = query.eq('active', true);
  }

  const { count } = await query;
  const { data: webhooks, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch webhooks');

  return createPaginatedResponse(webhooks || [], page, pageSize, count || 0);
}

async function handleGetWebhookById(
  req: Request,
  webhookId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', user.id)
    .single();

  if (error || !webhook) throw new NotFoundError('Webhook not found');

  return createSuccessResponse(webhook);
}

async function handleCreateWebhook(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'url', required: true, type: 'string', pattern: /^https?:\/\/.+/ },
    { field: 'events', required: true, type: 'array' },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Validate events
  const validEvents = [
    'task.created',
    'task.updated',
    'task.completed',
    'task.deleted',
    'farm.created',
    'farm.updated',
    'farm.deleted',
    'field.created',
    'field.updated',
    'field.deleted',
    'crop_plan.created',
    'crop_plan.updated',
    'crop_plan.harvested',
    'livestock.created',
    'livestock.updated',
    'livestock.deleted',
    'inventory.low_stock',
    'inventory.transaction_added',
    'equipment.maintenance_due',
  ];

  for (const event of body.events) {
    if (!validEvents.includes(event)) {
      throw new ValidationError(`Invalid event: ${event}`);
    }
  }

  // Generate secret
  const secret = crypto.randomUUID();

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .insert({
      user_id: user.id,
      url: body.url,
      events: body.events,
      description: body.description,
      secret,
      active: true,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create webhook');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('webhooks', webhook.id, webhook);

  logger.info(`Webhook created: ${webhook.id}`);

  return createSuccessResponse(webhook, 201);
}

async function handleUpdateWebhook(
  req: Request,
  webhookId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentWebhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !currentWebhook) throw new NotFoundError('Webhook not found');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'url', required: false, type: 'string', pattern: /^https?:\/\/.+/ },
    { field: 'events', required: false, type: 'array' },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'active', required: false, type: 'boolean' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Validate events if provided
  if (body.events) {
    const validEvents = [
      'task.created',
      'task.updated',
      'task.completed',
      'task.deleted',
      'farm.created',
      'farm.updated',
      'farm.deleted',
      'field.created',
      'field.updated',
      'field.deleted',
      'crop_plan.created',
      'crop_plan.updated',
      'crop_plan.harvested',
      'livestock.created',
      'livestock.updated',
      'livestock.deleted',
      'inventory.low_stock',
      'inventory.transaction_added',
      'equipment.maintenance_due',
    ];

    for (const event of body.events) {
      if (!validEvents.includes(event)) {
        throw new ValidationError(`Invalid event: ${event}`);
      }
    }
  }

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', webhookId)
    .select()
    .single();

  if (error) throw new Error('Failed to update webhook');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('webhooks', webhookId, currentWebhook, webhook);

  logger.info(`Webhook updated: ${webhookId}`);

  return createSuccessResponse(webhook);
}

async function handleDeleteWebhook(
  req: Request,
  webhookId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentWebhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !currentWebhook) throw new NotFoundError('Webhook not found');

  const { error } = await supabase.from('webhooks').delete().eq('id', webhookId);

  if (error) throw new Error('Failed to delete webhook');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('webhooks', webhookId, currentWebhook);

  logger.info(`Webhook deleted: ${webhookId}`);

  return createSuccessResponse({ message: 'Webhook deleted successfully' });
}

async function handleTestWebhook(
  req: Request,
  webhookId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !webhook) throw new NotFoundError('Webhook not found');

  // Send test payload
  const testPayload = {
    event: 'test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook payload',
    },
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
        'X-Webhook-Event': 'test',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned status ${response.status}`);
    }

    logger.info(`Webhook test successful: ${webhookId}`);

    return createSuccessResponse({
      success: true,
      message: 'Webhook test successful',
      status: response.status,
    });
  } catch (error) {
    logger.error(`Webhook test failed: ${webhookId}`, error);
    throw new Error('Webhook test failed: ' + (error as Error).message);
  }
}
