/**
 * ============================================================================
 * FINANCE EDGE FUNCTION
 * ============================================================================
 * Handles financial record requests
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

export async function handleFinanceRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/finance', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Finance request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetFinancialRecords(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateFinancialRecord(req, requestId);
    } else if (path === '/summary' && method === 'GET') {
      return await handleGetFinancialSummary(req, url, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const recordId = path.substring(1);
      return await handleGetFinancialRecordById(req, recordId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const recordId = path.substring(1);
      return await handleUpdateFinancialRecord(req, recordId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const recordId = path.substring(1);
      return await handleDeleteFinancialRecord(req, recordId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Finance endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetFinancialRecords(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);
  const farmIds = await getUserFarmIds(authHeader);

  let query = supabase
    .from('financial_records')
    .select('*', { count: 'exact' })
    .in('farm_id', farmIds)
    .order('transaction_date', { ascending: false });

  const farmId = url.searchParams.get('farm_id');
  if (farmId) query = query.eq('farm_id', farmId);

  const type = url.searchParams.get('type');
  if (type) query = query.eq('type', type);

  const category = url.searchParams.get('category');
  if (category) query = query.eq('category', category);

  const startDate = url.searchParams.get('start_date');
  if (startDate) query = query.gte('transaction_date', startDate);

  const endDate = url.searchParams.get('end_date');
  if (endDate) query = query.lte('transaction_date', endDate);

  const { count } = await query;
  const { data: records, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch financial records');

  return createPaginatedResponse(records || [], page, pageSize, count || 0);
}

async function handleGetFinancialSummary(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');
  const startDate =
    url.searchParams.get('start_date') ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0];

  let query = supabase.from('financial_records').select('type, category, amount');

  if (farmId) {
    query = query.eq('farm_id', farmId);
  } else {
    const farmIds = await getUserFarmIds(authHeader);
    query = query.in('farm_id', farmIds);
  }

  query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);

  const { data: records, error } = await query;

  if (error) throw new Error('Failed to fetch financial summary');

  const summary = {
    total_income: 0,
    total_expenses: 0,
    net_profit: 0,
    income_by_category: {} as Record<string, number>,
    expenses_by_category: {} as Record<string, number>,
  };

  for (const record of records || []) {
    if (record.type === 'income') {
      summary.total_income += record.amount;
      summary.income_by_category[record.category] =
        (summary.income_by_category[record.category] || 0) + record.amount;
    } else {
      summary.total_expenses += record.amount;
      summary.expenses_by_category[record.category] =
        (summary.expenses_by_category[record.category] || 0) + record.amount;
    }
  }

  summary.net_profit = summary.total_income - summary.total_expenses;

  return createSuccessResponse(summary);
}

async function handleGetFinancialRecordById(
  req: Request,
  recordId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: record, error } = await supabase
    .from('financial_records')
    .select('*, farm:farms(id, name), created_by:profiles(full_name)')
    .eq('id', recordId)
    .single();

  if (error || !record) throw new NotFoundError('Financial record not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(record.farm_id)) {
    throw new AuthorizationError('You do not have access to this record');
  }

  return createSuccessResponse(record);
}

async function handleCreateFinancialRecord(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'farm_id', required: true, type: 'uuid' },
    { field: 'type', required: true, type: 'string', enum: ['income', 'expense'] },
    { field: 'category', required: true, type: 'string', minLength: 1, maxLength: 100 },
    { field: 'amount', required: true, type: 'number', min: 0 },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'transaction_date', required: true, type: 'date' },
    { field: 'reference_number', required: false, type: 'string', maxLength: 100 },
    { field: 'payment_method', required: false, type: 'string', maxLength: 50 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(body.farm_id)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: record, error } = await supabase
    .from('financial_records')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create financial record');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('financial_records', record.id, record);

  logger.info(`Financial record created: ${record.id}`);

  return createSuccessResponse(record, 201);
}

async function handleUpdateFinancialRecord(
  req: Request,
  recordId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentRecord, error: fetchError } = await supabase
    .from('financial_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (fetchError || !currentRecord) throw new NotFoundError('Financial record not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentRecord.farm_id)) {
    throw new AuthorizationError('You do not have access to this record');
  }

  const body = await req.json();
  const errors = validate(body, [
    { field: 'type', required: false, type: 'string', enum: ['income', 'expense'] },
    { field: 'category', required: false, type: 'string', minLength: 1, maxLength: 100 },
    { field: 'amount', required: false, type: 'number', min: 0 },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'transaction_date', required: false, type: 'date' },
    { field: 'reference_number', required: false, type: 'string', maxLength: 100 },
    { field: 'payment_method', required: false, type: 'string', maxLength: 50 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const { data: record, error } = await supabase
    .from('financial_records')
    .update(body)
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw new Error('Failed to update financial record');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('financial_records', recordId, currentRecord, record);

  logger.info(`Financial record updated: ${recordId}`);

  return createSuccessResponse(record);
}

async function handleDeleteFinancialRecord(
  req: Request,
  recordId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentRecord, error: fetchError } = await supabase
    .from('financial_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (fetchError || !currentRecord) throw new NotFoundError('Financial record not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentRecord.farm_id)) {
    throw new AuthorizationError('You do not have access to this record');
  }

  const { error } = await supabase.from('financial_records').delete().eq('id', recordId);

  if (error) throw new Error('Failed to delete financial record');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('financial_records', recordId, currentRecord);

  logger.info(`Financial record deleted: ${recordId}`);

  return createSuccessResponse({ message: 'Financial record deleted successfully' });
}
