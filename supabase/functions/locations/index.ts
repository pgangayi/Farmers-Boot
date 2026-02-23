/**
 * ============================================================================
 * LOCATIONS EDGE FUNCTION
 * ============================================================================
 * Handles location-related requests
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

export async function handleLocationsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/locations', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Locations request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetLocations(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateLocation(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const locationId = path.substring(1);
      return await handleGetLocationById(req, locationId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const locationId = path.substring(1);
      return await handleUpdateLocation(req, locationId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const locationId = path.substring(1);
      return await handleDeleteLocation(req, locationId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Locations endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetLocations(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  let query = supabase
    .from('locations')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true });

  const search = url.searchParams.get('search');
  if (search) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
  }

  const country = url.searchParams.get('country');
  if (country) {
    query = query.eq('country', country);
  }

  const { count } = await query;
  const { data: locations, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch locations');

  return createPaginatedResponse(locations || [], page, pageSize, count || 0);
}

async function handleGetLocationById(
  req: Request,
  locationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: location, error } = await supabase
    .from('locations')
    .select(
      `
      *,
      farms:farms(id, name, owner_id)
    `
    )
    .eq('id', locationId)
    .single();

  if (error || !location) throw new NotFoundError('Location not found');

  return createSuccessResponse(location);
}

async function handleCreateLocation(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 200 },
    { field: 'address', required: false, type: 'string', maxLength: 500 },
    { field: 'city', required: false, type: 'string', maxLength: 100 },
    { field: 'state', required: false, type: 'string', maxLength: 100 },
    { field: 'country', required: false, type: 'string', maxLength: 100 },
    { field: 'postal_code', required: false, type: 'string', maxLength: 20 },
    { field: 'latitude', required: false, type: 'number' },
    { field: 'longitude', required: false, type: 'number' },
    { field: 'timezone', required: false, type: 'string', maxLength: 50 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: location, error } = await supabase
    .from('locations')
    .insert({
      ...body,
      country: body.country || 'Zimbabwe',
      timezone: body.timezone || 'Africa/Harare',
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create location');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('locations', location.id, location);

  logger.info(`Location created: ${location.id}`);

  return createSuccessResponse(location, 201);
}

async function handleUpdateLocation(
  req: Request,
  locationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentLocation, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (fetchError || !currentLocation) throw new NotFoundError('Location not found');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 200 },
    { field: 'address', required: false, type: 'string', maxLength: 500 },
    { field: 'city', required: false, type: 'string', maxLength: 100 },
    { field: 'state', required: false, type: 'string', maxLength: 100 },
    { field: 'country', required: false, type: 'string', maxLength: 100 },
    { field: 'postal_code', required: false, type: 'string', maxLength: 20 },
    { field: 'latitude', required: false, type: 'number' },
    { field: 'longitude', required: false, type: 'number' },
    { field: 'timezone', required: false, type: 'string', maxLength: 50 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: location, error } = await supabase
    .from('locations')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId)
    .select()
    .single();

  if (error) throw new Error('Failed to update location');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('locations', locationId, currentLocation, location);

  logger.info(`Location updated: ${locationId}`);

  return createSuccessResponse(location);
}

async function handleDeleteLocation(
  req: Request,
  locationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  // Check if location is used by any farms
  const { data: farms } = await supabase.from('farms').select('id').eq('location_id', locationId);

  if (farms && farms.length > 0) {
    throw new ValidationError('Cannot delete location that is in use by farms');
  }

  const { data: currentLocation, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (fetchError || !currentLocation) throw new NotFoundError('Location not found');

  const { error } = await supabase.from('locations').delete().eq('id', locationId);

  if (error) throw new Error('Failed to delete location');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('locations', locationId, currentLocation);

  logger.info(`Location deleted: ${locationId}`);

  return createSuccessResponse({ message: 'Location deleted successfully' });
}
