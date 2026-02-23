/**
 * ============================================================================
 * SEARCH EDGE FUNCTION
 * ============================================================================
 * Handles search requests across all entities
 * ============================================================================
 */

import { supabase, getUserFromAuth, getUserFarmIds } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  errorHandler,
  createSuccessResponse,
  ValidationError,
  AuthenticationError,
} from '../_shared/error-handler.ts';
import { validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';

export async function handleSearchRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/search', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Search request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleSearch(req, url, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Search endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleSearch(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const query = url.searchParams.get('q');
  const types = url.searchParams.get('types')?.split(',') || [];
  const { page, pageSize, offset } = validatePagination(url.searchParams);

  if (!query || query.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const farmIds = await getUserFarmIds(authHeader);
  const results: any[] = [];

  // Search farms
  if (types.length === 0 || types.includes('farms')) {
    const { data: farms } = await supabase
      .from('farms')
      .select('id, name, description, created_at')
      .in('id', farmIds)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(pageSize);

    for (const farm of farms || []) {
      results.push({
        id: farm.id,
        type: 'farm',
        title: farm.name,
        description: farm.description,
        url: `/farms/${farm.id}`,
        created_at: farm.created_at,
      });
    }
  }

  // Search fields
  if (types.length === 0 || types.includes('fields')) {
    const { data: fields } = await supabase
      .from('fields')
      .select('id, name, description, farm_id, created_at')
      .in('farm_id', farmIds)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(pageSize);

    for (const field of fields || []) {
      results.push({
        id: field.id,
        type: 'field',
        title: field.name,
        description: field.description,
        url: `/fields/${field.id}`,
        created_at: field.created_at,
      });
    }
  }

  // Search crops
  if (types.length === 0 || types.includes('crops')) {
    const { data: crops } = await supabase
      .from('crops')
      .select('id, name, scientific_name, variety, description, created_at')
      .eq('is_active', true)
      .or(
        `name.ilike.%${query}%,scientific_name.ilike.%${query}%,variety.ilike.%${query}%,description.ilike.%${query}%`
      )
      .limit(pageSize);

    for (const crop of crops || []) {
      results.push({
        id: crop.id,
        type: 'crop',
        title: crop.name,
        description: `${crop.variety || ''} ${crop.scientific_name || ''}`.trim(),
        url: `/crops/${crop.id}`,
        created_at: crop.created_at,
      });
    }
  }

  // Search livestock
  if (types.length === 0 || types.includes('livestock')) {
    const { data: livestock } = await supabase
      .from('livestock')
      .select('id, name, tag_number, type, breed, farm_id, created_at')
      .in('farm_id', farmIds)
      .or(`name.ilike.%${query}%,tag_number.ilike.%${query}%,breed.ilike.%${query}%`)
      .limit(pageSize);

    for (const animal of livestock || []) {
      results.push({
        id: animal.id,
        type: 'livestock',
        title: animal.name || animal.tag_number || `${animal.type} - ${animal.breed}`,
        description: `${animal.type} - ${animal.breed}`,
        url: `/livestock/${animal.id}`,
        created_at: animal.created_at,
      });
    }
  }

  // Search inventory
  if (types.length === 0 || types.includes('inventory')) {
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, name, description, category, farm_id, created_at')
      .in('farm_id', farmIds)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(pageSize);

    for (const item of inventory || []) {
      results.push({
        id: item.id,
        type: 'inventory',
        title: item.name,
        description: `${item.category} - ${item.description || ''}`,
        url: `/inventory/${item.id}`,
        created_at: item.created_at,
      });
    }
  }

  // Search equipment
  if (types.length === 0 || types.includes('equipment')) {
    const { data: equipment } = await supabase
      .from('equipment')
      .select('id, name, brand, model, type, farm_id, created_at')
      .in('farm_id', farmIds)
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
      .limit(pageSize);

    for (const item of equipment || []) {
      results.push({
        id: item.id,
        type: 'equipment',
        title: item.name,
        description: `${item.brand || ''} ${item.model || ''} ${item.type}`.trim(),
        url: `/equipment/${item.id}`,
        created_at: item.created_at,
      });
    }
  }

  // Search tasks
  if (types.length === 0 || types.includes('tasks')) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, farm_id, created_at')
      .in('farm_id', farmIds)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(pageSize);

    for (const task of tasks || []) {
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        url: `/tasks/${task.id}`,
        created_at: task.created_at,
      });
    }
  }

  // Sort by relevance (simple implementation - prioritize exact matches)
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase() === query.toLowerCase() ? 1 : 0;
    const bExact = b.title.toLowerCase() === query.toLowerCase() ? 1 : 0;
    return bExact - aExact;
  });

  // Paginate results
  const total = results.length;
  const paginatedResults = results.slice(offset, offset + pageSize);

  return createSuccessResponse({
    query,
    results: paginatedResults,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
    },
  });
}
