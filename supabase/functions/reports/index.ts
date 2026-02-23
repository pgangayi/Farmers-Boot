/**
 * ============================================================================
 * REPORTS EDGE FUNCTION
 * ============================================================================
 * Handles report generation requests
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
import { logger } from '../_shared/logger.ts';

export async function handleReportsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/reports', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Reports request: ${method} ${path}`);

  try {
    if (path === '/farm-summary' && method === 'GET') {
      return await handleFarmSummaryReport(req, url, requestId);
    } else if (path === '/crop-yield' && method === 'GET') {
      return await handleCropYieldReport(req, url, requestId);
    } else if (path === '/financial' && method === 'GET') {
      return await handleFinancialReport(req, url, requestId);
    } else if (path === '/inventory' && method === 'GET') {
      return await handleInventoryReport(req, url, requestId);
    } else if (path === '/livestock' && method === 'GET') {
      return await handleLivestockReport(req, url, requestId);
    } else if (path === '/tasks' && method === 'GET') {
      return await handleTasksReport(req, url, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Reports endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleFarmSummaryReport(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');
  const farmIds = farmId ? [farmId] : await getUserFarmIds(authHeader);

  // Get farms
  const { data: farms, error: farmsError } = await supabase
    .from('farms')
    .select('id, name, area_hectares, owner_id')
    .in('id', farmIds);

  if (farmsError) throw new Error('Failed to fetch farms');

  // Get fields count
  const { data: fields } = await supabase
    .from('fields')
    .select('farm_id, area_hectares')
    .in('farm_id', farmIds)
    .eq('is_active', true);

  // Get crop plans count
  const { data: cropPlans } = await supabase
    .from('crop_plans')
    .select('farm_id, status')
    .in('farm_id', farmIds);

  // Get livestock count
  const { data: livestock } = await supabase
    .from('livestock')
    .select('farm_id, type, status')
    .in('farm_id', farmIds);

  // Get tasks count
  const { data: tasks } = await supabase
    .from('tasks')
    .select('farm_id, status')
    .in('farm_id', farmIds);

  // Aggregate data by farm
  const summary = (farms || []).map((farm: any) => {
    const farmFields = fields?.filter((f: any) => f.farm_id === farm.id) || [];
    const farmCropPlans = cropPlans?.filter((cp: any) => cp.farm_id === farm.id) || [];
    const farmLivestock = livestock?.filter((l: any) => l.farm_id === farm.id) || [];
    const farmTasks = tasks?.filter((t: any) => t.farm_id === farm.id) || [];

    return {
      farm_id: farm.id,
      farm_name: farm.name,
      total_area_hectares: farm.area_hectares || 0,
      fields_count: farmFields.length,
      fields_area_hectares: farmFields.reduce(
        (sum: number, f: any) => sum + (f.area_hectares || 0),
        0
      ),
      crop_plans_count: farmCropPlans.length,
      active_crop_plans: farmCropPlans.filter((cp: any) =>
        ['planted', 'growing'].includes(cp.status)
      ).length,
      livestock_count: farmLivestock.length,
      healthy_livestock: farmLivestock.filter((l: any) => l.status === 'healthy').length,
      tasks_count: farmTasks.length,
      pending_tasks: farmTasks.filter((t: any) => t.status === 'pending').length,
      in_progress_tasks: farmTasks.filter((t: any) => t.status === 'in_progress').length,
    };
  });

  return createSuccessResponse({
    summary,
    total: {
      farms: summary.length,
      total_area_hectares: summary.reduce((sum: number, s: any) => sum + s.total_area_hectares, 0),
      fields: summary.reduce((sum: number, s: any) => sum + s.fields_count, 0),
      crop_plans: summary.reduce((sum: number, s: any) => sum + s.crop_plans_count, 0),
      livestock: summary.reduce((sum: number, s: any) => sum + s.livestock_count, 0),
      tasks: summary.reduce((sum: number, s: any) => sum + s.tasks_count, 0),
    },
  });
}

async function handleCropYieldReport(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');
  const season = url.searchParams.get('season');
  const year = url.searchParams.get('year');

  let query = supabase
    .from('crop_plans')
    .select(
      `
      *,
      field:fields(id, name, area_hectares),
      crop:crops(id, name, variety)
    `
    )
    .eq('status', 'harvested');

  if (farmId) {
    query = query.eq('field.farm_id', farmId);
  } else {
    const farmIds = await getUserFarmIds(authHeader);
    query = query.in('field.farm_id', farmIds);
  }

  if (season) {
    query = query.eq('season', season);
  }

  if (year) {
    query = query.like('planting_date', `${year}%`);
  }

  const { data: cropPlans, error } = await query;

  if (error) throw new Error('Failed to fetch crop yield data');

  const report = (cropPlans || []).map((plan: any) => ({
    crop_name: plan.crop?.name,
    variety: plan.crop?.variety,
    field_name: plan.field?.name,
    area_hectares: plan.field?.area_hectares,
    season: plan.season,
    planting_date: plan.planting_date,
    harvest_date: plan.actual_harvest_date,
    expected_yield_kg_per_hectare: plan.expected_yield_kg_per_hectare,
    actual_yield_kg: plan.actual_yield_kg,
    yield_efficiency:
      plan.expected_yield_kg_per_hectare && plan.field?.area_hectares
        ? ((plan.actual_yield_kg || 0) /
            (plan.expected_yield_kg_per_hectare * plan.field.area_hectares)) *
          100
        : null,
  }));

  return createSuccessResponse({
    report,
    summary: {
      total_harvests: report.length,
      total_actual_yield_kg: report.reduce(
        (sum: number, r: any) => sum + (r.actual_yield_kg || 0),
        0
      ),
      average_yield_efficiency:
        report.length > 0
          ? report.reduce((sum: number, r: any) => sum + (r.yield_efficiency || 0), 0) /
            report.length
          : 0,
    },
  });
}

async function handleFinancialReport(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');
  const startDate =
    url.searchParams.get('start_date') ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0];

  let query = supabase.from('financial_records').select('type, category, amount, transaction_date');

  if (farmId) {
    query = query.eq('farm_id', farmId);
  } else {
    const farmIds = await getUserFarmIds(authHeader);
    query = query.in('farm_id', farmIds);
  }

  query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);

  const { data: records, error } = await query;

  if (error) throw new Error('Failed to fetch financial data');

  const incomeByCategory: Record<string, number> = {};
  const expensesByCategory: Record<string, number> = {};
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const record of records || []) {
    if (record.type === 'income') {
      totalIncome += record.amount;
      incomeByCategory[record.category] = (incomeByCategory[record.category] || 0) + record.amount;
    } else {
      totalExpenses += record.amount;
      expensesByCategory[record.category] =
        (expensesByCategory[record.category] || 0) + record.amount;
    }
  }

  return createSuccessResponse({
    period: { start_date: startDate, end_date: endDate },
    summary: {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_profit: totalIncome - totalExpenses,
      profit_margin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    },
    income_by_category: incomeByCategory,
    expenses_by_category: expensesByCategory,
  });
}

async function handleInventoryReport(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');

  let query = supabase.from('inventory').select('*');

  if (farmId) {
    query = query.eq('farm_id', farmId);
  } else {
    const farmIds = await getUserFarmIds(authHeader);
    query = query.in('farm_id', farmIds);
  }

  const { data: inventory, error } = await query;

  if (error) throw new Error('Failed to fetch inventory data');

  const lowStockItems = (inventory || []).filter(
    (item: any) => item.min_quantity && item.quantity <= item.min_quantity
  );

  const byCategory: Record<string, any[]> = {};
  for (const item of inventory || []) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  }

  return createSuccessResponse({
    total_items: inventory?.length || 0,
    low_stock_items: lowStockItems.length,
    low_stock_details: lowStockItems,
    by_category: Object.entries(byCategory).map(([category, items]) => ({
      category,
      count: items.length,
      total_value: items.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0) * (item.unit_price || 0),
        0
      ),
    })),
  });
}

async function handleLivestockReport(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');

  let query = supabase.from('livestock').select('*');

  if (farmId) {
    query = query.eq('farm_id', farmId);
  } else {
    const farmIds = await getUserFarmIds(authHeader);
    query = query.in('farm_id', farmIds);
  }

  const { data: livestock, error } = await query;

  if (error) throw new Error('Failed to fetch livestock data');

  const byType: Record<string, any[]> = {};
  const byStatus: Record<string, any[]> = {};

  for (const animal of livestock || []) {
    if (!byType[animal.type]) {
      byType[animal.type] = [];
    }
    byType[animal.type].push(animal);

    if (!byStatus[animal.status]) {
      byStatus[animal.status] = [];
    }
    byStatus[animal.status].push(animal);
  }

  return createSuccessResponse({
    total_livestock: livestock?.length || 0,
    by_type: Object.entries(byType).map(([type, animals]) => ({
      type,
      count: animals.length,
      healthy: animals.filter((a: any) => a.status === 'healthy').length,
    })),
    by_status: Object.entries(byStatus).map(([status, animals]) => ({
      status,
      count: animals.length,
    })),
  });
}

async function handleTasksReport(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const farmId = url.searchParams.get('farm_id');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  let query = supabase.from('tasks').select('*');

  if (farmId) {
    query = query.eq('farm_id', farmId);
  } else {
    const farmIds = await getUserFarmIds(authHeader);
    query = query.in('farm_id', farmIds);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: tasks, error } = await query;

  if (error) throw new Error('Failed to fetch tasks data');

  const byStatus: Record<string, any[]> = {};
  const byPriority: Record<string, any[]> = {};

  for (const task of tasks || []) {
    if (!byStatus[task.status]) {
      byStatus[task.status] = [];
    }
    byStatus[task.status].push(task);

    if (!byPriority[task.priority]) {
      byPriority[task.priority] = [];
    }
    byPriority[task.priority].push(task);
  }

  return createSuccessResponse({
    total_tasks: tasks?.length || 0,
    by_status: Object.entries(byStatus).map(([status, tasks]) => ({
      status,
      count: tasks.length,
    })),
    by_priority: Object.entries(byPriority).map(([priority, tasks]) => ({
      priority,
      count: tasks.length,
    })),
    overdue: (tasks || []).filter(
      (t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length,
  });
}
