/**
 * ============================================================================
 * INVENTORY EDGE FUNCTION
 * ============================================================================
 * Handles inventory-related requests
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

export async function handleInventoryRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/inventory', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Inventory request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetInventory(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateInventory(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const inventoryId = path.substring(1);
      return await handleGetInventoryById(req, inventoryId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const inventoryId = path.substring(1);
      return await handleUpdateInventory(req, inventoryId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const inventoryId = path.substring(1);
      return await handleDeleteInventory(req, inventoryId, requestId);
    } else if (path.match(/^\/[^\/]+\/transactions$/) && method === 'GET') {
      const inventoryId = path.substring(1, path.lastIndexOf('/transactions'));
      return await handleGetTransactions(req, inventoryId, requestId);
    } else if (path.match(/^\/[^\/]+\/transactions$/) && method === 'POST') {
      const inventoryId = path.substring(1, path.lastIndexOf('/transactions'));
      return await handleAddTransaction(req, inventoryId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Inventory endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetInventory(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);
  const farmIds = await getUserFarmIds(authHeader);

  let query = supabase
    .from('inventory')
    .select('*', { count: 'exact' })
    .in('farm_id', farmIds)
    .order('name', { ascending: true });

  const farmId = url.searchParams.get('farm_id');
  if (farmId) query = query.eq('farm_id', farmId);

  const category = url.searchParams.get('category');
  if (category) query = query.eq('category', category);

  const lowStock = url.searchParams.get('low_stock');
  if (lowStock === 'true') {
    query = query.lte('quantity', supabase.raw('min_quantity'));
  }

  const { count } = await query;
  const { data: inventory, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch inventory');

  return createPaginatedResponse(inventory || [], page, pageSize, count || 0);
}

async function handleGetInventoryById(
  req: Request,
  inventoryId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select(
      `
      *,
      farm:farms(id, name),
      transactions:inventory_transactions(
        id,
        transaction_type,
        quantity,
        unit_price,
        total_price,
        reason,
        created_at,
        created_by:profiles(full_name)
      )
    `
    )
    .eq('id', inventoryId)
    .single();

  if (error || !inventory) throw new NotFoundError('Inventory not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(inventory.farm_id)) {
    throw new AuthorizationError('You do not have access to this inventory');
  }

  return createSuccessResponse(inventory);
}

async function handleCreateInventory(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'farm_id', required: true, type: 'uuid' },
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 200 },
    {
      field: 'category',
      required: true,
      type: 'string',
      enum: ['seeds', 'fertilizer', 'pesticide', 'equipment', 'feed', 'medicine', 'other'],
    },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'unit', required: true, type: 'string', maxLength: 20 },
    { field: 'quantity', required: true, type: 'number', min: 0 },
    { field: 'min_quantity', required: false, type: 'number', min: 0 },
    { field: 'unit_price', required: false, type: 'number', min: 0 },
    { field: 'supplier', required: false, type: 'string', maxLength: 200 },
    { field: 'expiry_date', required: false, type: 'date' },
    { field: 'location', required: false, type: 'string', maxLength: 100 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(body.farm_id)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: inventory, error } = await supabase
    .from('inventory')
    .insert(body)
    .select()
    .single();

  if (error) throw new Error('Failed to create inventory');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('inventory', inventory.id, inventory);

  await notifyTaskChange(body.farm_id, 'inventory.created', inventory);
  logger.info(`Inventory created: ${inventory.id}`);

  return createSuccessResponse(inventory, 201);
}

async function handleUpdateInventory(
  req: Request,
  inventoryId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentInventory, error: fetchError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', inventoryId)
    .single();

  if (fetchError || !currentInventory) throw new NotFoundError('Inventory not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentInventory.farm_id)) {
    throw new AuthorizationError('You do not have access to this inventory');
  }

  const body = await req.json();
  const errors = validate(body, [
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 200 },
    {
      field: 'category',
      required: false,
      type: 'string',
      enum: ['seeds', 'fertilizer', 'pesticide', 'equipment', 'feed', 'medicine', 'other'],
    },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'unit', required: false, type: 'string', maxLength: 20 },
    { field: 'quantity', required: false, type: 'number', min: 0 },
    { field: 'min_quantity', required: false, type: 'number', min: 0 },
    { field: 'unit_price', required: false, type: 'number', min: 0 },
    { field: 'supplier', required: false, type: 'string', maxLength: 200 },
    { field: 'expiry_date', required: false, type: 'date' },
    { field: 'location', required: false, type: 'string', maxLength: 100 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: inventory, error } = await supabase
    .from('inventory')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)
    .select()
    .single();

  if (error) throw new Error('Failed to update inventory');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('inventory', inventoryId, currentInventory, inventory);

  await notifyTaskChange(currentInventory.farm_id, 'inventory.updated', inventory);
  logger.info(`Inventory updated: ${inventoryId}`);

  return createSuccessResponse(inventory);
}

async function handleDeleteInventory(
  req: Request,
  inventoryId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentInventory, error: fetchError } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', inventoryId)
    .single();

  if (fetchError || !currentInventory) throw new NotFoundError('Inventory not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentInventory.farm_id)) {
    throw new AuthorizationError('You do not have access to this inventory');
  }

  const { error } = await supabase.from('inventory').delete().eq('id', inventoryId);

  if (error) throw new Error('Failed to delete inventory');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('inventory', inventoryId, currentInventory);

  await notifyTaskChange(currentInventory.farm_id, 'inventory.deleted', { id: inventoryId });
  logger.info(`Inventory deleted: ${inventoryId}`);

  return createSuccessResponse({ message: 'Inventory deleted successfully' });
}

async function handleGetTransactions(
  req: Request,
  inventoryId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: inventory, error: fetchError } = await supabase
    .from('inventory')
    .select('farm_id')
    .eq('id', inventoryId)
    .single();

  if (fetchError || !inventory) throw new NotFoundError('Inventory not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(inventory.farm_id)) {
    throw new AuthorizationError('You do not have access to this inventory');
  }

  const { data: transactions, error } = await supabase
    .from('inventory_transactions')
    .select('*, created_by:profiles(full_name)')
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch transactions');

  return createSuccessResponse(transactions || []);
}

async function handleAddTransaction(
  req: Request,
  inventoryId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: inventory, error: fetchError } = await supabase
    .from('inventory')
    .select('farm_id, quantity')
    .eq('id', inventoryId)
    .single();

  if (fetchError || !inventory) throw new NotFoundError('Inventory not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(inventory.farm_id)) {
    throw new AuthorizationError('You do not have access to this inventory');
  }

  const body = await req.json();
  const errors = validate(body, [
    {
      field: 'transaction_type',
      required: true,
      type: 'string',
      enum: ['purchase', 'usage', 'sale', 'loss', 'adjustment'],
    },
    { field: 'quantity', required: true, type: 'number' },
    { field: 'unit_price', required: false, type: 'number', min: 0 },
    { field: 'total_price', required: false, type: 'number', min: 0 },
    { field: 'reason', required: false, type: 'string', maxLength: 500 },
    { field: 'reference_number', required: false, type: 'string', maxLength: 100 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Calculate new quantity
  let newQuantity = inventory.quantity;
  switch (body.transaction_type) {
    case 'purchase':
    case 'adjustment':
      newQuantity += body.quantity;
      break;
    case 'usage':
    case 'sale':
    case 'loss':
      newQuantity -= body.quantity;
      break;
  }

  if (newQuantity < 0) {
    throw new ValidationError('Insufficient inventory quantity');
  }

  // Add transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('inventory_transactions')
    .insert({
      inventory_id: inventoryId,
      created_by: user.id,
      ...body,
    })
    .select()
    .single();

  if (transactionError) throw new Error('Failed to add transaction');

  // Update inventory quantity
  const { error: updateError } = await supabase
    .from('inventory')
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', inventoryId);

  if (updateError) throw new Error('Failed to update inventory quantity');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('inventory_transactions', transaction.id, transaction);

  await notifyTaskChange(inventory.farm_id, 'inventory.transaction_added', transaction);
  logger.info(`Transaction added: ${transaction.id}`);

  return createSuccessResponse(transaction, 201);
}
