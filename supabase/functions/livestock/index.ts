/**
 * ============================================================================
 * LIVESTOCK EDGE FUNCTION
 * ============================================================================
 * Handles livestock-related requests
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
  AuthorizationError,
  NotFoundError,
} from '../_shared/error-handler.ts';
import { validate, commonRules, validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';
import { createAuditLoggerFromRequest } from '../_shared/audit.ts';
import { notifyTaskChange } from '../_shared/realtime.ts';

export async function handleLivestockRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/livestock', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Livestock request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetLivestock(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateLivestock(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const livestockId = path.substring(1);
      return await handleGetLivestockById(req, livestockId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const livestockId = path.substring(1);
      return await handleUpdateLivestock(req, livestockId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const livestockId = path.substring(1);
      return await handleDeleteLivestock(req, livestockId, requestId);
    } else if (path.match(/^\/[^\/]+\/health$/) && method === 'GET') {
      const livestockId = path.substring(1, path.lastIndexOf('/health'));
      return await handleGetLivestockHealth(req, livestockId, requestId);
    } else if (path.match(/^\/[^\/]+\/health$/) && method === 'POST') {
      const livestockId = path.substring(1, path.lastIndexOf('/health'));
      return await handleAddHealthRecord(req, livestockId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Livestock endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetLivestock(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);
  const farmIds = await getUserFarmIds(authHeader);

  let query = supabase
    .from('livestock')
    .select('*', { count: 'exact' })
    .in('farm_id', farmIds)
    .order('created_at', { ascending: false });

  const farmId = url.searchParams.get('farm_id');
  if (farmId) query = query.eq('farm_id', farmId);

  const type = url.searchParams.get('type');
  if (type) query = query.eq('type', type);

  const status = url.searchParams.get('status');
  if (status) query = query.eq('status', status);

  const { count } = await query;
  const { data: livestock, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch livestock');

  return createPaginatedResponse(livestock || [], page, pageSize, count || 0);
}

async function handleGetLivestockById(
  req: Request,
  livestockId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: livestock, error } = await supabase
    .from('livestock')
    .select(
      `
      *,
      farm:farms(id, name),
      health_records:livestock_health(*, created_by:profiles(full_name))
    `
    )
    .eq('id', livestockId)
    .single();

  if (error || !livestock) throw new NotFoundError('Livestock not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(livestock.farm_id)) {
    throw new AuthorizationError('You do not have access to this livestock');
  }

  return createSuccessResponse(livestock);
}

async function handleCreateLivestock(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'farm_id', required: true, type: 'uuid' },
    {
      field: 'type',
      required: true,
      type: 'string',
      enum: ['cattle', 'goats', 'sheep', 'pigs', 'poultry', 'other'],
    },
    { field: 'breed', required: false, type: 'string', maxLength: 100 },
    { field: 'tag_number', required: false, type: 'string', maxLength: 50 },
    { field: 'name', required: false, type: 'string', maxLength: 100 },
    { field: 'gender', required: false, type: 'string', enum: ['male', 'female', 'unknown'] },
    { field: 'birth_date', required: false, type: 'date' },
    { field: 'weight_kg', required: false, type: 'number', min: 0 },
    { field: 'purchase_date', required: false, type: 'date' },
    { field: 'purchase_price', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(body.farm_id)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: livestock, error } = await supabase
    .from('livestock')
    .insert(body)
    .select()
    .single();

  if (error) throw new Error('Failed to create livestock');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('livestock', livestock.id, livestock);

  await notifyTaskChange(body.farm_id, 'livestock.created', livestock);
  logger.info(`Livestock created: ${livestock.id}`);

  return createSuccessResponse(livestock, 201);
}

async function handleUpdateLivestock(
  req: Request,
  livestockId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentLivestock, error: fetchError } = await supabase
    .from('livestock')
    .select('*')
    .eq('id', livestockId)
    .single();

  if (fetchError || !currentLivestock) throw new NotFoundError('Livestock not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentLivestock.farm_id)) {
    throw new AuthorizationError('You do not have access to this livestock');
  }

  const body = await req.json();
  const errors = validate(body, [
    {
      field: 'type',
      required: false,
      type: 'string',
      enum: ['cattle', 'goats', 'sheep', 'pigs', 'poultry', 'other'],
    },
    { field: 'breed', required: false, type: 'string', maxLength: 100 },
    { field: 'tag_number', required: false, type: 'string', maxLength: 50 },
    { field: 'name', required: false, type: 'string', maxLength: 100 },
    { field: 'gender', required: false, type: 'string', enum: ['male', 'female', 'unknown'] },
    { field: 'birth_date', required: false, type: 'date' },
    { field: 'weight_kg', required: false, type: 'number', min: 0 },
    {
      field: 'status',
      required: false,
      type: 'string',
      enum: ['healthy', 'sick', 'sold', 'deceased', 'pregnant'],
    },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: livestock, error } = await supabase
    .from('livestock')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', livestockId)
    .select()
    .single();

  if (error) throw new Error('Failed to update livestock');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('livestock', livestockId, currentLivestock, livestock);

  await notifyTaskChange(currentLivestock.farm_id, 'livestock.updated', livestock);
  logger.info(`Livestock updated: ${livestockId}`);

  return createSuccessResponse(livestock);
}

async function handleDeleteLivestock(
  req: Request,
  livestockId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentLivestock, error: fetchError } = await supabase
    .from('livestock')
    .select('*')
    .eq('id', livestockId)
    .single();

  if (fetchError || !currentLivestock) throw new NotFoundError('Livestock not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentLivestock.farm_id)) {
    throw new AuthorizationError('You do not have access to this livestock');
  }

  const { error } = await supabase
    .from('livestock')
    .update({ status: 'deceased', updated_at: new Date().toISOString() })
    .eq('id', livestockId);

  if (error) throw new Error('Failed to delete livestock');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('livestock', livestockId, currentLivestock, { status: 'deceased' });

  await notifyTaskChange(currentLivestock.farm_id, 'livestock.deleted', { id: livestockId });
  logger.info(`Livestock deleted: ${livestockId}`);

  return createSuccessResponse({ message: 'Livestock deleted successfully' });
}

async function handleGetLivestockHealth(
  req: Request,
  livestockId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: livestock, error: fetchError } = await supabase
    .from('livestock')
    .select('farm_id')
    .eq('id', livestockId)
    .single();

  if (fetchError || !livestock) throw new NotFoundError('Livestock not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(livestock.farm_id)) {
    throw new AuthorizationError('You do not have access to this livestock');
  }

  const { data: healthRecords, error } = await supabase
    .from('livestock_health')
    .select('*, created_by:profiles(full_name)')
    .eq('livestock_id', livestockId)
    .order('check_date', { ascending: false });

  if (error) throw new Error('Failed to fetch health records');

  return createSuccessResponse(healthRecords || []);
}

async function handleAddHealthRecord(
  req: Request,
  livestockId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: livestock, error: fetchError } = await supabase
    .from('livestock')
    .select('farm_id')
    .eq('id', livestockId)
    .single();

  if (fetchError || !livestock) throw new NotFoundError('Livestock not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(livestock.farm_id)) {
    throw new AuthorizationError('You do not have access to this livestock');
  }

  const body = await req.json();
  const errors = validate(body, [
    { field: 'check_date', required: true, type: 'date' },
    { field: 'health_status', required: true, type: 'string', minLength: 1 },
    { field: 'weight_kg', required: false, type: 'number', min: 0 },
    { field: 'temperature', required: false, type: 'number' },
    { field: 'notes', required: false, type: 'string', maxLength: 1000 },
    { field: 'veterinarian', required: false, type: 'string', maxLength: 100 },
    { field: 'treatment', required: false, type: 'string', maxLength: 500 },
    { field: 'cost', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: healthRecord, error } = await supabase
    .from('livestock_health')
    .insert({
      livestock_id: livestockId,
      created_by: user.id,
      ...body,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to add health record');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('livestock_health', healthRecord.id, healthRecord);

  await notifyTaskChange(livestock.farm_id, 'livestock.health_added', healthRecord);
  logger.info(`Health record added: ${healthRecord.id}`);

  return createSuccessResponse(healthRecord, 201);
}
