/**
 * ============================================================================
 * AUDIT EDGE FUNCTION
 * ============================================================================
 * Handles audit log requests
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
} from '../_shared/error-handler.ts';
import { validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';

export async function handleAuditRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/audit', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Audit request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetAuditLogs(req, url, requestId);
    } else if (path === '/export' && method === 'GET') {
      return await handleExportAuditLogs(req, url, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Audit endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetAuditLogs(req: Request, url: URL, requestId: string): Promise<Response> {
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
    throw new AuthorizationError('Only admins can view audit logs');
  }

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  const userId = url.searchParams.get('user_id');
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const action = url.searchParams.get('action');
  if (action) {
    query = query.eq('action', action);
  }

  const tableName = url.searchParams.get('table_name');
  if (tableName) {
    query = query.eq('table_name', tableName);
  }

  const startDate = url.searchParams.get('start_date');
  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  const endDate = url.searchParams.get('end_date');
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { count } = await query;
  const { data: logs, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch audit logs');

  return createPaginatedResponse(logs || [], page, pageSize, count || 0);
}

async function handleExportAuditLogs(req: Request, url: URL, requestId: string): Promise<Response> {
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
    throw new AuthorizationError('Only admins can export audit logs');
  }

  const format = url.searchParams.get('format') || 'json';
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: logs, error } = await query.limit(10000); // Limit to 10,000 records for export

  if (error) throw new Error('Failed to fetch audit logs');

  if (format === 'csv') {
    // Convert to CSV
    const headers = [
      'id',
      'user_id',
      'action',
      'table_name',
      'record_id',
      'created_at',
      'ip_address',
    ];
    const csvRows = [headers.join(',')];

    for (const log of logs || []) {
      const row = headers.map((header) => {
        const value = log[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
        return String(value).replace(/"/g, '""');
      });
      csvRows.push(`"${row.join('","')}"`);
    }

    const csvContent = csvRows.join('\n');

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } else {
    // Return JSON
    return createSuccessResponse({
      logs,
      count: logs?.length || 0,
      export_date: new Date().toISOString(),
    });
  }
}
