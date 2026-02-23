/**
 * ============================================================================
 * TASKS EDGE FUNCTION
 * ============================================================================
 * Handles task-related requests
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

export async function handleTasksRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/tasks', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Tasks request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetTasks(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateTask(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const taskId = path.substring(1);
      return await handleGetTaskById(req, taskId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const taskId = path.substring(1);
      return await handleUpdateTask(req, taskId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const taskId = path.substring(1);
      return await handleDeleteTask(req, taskId, requestId);
    } else if (path.match(/^\/[^\/]+\/complete$/) && method === 'POST') {
      const taskId = path.substring(1, path.lastIndexOf('/complete'));
      return await handleCompleteTask(req, taskId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Tasks endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetTasks(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);
  const farmIds = await getUserFarmIds(authHeader);

  let query = supabase
    .from('tasks')
    .select(
      `
      *,
      farm:farms(id, name),
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
    `,
      { count: 'exact' }
    )
    .in('farm_id', farmIds)
    .order('due_date', { ascending: true, nullsFirst: false });

  const farmId = url.searchParams.get('farm_id');
  if (farmId) query = query.eq('farm_id', farmId);

  const status = url.searchParams.get('status');
  if (status) query = query.eq('status', status);

  const priority = url.searchParams.get('priority');
  if (priority) query = query.eq('priority', priority);

  const assignedTo = url.searchParams.get('assigned_to');
  if (assignedTo) query = query.eq('assigned_to', assignedTo);

  const overdue = url.searchParams.get('overdue');
  if (overdue === 'true') {
    query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
  }

  const { count } = await query;
  const { data: tasks, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch tasks');

  return createPaginatedResponse(tasks || [], page, pageSize, count || 0);
}

async function handleGetTaskById(
  req: Request,
  taskId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: task, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      farm:farms(id, name),
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
    `
    )
    .eq('id', taskId)
    .single();

  if (error || !task) throw new NotFoundError('Task not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(task.farm_id)) {
    throw new AuthorizationError('You do not have access to this task');
  }

  return createSuccessResponse(task);
}

async function handleCreateTask(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'farm_id', required: true, type: 'uuid' },
    { field: 'title', required: true, type: 'string', minLength: 2, maxLength: 200 },
    { field: 'description', required: false, type: 'string', maxLength: 1000 },
    {
      field: 'priority',
      required: false,
      type: 'string',
      enum: ['low', 'medium', 'high', 'urgent'],
    },
    { field: 'due_date', required: false, type: 'date' },
    { field: 'assigned_to', required: false, type: 'uuid' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(body.farm_id)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...body,
      created_by: user.id,
      status: 'pending',
    })
    .select(
      `
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
    `
    )
    .single();

  if (error) throw new Error('Failed to create task');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('tasks', task.id, task);

  await notifyTaskChange(body.farm_id, 'task.created', task);
  logger.info(`Task created: ${task.id}`);

  return createSuccessResponse(task, 201);
}

async function handleUpdateTask(
  req: Request,
  taskId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (fetchError || !currentTask) throw new NotFoundError('Task not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentTask.farm_id)) {
    throw new AuthorizationError('You do not have access to this task');
  }

  const body = await req.json();
  const errors = validate(body, [
    { field: 'title', required: false, type: 'string', minLength: 2, maxLength: 200 },
    { field: 'description', required: false, type: 'string', maxLength: 1000 },
    {
      field: 'priority',
      required: false,
      type: 'string',
      enum: ['low', 'medium', 'high', 'urgent'],
    },
    {
      field: 'status',
      required: false,
      type: 'string',
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    },
    { field: 'due_date', required: false, type: 'date' },
    { field: 'assigned_to', required: false, type: 'uuid' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  const updateData: any = { ...body, updated_at: new Date().toISOString() };

  // Set completed_at when status changes to completed
  if (body.status === 'completed' && currentTask.status !== 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select(
      `
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
    `
    )
    .single();

  if (error) throw new Error('Failed to update task');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('tasks', taskId, currentTask, task);

  await notifyTaskChange(currentTask.farm_id, 'task.updated', task);
  logger.info(`Task updated: ${taskId}`);

  return createSuccessResponse(task);
}

async function handleDeleteTask(
  req: Request,
  taskId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (fetchError || !currentTask) throw new NotFoundError('Task not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentTask.farm_id)) {
    throw new AuthorizationError('You do not have access to this task');
  }

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) throw new Error('Failed to delete task');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('tasks', taskId, currentTask);

  await notifyTaskChange(currentTask.farm_id, 'task.deleted', { id: taskId });
  logger.info(`Task deleted: ${taskId}`);

  return createSuccessResponse({ message: 'Task deleted successfully' });
}

async function handleCompleteTask(
  req: Request,
  taskId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (fetchError || !currentTask) throw new NotFoundError('Task not found');

  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(currentTask.farm_id)) {
    throw new AuthorizationError('You do not have access to this task');
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select(
      `
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
      created_by_profile:profiles!tasks_created_by_fkey(id, full_name)
    `
    )
    .single();

  if (error) throw new Error('Failed to complete task');

  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('tasks', taskId, currentTask, task);

  await notifyTaskChange(currentTask.farm_id, 'task.completed', task);
  logger.info(`Task completed: ${taskId}`);

  return createSuccessResponse(task);
}
