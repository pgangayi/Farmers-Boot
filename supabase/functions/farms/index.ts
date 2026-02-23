/**
 * ============================================================================
 * FARMS EDGE FUNCTION
 * ============================================================================
 * Handles farm-related requests
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

export async function handleFarmsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/farms', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Farms request: ${method} ${path}`);

  try {
    // Route to appropriate handler
    if (path === '' && method === 'GET') {
      return await handleGetFarms(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateFarm(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const farmId = path.substring(1);
      return await handleGetFarm(req, farmId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const farmId = path.substring(1);
      return await handleUpdateFarm(req, farmId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const farmId = path.substring(1);
      return await handleDeleteFarm(req, farmId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Farms endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

// Get all farms
async function handleGetFarms(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  // Get user's accessible farm IDs
  const farmIds = await getUserFarmIds(authHeader);

  // Build query
  let query = supabase
    .from('farms')
    .select('*', { count: 'exact' })
    .in('id', farmIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Apply filters
  const search = url.searchParams.get('search');
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Get total count
  const { count, error: countError } = await query;

  if (countError) {
    throw new Error('Failed to count farms');
  }

  // Get paginated results
  const { data: farms, error } = await query.range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error('Failed to fetch farms');
  }

  return createPaginatedResponse(farms || [], page, pageSize, count || 0);
}

// Get single farm
async function handleGetFarm(req: Request, farmId: string, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  // Check if user has access to this farm
  const farmIds = await getUserFarmIds(authHeader);

  if (!farmIds.includes(farmId)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .select(
      `
      *,
      location:locations(*),
      owner:profiles(id, full_name, email),
      fields(id, name, area_hectares, is_active)
    `
    )
    .eq('id', farmId)
    .single();

  if (error || !farm) {
    throw new NotFoundError('Farm not found');
  }

  return createSuccessResponse(farm);
}

// Create farm
async function handleCreateFarm(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'location_id', required: false, type: 'uuid' },
    { field: 'area_hectares', required: false, type: 'number', min: 0 },
    { field: 'soil_type', required: false, type: 'string', maxLength: 50 },
    { field: 'climate_zone', required: false, type: 'string', maxLength: 50 },
    { field: 'elevation_meters', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .insert({
      name: body.name,
      description: body.description,
      location_id: body.location_id,
      owner_id: user.id,
      area_hectares: body.area_hectares,
      soil_type: body.soil_type,
      climate_zone: body.climate_zone,
      elevation_meters: body.elevation_meters,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create farm');
  }

  // Update user's farm_id
  await supabase.from('profiles').update({ farm_id: farm.id }).eq('id', user.id);

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('farms', farm.id, farm);

  // Notify users
  await notifyTaskChange(farm.id, 'farm.created', farm);

  logger.info(`Farm created: ${farm.id}`);

  return createSuccessResponse(farm, 201);
}

// Update farm
async function handleUpdateFarm(
  req: Request,
  farmId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  // Check if user has access to this farm
  const farmIds = await getUserFarmIds(authHeader);

  if (!farmIds.includes(farmId)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  // Get current farm data
  const { data: currentFarm, error: fetchError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .single();

  if (fetchError || !currentFarm) {
    throw new NotFoundError('Farm not found');
  }

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'location_id', required: false, type: 'uuid' },
    { field: 'area_hectares', required: false, type: 'number', min: 0 },
    { field: 'soil_type', required: false, type: 'string', maxLength: 50 },
    { field: 'climate_zone', required: false, type: 'string', maxLength: 50 },
    { field: 'elevation_meters', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', farmId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update farm');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('farms', farmId, currentFarm, farm);

  // Notify users
  await notifyTaskChange(farmId, 'farm.updated', farm);

  logger.info(`Farm updated: ${farmId}`);

  return createSuccessResponse(farm);
}

// Delete farm
async function handleDeleteFarm(
  req: Request,
  farmId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  // Check if user is the owner
  const { data: farm, error: fetchError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .single();

  if (fetchError || !farm) {
    throw new NotFoundError('Farm not found');
  }

  if (farm.owner_id !== user.id) {
    throw new AuthorizationError('Only the farm owner can delete the farm');
  }

  // Soft delete
  const { error } = await supabase
    .from('farms')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', farmId);

  if (error) {
    throw new Error('Failed to delete farm');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('farms', farmId, farm);

  // Notify users
  await notifyTaskChange(farmId, 'farm.deleted', { id: farmId });

  logger.info(`Farm deleted: ${farmId}`);

  return createSuccessResponse({ message: 'Farm deleted successfully' });
}
