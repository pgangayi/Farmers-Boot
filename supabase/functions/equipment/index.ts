/**
 * ============================================================================
 * EQUIPMENT EDGE FUNCTION
 * ============================================================================
 * Handles equipment-related requests
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

export async function handleEquipmentRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/equipment', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Equipment request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetEquipment(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateEquipment(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const equipmentId = path.substring(1);
      return await handleGetEquipmentById(req, equipmentId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const equipmentId = path.substring(1);
      return await handleUpdateEquipment(req, equipmentId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const equipmentId = path.substring(1);
      return await handleDeleteEquipment(req, equipmentId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Equipment endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetEquipment(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);
  const farmIds = await getUserFarmIds(authHeader);

  let query = supabase
    .from('equipment')
    .select('*', { count: 'exact' })
    .in('farm_id', farmIds)
    .order('name', { ascending: true });

  const farmId = url.searchParams.get('farm_id');
  if (farmId) query = query.eq('farm_id', farmId);

  const type = url.searchParams.get('type');
  if (type) query = query.eq('type', type);

  const status = url.searchParams.get('status');
  if (status) query = query.eq('status', status);

  const needsMaintenance = url.searchParams.get('needs_maintenance');
  if (needsMaintenance === 'true') {
    query = query.lte('next_maintenance_date', new Date().toISOString());
  }

  const { count } = await query;
  const { data: equipment, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch equipment');

  return createPaginatedResponse(equipment || [], page, pageSize, count || 0);
}

async function handleGetEquipmentById(
  req: Request,
  equipmentId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*, farm:farms(id, name)')
    .eq('id', equipmentId)
    .single();

  if (error || !equipment) throw new NotFoundError('Equipment not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(equipment.farm_id)) {
    throw new AuthorizationError('You do not have access to this equipment');
  }

  return createSuccessResponse(equipment);
}

async function handleCreateEquipment(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'farm_id', required: true, type: 'uuid' },
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 200 },
    {
      field: 'type',
      required: true,
      type: 'string',
      enum: ['tractor', 'plow', 'harvester', 'irrigation', 'sprayer', 'trailer', 'other'],
    },
    { field: 'brand', required: false, type: 'string', maxLength: 100 },
    { field: 'model', required: false, type: 'string', maxLength: 100 },
    { field: 'serial_number', required: false, type: 'string', maxLength: 100 },
    { field: 'purchase_date', required: false, type: 'date' },
    { field: 'purchase_price', required: false, type: 'number', min: 0 },
    { field: 'last_maintenance_date', required: false, type: 'date' },
    { field: 'next_maintenance_date', required: false, type: 'date' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(body.farm_id)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: equipment, error } = await supabase
    .from('equipment')
    .insert({
      ...body,
      status: 'operational',
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create equipment');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('equipment', equipment.id, equipment);

  await notifyTaskChange(body.farm_id, 'equipment.created', equipment);
  logger.info(`Equipment created: ${equipment.id}`);

  return createSuccessResponse(equipment, 201);
}

async function handleUpdateEquipment(
  req: Request,
  equipmentId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentEquipment, error: fetchError } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single();

  if (fetchError || !currentEquipment) throw new NotFoundError('Equipment not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentEquipment.farm_id)) {
    throw new AuthorizationError('You do not have access to this equipment');
  }

  const body = await req.json();
  const errors = validate(body, [
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 200 },
    {
      field: 'type',
      required: false,
      type: 'string',
      enum: ['tractor', 'plow', 'harvester', 'irrigation', 'sprayer', 'trailer', 'other'],
    },
    { field: 'brand', required: false, type: 'string', maxLength: 100 },
    { field: 'model', required: false, type: 'string', maxLength: 100 },
    { field: 'serial_number', required: false, type: 'string', maxLength: 100 },
    { field: 'purchase_date', required: false, type: 'date' },
    { field: 'purchase_price', required: false, type: 'number', min: 0 },
    {
      field: 'status',
      required: false,
      type: 'string',
      enum: ['operational', 'maintenance', 'broken', 'retired'],
    },
    { field: 'last_maintenance_date', required: false, type: 'date' },
    { field: 'next_maintenance_date', required: false, type: 'date' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: equipment, error } = await supabase
    .from('equipment')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', equipmentId)
    .select()
    .single();

  if (error) throw new Error('Failed to update equipment');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('equipment', equipmentId, currentEquipment, equipment);

  await notifyTaskChange(currentEquipment.farm_id, 'equipment.updated', equipment);
  logger.info(`Equipment updated: ${equipmentId}`);

  return createSuccessResponse(equipment);
}

async function handleDeleteEquipment(
  req: Request,
  equipmentId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentEquipment, error: fetchError } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single();

  if (fetchError || !currentEquipment) throw new NotFoundError('Equipment not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentEquipment.farm_id)) {
    throw new AuthorizationError('You do not have access to this equipment');
  }

  const { error } = await supabase
    .from('equipment')
    .update({ status: 'retired', updated_at: new Date().toISOString() })
    .eq('id', equipmentId);

  if (error) throw new Error('Failed to delete equipment');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('equipment', equipmentId, currentEquipment, { status: 'retired' });

  await notifyTaskChange(currentEquipment.farm_id, 'equipment.deleted', { id: equipmentId });
  logger.info(`Equipment deleted: ${equipmentId}`);

  return createSuccessResponse({ message: 'Equipment deleted successfully' });
}
