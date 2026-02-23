/**
 * ============================================================================
 * FIELDS EDGE FUNCTION
 * ============================================================================
 * Handles field-related requests
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

export async function handleFieldsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/fields', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Fields request: ${method} ${path}`);

  try {
    // Route to appropriate handler
    if (path === '' && method === 'GET') {
      return await handleGetFields(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateField(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const fieldId = path.substring(1);
      return await handleGetField(req, fieldId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const fieldId = path.substring(1);
      return await handleUpdateField(req, fieldId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const fieldId = path.substring(1);
      return await handleDeleteField(req, fieldId, requestId);
    } else if (path === '/soil-analysis' && method === 'POST') {
      return await handleSoilAnalysis(req, requestId);
    } else if (path.match(/^\/[^\/]+\/yield-map$/) && method === 'GET') {
      const fieldId = path.substring(1, path.lastIndexOf('/yield-map'));
      return await handleGetYieldMap(req, fieldId, requestId);
    } else if (path.match(/^\/[^\/]+\/productivity-report$/) && method === 'GET') {
      const fieldId = path.substring(1, path.lastIndexOf('/productivity-report'));
      return await handleProductivityReport(req, fieldId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Fields endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

// Get all fields
async function handleGetFields(req: Request, url: URL, requestId: string): Promise<Response> {
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
    .from('fields')
    .select('*', { count: 'exact' })
    .in('farm_id', farmIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Apply filters
  const farmId = url.searchParams.get('farm_id');
  if (farmId) {
    query = query.eq('farm_id', farmId);
  }

  const search = url.searchParams.get('search');
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Get total count
  const { count, error: countError } = await query;

  if (countError) {
    throw new Error('Failed to count fields');
  }

  // Get paginated results
  const { data: fields, error } = await query.range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error('Failed to fetch fields');
  }

  return createPaginatedResponse(fields || [], page, pageSize, count || 0);
}

// Get single field
async function handleGetField(req: Request, fieldId: string, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  // Get field
  const { data: field, error } = await supabase
    .from('fields')
    .select(
      `
      *,
      farm:farms(id, name, owner_id),
      crop_plans(
        id,
        crop:crops(id, name, variety),
        season,
        status,
        planting_date,
        expected_harvest_date
      )
    `
    )
    .eq('id', fieldId)
    .single();

  if (error || !field) {
    throw new NotFoundError('Field not found');
  }

  // Check if user has access to this field's farm
  const farmIds = await getUserFarmIds(authHeader);

  if (!farmIds.includes(field.farm_id)) {
    throw new AuthorizationError('You do not have access to this field');
  }

  return createSuccessResponse(field);
}

// Create field
async function handleCreateField(req: Request, requestId: string): Promise<Response> {
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
    { field: 'farm_id', required: true, type: 'uuid' },
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'area_hectares', required: true, type: 'number', min: 0 },
    { field: 'soil_type', required: false, type: 'string', maxLength: 50 },
    { field: 'soil_ph', required: false, type: 'number', min: 0, max: 14 },
    { field: 'irrigation_type', required: false, type: 'string', maxLength: 50 },
    { field: 'coordinates', required: false, type: 'object' },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  // Check if user has access to the farm
  const farmIds = await getUserFarmIds(authHeader);

  if (!farmIds.includes(body.farm_id)) {
    throw new AuthorizationError('You do not have access to this farm');
  }

  const { data: field, error } = await supabase
    .from('fields')
    .insert({
      farm_id: body.farm_id,
      name: body.name,
      description: body.description,
      area_hectares: body.area_hectares,
      soil_type: body.soil_type,
      soil_ph: body.soil_ph,
      irrigation_type: body.irrigation_type,
      coordinates: body.coordinates,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create field');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('fields', field.id, field);

  // Notify users
  await notifyTaskChange(body.farm_id, 'field.created', field);

  logger.info(`Field created: ${field.id}`);

  return createSuccessResponse(field, 201);
}

// Update field
async function handleUpdateField(
  req: Request,
  fieldId: string,
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

  // Get current field data
  const { data: currentField, error: fetchError } = await supabase
    .from('fields')
    .select('*')
    .eq('id', fieldId)
    .single();

  if (fetchError || !currentField) {
    throw new NotFoundError('Field not found');
  }

  // Check if user has access to this field's farm
  const farmIds = await getUserFarmIds(authHeader);

  if (!farmIds.includes(currentField.farm_id)) {
    throw new AuthorizationError('You do not have access to this field');
  }

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'description', required: false, type: 'string', maxLength: 500 },
    { field: 'area_hectares', required: false, type: 'number', min: 0 },
    { field: 'soil_type', required: false, type: 'string', maxLength: 50 },
    { field: 'soil_ph', required: false, type: 'number', min: 0, max: 14 },
    { field: 'irrigation_type', required: false, type: 'string', maxLength: 50 },
    { field: 'coordinates', required: false, type: 'object' },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { data: field, error } = await supabase
    .from('fields')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fieldId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update field');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('fields', fieldId, currentField, field);

  // Notify users
  await notifyTaskChange(currentField.farm_id, 'field.updated', field);

  logger.info(`Field updated: ${fieldId}`);

  return createSuccessResponse(field);
}

// Delete field
async function handleDeleteField(
  req: Request,
  fieldId: string,
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

  // Get current field data
  const { data: currentField, error: fetchError } = await supabase
    .from('fields')
    .select('*')
    .eq('id', fieldId)
    .single();

  if (fetchError || !currentField) {
    throw new NotFoundError('Field not found');
  }

  // Check if user has access to this field's farm
  const farmIds = await getUserFarmIds(authHeader);

  if (!farmIds.includes(currentField.farm_id)) {
    throw new AuthorizationError('You do not have access to this field');
  }

  // Soft delete
  const { error } = await supabase
    .from('fields')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fieldId);

  if (error) {
    throw new Error('Failed to delete field');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('fields', fieldId, currentField);

  // Notify users
  await notifyTaskChange(currentField.farm_id, 'field.deleted', { id: fieldId });

  logger.info(`Field deleted: ${fieldId}`);

  return createSuccessResponse({ message: 'Field deleted successfully' });
}

// Enhanced Field Management Functions

async function handleSoilAnalysis(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'field_id', required: true, type: 'uuid' },
    { field: 'sample_depth', required: false, type: 'number', min: 0, max: 100 },
    { field: 'nitrogen', required: false, type: 'number', min: 0 },
    { field: 'phosphorus', required: false, type: 'number', min: 0 },
    { field: 'potassium', required: false, type: 'number', min: 0 },
    { field: 'organic_matter', required: false, type: 'number', min: 0, max: 100 },
    { field: 'texture', required: false, type: 'string' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get field data
  const { data: field } = await supabase
    .from('fields')
    .select('*')
    .eq('id', body.field_id)
    .single();

  if (!field) throw new ValidationError('Field not found');

  // Check access
  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(field.farm_id)) {
    throw new AuthorizationError('You do not have access to this field');
  }

  const analysis = performSoilAnalysis(field, body);

  logger.info(`Soil analysis completed for field: ${body.field_id}`);
  return createSuccessResponse({
    field: field.name,
    analysis,
  });
}

async function handleGetYieldMap(
  req: Request,
  fieldId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  // Get field data and crop history
  const { data: field } = await supabase
    .from('fields')
    .select(
      `
      *,
      crop_plans(
        crop:crops(id, name, category),
        season,
        year,
        status,
        yield_actual,
        yield_expected
      )
    `
    )
    .eq('id', fieldId)
    .single();

  if (!field) throw new NotFoundError('Field not found');

  // Check access
  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(field.farm_id)) {
    throw new AuthorizationError('You do not have access to this field');
  }

  const yieldMap = generateYieldMap(field);

  logger.info(`Yield map generated for field: ${fieldId}`);
  return createSuccessResponse({
    field: field.name,
    yield_map: yieldMap,
  });
}

async function handleProductivityReport(
  req: Request,
  fieldId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  // Get field data and complete history
  const { data: field } = await supabase
    .from('fields')
    .select(
      `
      *,
      crop_plans(
        crop:crops(id, name, category, expected_yield_kg_per_hectare),
        season,
        year,
        status,
        yield_actual,
        yield_expected,
        planting_date,
        harvest_date
      )
    `
    )
    .eq('id', fieldId)
    .single();

  if (!field) throw new NotFoundError('Field not found');

  // Check access
  const farmIds = await getUserFarmIds(authHeader);
  if (!farmIds.includes(field.farm_id)) {
    throw new AuthorizationError('You do not have access to this field');
  }

  const report = generateProductivityReport(field);

  logger.info(`Productivity report generated for field: ${fieldId}`);
  return createSuccessResponse({
    field: field.name,
    report,
  });
}

// Enhanced Algorithm Functions

function performSoilAnalysis(field: any, sampleData: any): any {
  const analysis = {
    overall_health_score: 0,
    nutrient_analysis: analyzeNutrients(sampleData),
    physical_properties: analyzePhysicalProperties(field, sampleData),
    recommendations: [],
    amendment_plan: [],
    long_term_strategy: [],
  };

  // Calculate overall health score
  const nutrientScore = calculateNutrientScore(sampleData);
  const physicalScore = calculatePhysicalScore(field, sampleData);
  analysis.overall_health_score = Math.round((nutrientScore + physicalScore) / 2);

  // Generate recommendations
  analysis.recommendations = generateSoilRecommendations(analysis, field);
  analysis.amendment_plan = generateAmendmentPlan(sampleData, field);
  analysis.long_term_strategy = generateLongTermStrategy(analysis, field);

  return analysis;
}

function generateYieldMap(field: any): any {
  const cropPlans = field.crop_plans || [];
  const yieldData = [];

  // Process historical yield data
  cropPlans.forEach((plan) => {
    if (plan.yield_actual && plan.yield_expected) {
      const yieldRatio = plan.yield_actual / plan.yield_expected;
      yieldData.push({
        year: plan.year,
        season: plan.season,
        crop: plan.crop.name,
        actual_yield: plan.yield_actual,
        expected_yield: plan.yield_expected,
        performance_ratio: yieldRatio,
        efficiency: Math.round(yieldRatio * 100),
      });
    }
  });

  // Calculate yield trends
  const trends = calculateYieldTrends(yieldData);
  const zones = identifyYieldZones(field, yieldData);

  return {
    historical_performance: yieldData,
    yield_trends: trends,
    yield_zones: zones,
    field_characteristics: analyzeFieldCharacteristics(field),
    optimization_opportunities: identifyOptimizationOpportunities(yieldData, field),
  };
}

function generateProductivityReport(field: any): any {
  const cropPlans = field.crop_plans || [];

  // Calculate productivity metrics
  const totalYears = new Set(cropPlans.map((p) => p.year)).size;
  const successfulCrops = cropPlans.filter((p) => p.status === 'completed' && p.yield_actual > 0);
  const avgYield =
    successfulCrops.reduce((sum, p) => sum + (p.yield_actual || 0), 0) / successfulCrops.length ||
    0;

  const report = {
    field_summary: {
      total_area_hectares: field.area_hectares,
      soil_type: field.soil_type,
      years_cultivated: totalYears,
      total_crop_cycles: cropPlans.length,
      success_rate: Math.round((successfulCrops.length / cropPlans.length) * 100),
    },
    yield_analysis: {
      average_yield_per_hectare: Math.round(avgYield),
      best_performing_crop: findBestPerformingCrop(cropPlans),
      yield_consistency: calculateYieldConsistency(cropPlans),
      yield_trend: calculateYieldTrend(cropPlans),
    },
    crop_rotation_analysis: analyzeCropRotation(cropPlans),
    soil_health_trends: analyzeSoilHealthTrends(cropPlans),
    recommendations: generateFieldRecommendations(field, cropPlans),
    economic_analysis: calculateEconomicAnalysis(cropPlans, field.area_hectares),
  };

  return report;
}

// Helper Functions

function analyzeNutrients(sampleData: any): any {
  const nutrients = {
    nitrogen: {
      level: sampleData.nitrogen || 50,
      status: getNutrientStatus(sampleData.nitrogen || 50, 'nitrogen'),
      recommendation: getNutrientRecommendation(sampleData.nitrogen || 50, 'nitrogen'),
    },
    phosphorus: {
      level: sampleData.phosphorus || 30,
      status: getNutrientStatus(sampleData.phosphorus || 30, 'phosphorus'),
      recommendation: getNutrientRecommendation(sampleData.phosphorus || 30, 'phosphorus'),
    },
    potassium: {
      level: sampleData.potassium || 40,
      status: getNutrientStatus(sampleData.potassium || 40, 'potassium'),
      recommendation: getNutrientRecommendation(sampleData.potassium || 40, 'potassium'),
    },
  };

  return nutrients;
}

function analyzePhysicalProperties(field: any, sampleData: any): any {
  return {
    soil_type: {
      current: field.soil_type,
      texture: sampleData.texture || 'medium',
      structure: assessSoilStructure(field.soil_type),
    },
    organic_matter: {
      level: sampleData.organic_matter || 3,
      status: getOrganicMatterStatus(sampleData.organic_matter || 3),
      trend: 'stable', // Would need historical data
    },
    drainage: assessDrainage(field.soil_type),
    water_retention: assessWaterRetention(field.soil_type),
  };
}

function getNutrientStatus(level: number, nutrient: string): string {
  const optimal = {
    nitrogen: { min: 40, max: 80 },
    phosphorus: { min: 25, max: 50 },
    potassium: { min: 30, max: 60 },
  };

  const range = optimal[nutrient as keyof typeof optimal];
  if (level < range.min) return 'deficient';
  if (level > range.max) return 'excessive';
  return 'optimal';
}

function getNutrientRecommendation(level: number, nutrient: string): string {
  const status = getNutrientStatus(level, nutrient);

  if (status === 'deficient') {
    return `Apply ${nutrient}-rich fertilizer`;
  } else if (status === 'excessive') {
    return `Reduce ${nutrient} application`;
  }
  return 'Maintain current levels';
}

function getOrganicMatterStatus(level: number): string {
  if (level < 2) return 'very low';
  if (level < 3) return 'low';
  if (level < 5) return 'adequate';
  return 'high';
}

function assessSoilStructure(soilType: string): string {
  const structures = {
    loam: 'good',
    clay: 'moderate',
    sandy: 'poor',
    silty: 'good',
  };
  return structures[soilType as keyof typeof structures] || 'moderate';
}

function assessDrainage(soilType: string): string {
  const drainage = {
    loam: 'good',
    clay: 'poor',
    sandy: 'excessive',
    silty: 'moderate',
  };
  return drainage[soilType as keyof typeof drainage] || 'moderate';
}

function assessWaterRetention(soilType: string): string {
  const retention = {
    loam: 'good',
    clay: 'excellent',
    sandy: 'poor',
    silty: 'good',
  };
  return retention[soilType as keyof typeof retention] || 'moderate';
}

function calculateNutrientScore(sampleData: any): number {
  const nScore = getNutrientStatus(sampleData.nitrogen || 50, 'nitrogen') === 'optimal' ? 33 : 15;
  const pScore =
    getNutrientStatus(sampleData.phosphorus || 30, 'phosphorus') === 'optimal' ? 33 : 15;
  const kScore = getNutrientStatus(sampleData.potassium || 40, 'potassium') === 'optimal' ? 34 : 15;
  return nScore + pScore + kScore;
}

function calculatePhysicalScore(field: any, sampleData: any): number {
  let score = 50; // Base score

  // Soil type scoring
  const soilScores = { loam: 25, silty: 20, clay: 15, sandy: 10 };
  score += soilScores[field.soil_type as keyof typeof soilScores] || 15;

  // Organic matter scoring
  const omLevel = sampleData.organic_matter || 3;
  if (omLevel >= 5) score += 25;
  else if (omLevel >= 3) score += 15;
  else score += 5;

  return Math.min(score, 100);
}

function generateSoilRecommendations(analysis: any, field: any): string[] {
  const recommendations = [];

  if (analysis.overall_health_score < 60) {
    recommendations.push('Overall soil health needs improvement');
  }

  if (analysis.nutrient_analysis.nitrogen.status !== 'optimal') {
    recommendations.push('Address nitrogen imbalance');
  }

  if (analysis.physical_properties.organic_matter.status === 'low') {
    recommendations.push('Increase organic matter through compost or cover crops');
  }

  if (analysis.physical_properties.drainage === 'poor') {
    recommendations.push('Improve drainage through raised beds or soil amendment');
  }

  return recommendations;
}

function generateAmendmentPlan(sampleData: any, field: any): any[] {
  const amendments = [];

  // Nutrient amendments
  if (sampleData.nitrogen < 40) {
    amendments.push({
      type: 'nitrogen_fertilizer',
      amount: '50-100 kg/ha',
      timing: 'before planting',
      form: 'synthetic or organic',
    });
  }

  if (sampleData.organic_matter < 3) {
    amendments.push({
      type: 'compost',
      amount: '20-30 tons/ha',
      timing: 'fall or early spring',
      method: 'incorporate into soil',
    });
  }

  return amendments;
}

function generateLongTermStrategy(analysis: any, field: any): string[] {
  const strategy = [
    'Implement regular soil testing (every 2-3 years)',
    'Practice crop rotation to maintain soil health',
    'Use cover crops during off-season',
  ];

  if (field.soil_type === 'sandy') {
    strategy.push('Focus on water conservation and organic matter building');
  } else if (field.soil_type === 'clay') {
    strategy.push('Work on improving soil structure and drainage');
  }

  return strategy;
}

function calculateYieldTrends(yieldData: any[]): any {
  if (yieldData.length < 2) return { trend: 'insufficient_data', slope: 0 };

  // Simple linear regression for trend
  const sortedData = yieldData.sort((a, b) => a.year - b.year);
  const n = sortedData.length;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  sortedData.forEach((data, index) => {
    sumX += index;
    sumY += data.efficiency;
    sumXY += index * data.efficiency;
    sumX2 += index * index;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const trend = slope > 5 ? 'improving' : slope < -5 ? 'declining' : 'stable';

  return { trend, slope: Math.round(slope * 10) / 10 };
}

function identifyYieldZones(field: any, yieldData: any[]): any[] {
  // Simplified zone identification based on performance
  const avgEfficiency =
    yieldData.reduce((sum, d) => sum + d.efficiency, 0) / yieldData.length || 100;

  return [
    {
      zone: 'high_productivity',
      efficiency_range: `${Math.round(avgEfficiency * 1.1)}-100%`,
      characteristics: 'Optimal conditions, consistent performance',
      area_percentage: 35,
    },
    {
      zone: 'medium_productivity',
      efficiency_range: `${Math.round(avgEfficiency * 0.8)}-${Math.round(avgEfficiency * 1.1)}%`,
      characteristics: 'Variable performance, moderate conditions',
      area_percentage: 45,
    },
    {
      zone: 'low_productivity',
      efficiency_range: `0-${Math.round(avgEfficiency * 0.8)}%`,
      characteristics: 'Suboptimal conditions, needs improvement',
      area_percentage: 20,
    },
  ];
}

function analyzeFieldCharacteristics(field: any): any {
  return {
    size_classification: classifyFieldSize(field.area_hectares),
    soil_advantages: getSoilAdvantages(field.soil_type),
    soil_challenges: getSoilChallenges(field.soil_type),
    management_complexity:
      field.area_hectares > 10 ? 'high' : field.area_hectares > 5 ? 'medium' : 'low',
  };
}

function identifyOptimizationOpportunities(yieldData: any[], field: any): string[] {
  const opportunities = [];

  const lowPerformingCrops = yieldData.filter((d) => d.efficiency < 80);
  if (lowPerformingCrops.length > 0) {
    opportunities.push('Review crop selection for low-performing varieties');
  }

  const inconsistentYields =
    yieldData.some((d) => d.efficiency < 70) && yieldData.some((d) => d.efficiency > 110);
  if (inconsistentYields) {
    opportunities.push('Investigate yield variability causes');
  }

  opportunities.push('Consider precision agriculture techniques');

  return opportunities;
}

function findBestPerformingCrop(cropPlans: any[]): any {
  const cropYields = {};

  cropPlans.forEach((plan) => {
    if (plan.yield_actual && plan.crop) {
      const cropName = plan.crop.name;
      if (!cropYields[cropName]) {
        cropYields[cropName] = { total: 0, count: 0 };
      }
      cropYields[cropName].total += plan.yield_actual;
      cropYields[cropName].count += 1;
    }
  });

  let bestCrop = null;
  let bestYield = 0;

  Object.entries(cropYields).forEach(([crop, data]) => {
    const avgYield = data.total / data.count;
    if (avgYield > bestYield) {
      bestYield = avgYield;
      bestCrop = { crop, average_yield: Math.round(avgYield) };
    }
  });

  return bestCrop;
}

function calculateYieldConsistency(cropPlans: any[]): string {
  const yields = cropPlans.filter((p) => p.yield_actual).map((p) => p.yield_actual);
  if (yields.length < 2) return 'insufficient_data';

  const avg = yields.reduce((sum, y) => sum + y, 0) / yields.length;
  const variance = yields.reduce((sum, y) => sum + Math.pow(y - avg, 2), 0) / yields.length;
  const stdDev = Math.sqrt(variance);
  const coefficient = (stdDev / avg) * 100;

  if (coefficient < 15) return 'highly_consistent';
  if (coefficient < 25) return 'moderately_consistent';
  return 'variable';
}

function calculateYieldTrend(cropPlans: any[]): string {
  const yearlyYields = {};

  cropPlans.forEach((plan) => {
    if (plan.yield_actual && plan.year) {
      if (!yearlyYields[plan.year]) {
        yearlyYields[plan.year] = [];
      }
      yearlyYields[plan.year].push(plan.yield_actual);
    }
  });

  const years = Object.keys(yearlyYields).sort();
  if (years.length < 2) return 'insufficient_data';

  const avgYields = years.map((year) => {
    const yields = yearlyYields[year];
    return yields.reduce((sum, y) => sum + y, 0) / yields.length;
  });

  const recentAvg =
    avgYields.slice(-3).reduce((sum, y) => sum + y, 0) / Math.min(3, avgYields.length);
  const earlierAvg =
    avgYields.slice(0, -3).reduce((sum, y) => sum + y, 0) / Math.max(1, avgYields.length - 3);

  const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

  if (change > 10) return 'improving';
  if (change < -10) return 'declining';
  return 'stable';
}

function analyzeCropRotation(cropPlans: any[]): any {
  const cropTypes = cropPlans.map((p) => p.crop?.category).filter(Boolean);
  const diversity = new Set(cropTypes).size;

  return {
    crop_diversity_score: Math.min(diversity * 20, 100),
    rotation_frequency: 'annual', // Based on data structure
    rotation_quality: diversity >= 4 ? 'excellent' : diversity >= 3 ? 'good' : 'needs_improvement',
    recommended_rotation: getRecommendedRotation(cropTypes),
  };
}

function analyzeSoilHealthTrends(cropPlans: any[]): any {
  // Simplified analysis - would need historical soil data
  return {
    organic_matter_trend: 'stable',
    nutrient_trend: 'stable',
    overall_trend: 'maintaining',
    monitoring_needed: true,
  };
}

function generateFieldRecommendations(field: any, cropPlans: any[]): string[] {
  const recommendations = [];

  if (field.soil_type === 'sandy') {
    recommendations.push('Focus on water retention and organic matter building');
  }

  if (cropPlans.length < 3) {
    recommendations.push('Implement more diverse crop rotation');
  }

  recommendations.push('Regular soil testing recommended');
  recommendations.push('Consider cover crops during off-season');

  return recommendations;
}

function calculateEconomicAnalysis(cropPlans: any[], area: number): any {
  const totalYield = cropPlans.reduce((sum, p) => sum + (p.yield_actual || 0), 0);
  const avgYieldPerHa = totalYield / (cropPlans.length || 1) / area;

  return {
    average_yield_per_hectare: Math.round(avgYieldPerHa),
    total_production: Math.round(totalYield),
    land_utilization: cropPlans.length > 0 ? 'active' : 'idle',
    productivity_rating: avgYieldPerHa > 5000 ? 'high' : avgYieldPerHa > 3000 ? 'medium' : 'low',
  };
}

function classifyFieldSize(area: number): string {
  if (area < 2) return 'small';
  if (area < 10) return 'medium';
  if (area < 50) return 'large';
  return 'very_large';
}

function getSoilAdvantages(soilType: string): string[] {
  const advantages = {
    loam: ['Balanced drainage and retention', 'Good fertility', 'Easy to work'],
    clay: ['High nutrient retention', 'Good water holding capacity'],
    sandy: ['Excellent drainage', 'Early warming', 'Easy to cultivate'],
    silty: ['Good fertility', 'Moderate drainage', 'Good moisture retention'],
  };
  return advantages[soilType as keyof typeof advantages] || ['Moderate characteristics'];
}

function getSoilChallenges(soilType: string): string[] {
  const challenges = {
    loam: ['Can compact easily', 'May need regular organic matter'],
    clay: ['Poor drainage', 'Slow warming', 'Can be hard to work'],
    sandy: ['Low fertility', 'Poor water retention', 'Leaching of nutrients'],
    silty: ['Can crust', 'Erosion prone', 'Compaction risk'],
  };
  return challenges[soilType as keyof typeof challenges] || ['Some management challenges'];
}

function getRecommendedRotation(currentCrops: string[]): string[] {
  const cropFamilies = ['legumes', 'grasses', 'brassicas', 'solanaceae', 'root'];
  return cropFamilies.filter((family) => !currentCrops.includes(family));
}
