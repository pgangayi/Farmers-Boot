/**
 * ============================================================================
 * CROPS EDGE FUNCTION
 * ============================================================================
 * Handles crop-related requests
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
import { validate, commonRules, validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';
import { createAuditLoggerFromRequest } from '../_shared/audit.ts';

export async function handleCropsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/crops', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Crops request: ${method} ${path}`);

  try {
    // Route to appropriate handler
    if (path === '' && method === 'GET') {
      return await handleGetCrops(req, url, requestId);
    } else if (path === '' && method === 'POST') {
      return await handleCreateCrop(req, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const cropId = path.substring(1);
      return await handleGetCrop(req, cropId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'PATCH') {
      const cropId = path.substring(1);
      return await handleUpdateCrop(req, cropId, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'DELETE') {
      const cropId = path.substring(1);
      return await handleDeleteCrop(req, cropId, requestId);
    } else if (path === '/growth-stages' && method === 'GET') {
      return await handleGetGrowthStages(req, url, requestId);
    } else if (path === '/varieties' && method === 'GET') {
      return await handleGetVarieties(req, url, requestId);
    } else if (path.match(/^\/[^\/]+\/planting-guide$/) && method === 'GET') {
      const cropId = path.substring(1, path.lastIndexOf('/planting-guide'));
      return await handlePlantingGuide(req, cropId, requestId);
    } else if (path.match(/^\/[^\/]+\/harvest-prediction$/) && method === 'POST') {
      const cropId = path.substring(1, path.lastIndexOf('/harvest-prediction'));
      return await handleHarvestPrediction(req, cropId, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Crops endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

// Get all crops
async function handleGetCrops(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  // Build query
  let query = supabase
    .from('crops')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Apply filters
  const search = url.searchParams.get('search');
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,scientific_name.ilike.%${search}%,variety.ilike.%${search}%`
    );
  }

  const season = url.searchParams.get('season');
  if (season) {
    // Filter crops suitable for this season
    query = query.contains('metadata', { suitable_seasons: [season] });
  }

  // Get total count
  const { count, error: countError } = await query;

  if (countError) {
    throw new Error('Failed to count crops');
  }

  // Get paginated results
  const { data: crops, error } = await query.range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error('Failed to fetch crops');
  }

  return createPaginatedResponse(crops || [], page, pageSize, count || 0);
}

// Get single crop
async function handleGetCrop(req: Request, cropId: string, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  const { data: crop, error } = await supabase.from('crops').select('*').eq('id', cropId).single();

  if (error || !crop) {
    throw new NotFoundError('Crop not found');
  }

  return createSuccessResponse(crop);
}

// Create crop
async function handleCreateCrop(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    throw new AuthenticationError('No authorization header');
  }

  const user = await getUserFromAuth(authHeader);

  if (!user) {
    throw new AuthenticationError('Invalid token');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new AuthenticationError('Only admins can create crops');
  }

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'scientific_name', required: false, type: 'string', maxLength: 200 },
    { field: 'variety', required: false, type: 'string', maxLength: 100 },
    { field: 'description', required: false, type: 'string', maxLength: 1000 },
    { field: 'growing_season_days', required: false, type: 'number', min: 1 },
    { field: 'optimal_temp_min', required: false, type: 'number' },
    { field: 'optimal_temp_max', required: false, type: 'number' },
    { field: 'water_requirement_mm', required: false, type: 'number', min: 0 },
    { field: 'planting_depth_cm', required: false, type: 'number', min: 0 },
    { field: 'spacing_cm', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { data: crop, error } = await supabase
    .from('crops')
    .insert({
      name: body.name,
      scientific_name: body.scientific_name,
      variety: body.variety,
      description: body.description,
      growing_season_days: body.growing_season_days,
      optimal_temp_min: body.optimal_temp_min,
      optimal_temp_max: body.optimal_temp_max,
      water_requirement_mm: body.water_requirement_mm,
      planting_depth_cm: body.planting_depth_cm,
      spacing_cm: body.spacing_cm,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create crop');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logCreate('crops', crop.id, crop);

  logger.info(`Crop created: ${crop.id}`);

  return createSuccessResponse(crop, 201);
}

// Update crop
async function handleUpdateCrop(
  req: Request,
  cropId: string,
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

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new AuthenticationError('Only admins can update crops');
  }

  // Get current crop data
  const { data: currentCrop, error: fetchError } = await supabase
    .from('crops')
    .select('*')
    .eq('id', cropId)
    .single();

  if (fetchError || !currentCrop) {
    throw new NotFoundError('Crop not found');
  }

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'scientific_name', required: false, type: 'string', maxLength: 200 },
    { field: 'variety', required: false, type: 'string', maxLength: 100 },
    { field: 'description', required: false, type: 'string', maxLength: 1000 },
    { field: 'growing_season_days', required: false, type: 'number', min: 1 },
    { field: 'optimal_temp_min', required: false, type: 'number' },
    { field: 'optimal_temp_max', required: false, type: 'number' },
    { field: 'water_requirement_mm', required: false, type: 'number', min: 0 },
    { field: 'planting_depth_cm', required: false, type: 'number', min: 0 },
    { field: 'spacing_cm', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const { data: crop, error } = await supabase
    .from('crops')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cropId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update crop');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logUpdate('crops', cropId, currentCrop, crop);

  logger.info(`Crop updated: ${cropId}`);

  return createSuccessResponse(crop);
}

// Delete crop
async function handleDeleteCrop(
  req: Request,
  cropId: string,
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

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new AuthenticationError('Only admins can delete crops');
  }

  // Get current crop data
  const { data: currentCrop, error: fetchError } = await supabase
    .from('crops')
    .select('*')
    .eq('id', cropId)
    .single();

  if (fetchError || !currentCrop) {
    throw new NotFoundError('Crop not found');
  }

  // Soft delete
  const { error } = await supabase
    .from('crops')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cropId);

  if (error) {
    throw new Error('Failed to delete crop');
  }

  // Log audit event
  const auditLogger = createAuditLoggerFromRequest(req, user.id);
  await auditLogger.logDelete('crops', cropId, currentCrop);

  logger.info(`Crop deleted: ${cropId}`);

  return createSuccessResponse({ message: 'Crop deleted successfully' });
}

// Enhanced Crop Management Functions

async function handleGetGrowthStages(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const cropId = url.searchParams.get('crop_id');
  const category = url.searchParams.get('category');

  let query = supabase
    .from('growth_stages')
    .select('*')
    .order('days_after_planting', { ascending: true });

  if (cropId) query = query.eq('crop_id', cropId);
  if (category) query = query.eq('category', category);

  const { data: growthStages, error } = await query;

  if (error) throw new Error('Failed to fetch growth stages');

  return createSuccessResponse(growthStages || []);
}

async function handleGetVarieties(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const cropId = url.searchParams.get('crop_id');
  const climateZone = url.searchParams.get('climate_zone');
  const purpose = url.searchParams.get('purpose'); // 'commercial', 'home_garden', 'organic'

  let query = supabase
    .from('crop_varieties')
    .select(
      `
      *,
      crop:crops(id, name)
    `
    )
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (cropId) query = query.eq('crop_id', cropId);
  if (climateZone) query = query.contains('suitable_climates', [climateZone]);
  if (purpose) query = query.eq('best_for', purpose);

  const { data: varieties, error } = await query;

  if (error) throw new Error('Failed to fetch varieties');

  return createSuccessResponse(varieties || []);
}

async function handlePlantingGuide(
  req: Request,
  cropId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  // Get crop data
  const { data: crop, error: cropError } = await supabase
    .from('crops')
    .select('*')
    .eq('id', cropId)
    .single();

  if (cropError || !crop) throw new NotFoundError('Crop not found');

  // Get growth stages
  const { data: growthStages, error: stagesError } = await supabase
    .from('growth_stages')
    .select('*')
    .eq('crop_id', cropId)
    .order('days_after_planting', { ascending: true });

  if (stagesError) throw new Error('Failed to fetch growth stages');

  const plantingGuide = generatePlantingGuide(crop, growthStages || []);

  logger.info(`Planting guide generated for crop: ${cropId}`);
  return createSuccessResponse({
    crop: crop.name,
    planting_guide: plantingGuide,
  });
}

async function handleHarvestPrediction(
  req: Request,
  cropId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'field_id', required: true, type: 'uuid' },
    { field: 'planting_date', required: true, type: 'date' },
    { field: 'area_hectares', required: true, type: 'number', min: 0 },
    { field: 'soil_quality_score', required: false, type: 'number', min: 1, max: 10 },
    { field: 'weather_conditions', required: false, type: 'string' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get crop and field data
  const { data: crop } = await supabase.from('crops').select('*').eq('id', cropId).single();

  const { data: field } = await supabase
    .from('fields')
    .select('*')
    .eq('id', body.field_id)
    .single();

  if (!crop || !field) throw new NotFoundError('Crop or field not found');

  const prediction = generateHarvestPrediction(crop, field, body);

  logger.info(`Harvest prediction generated for crop: ${cropId}`);
  return createSuccessResponse({
    crop: crop.name,
    field: field.name,
    prediction,
  });
}

// Enhanced Algorithm Functions

function generatePlantingGuide(crop: any, growthStages: any[]): any {
  const guide = {
    overview: {
      planting_season: getOptimalPlantingSeason(crop),
      soil_temperature: getSoilTemperatureRange(crop),
      soil_ph: crop.metadata?.optimal_ph || { min: 6.0, max: 7.5 },
      spacing: `${crop.spacing_cm} cm between plants`,
      depth: `${crop.planting_depth_cm || 2} cm deep`,
    },
    preparation: {
      soil_preparation: getSoilPreparationSteps(crop),
      fertilizer_requirements: getFertilizerRequirements(crop),
      seed_treatment: getSeedTreatmentRecommendations(crop),
    },
    planting_schedule: generatePlantingSchedule(crop, growthStages),
    care_instructions: {
      watering: getWateringInstructions(crop),
      fertilizing: getFertilizingSchedule(crop),
      pest_control: getPestControlRecommendations(crop),
      weed_management: getWeedManagementStrategy(crop),
    },
    growth_timeline: growthStages.map((stage) => ({
      stage: stage.name,
      days_after_planting: stage.days_after_planting,
      duration_days: stage.duration_days,
      description: stage.description,
      care_requirements: stage.care_requirements,
      visual_indicators: stage.visual_indicators,
    })),
    harvest_information: {
      estimated_days_to_maturity: crop.growing_season_days,
      harvest_indicators: getHarvestIndicators(crop.name),
      yield_expectations: getYieldExpectations(crop),
      post_harvest_handling: getPostHarvestHandling(crop.category),
    },
  };

  return guide;
}

function generateHarvestPrediction(crop: any, field: any, inputData: any): any {
  const baseYield = crop.expected_yield_kg_per_hectare || 5000;
  const area = inputData.area_hectares;

  // Calculate yield modifiers
  let yieldModifier = 1.0;
  const factors = [];

  // Soil quality impact
  const soilQuality = inputData.soil_quality_score || calculateSoilQualityScore(field);
  const soilImpact = (soilQuality / 10) * 0.3 + 0.7; // 30% variance based on soil
  yieldModifier *= soilImpact;
  factors.push(
    `Soil quality score ${soilQuality}/10: ${Math.round((soilImpact - 1) * 100)}% impact`
  );

  // Weather conditions impact
  if (inputData.weather_conditions) {
    const weatherImpact = getWeatherImpact(inputData.weather_conditions, crop);
    yieldModifier *= weatherImpact;
    factors.push(`Weather conditions: ${Math.round((weatherImpact - 1) * 100)}% impact`);
  }

  // Field size efficiency (larger fields often have better efficiency)
  const sizeEfficiency = area > 10 ? 1.05 : area > 5 ? 1.02 : 1.0;
  yieldModifier *= sizeEfficiency;
  if (sizeEfficiency > 1.0) {
    factors.push(`Field size efficiency: +${Math.round((sizeEfficiency - 1) * 100)}%`);
  }

  // Variety adjustment
  if (crop.variety?.toLowerCase().includes('high_yield')) {
    yieldModifier *= 1.15;
    factors.push('High-yield variety: +15%');
  } else if (crop.variety?.toLowerCase().includes('dwarf')) {
    yieldModifier *= 0.9;
    factors.push('Dwarf variety: -10%');
  }

  // Calculate predictions
  const predictedYieldPerHectare = baseYield * yieldModifier;
  const totalPredictedYield = predictedYieldPerHectare * area;

  // Add confidence intervals
  const confidence = calculatePredictionConfidence(soilQuality, inputData.weather_conditions);
  const variance = confidence === 'high' ? 0.1 : confidence === 'medium' ? 0.2 : 0.3;

  return {
    yield_predictions: {
      per_hectare: {
        low: Math.round(predictedYieldPerHectare * (1 - variance)),
        expected: Math.round(predictedYieldPerHectare),
        high: Math.round(predictedYieldPerHectare * (1 + variance)),
      },
      total: {
        low: Math.round(totalPredictedYield * (1 - variance)),
        expected: Math.round(totalPredictedYield),
        high: Math.round(totalPredictedYield * (1 + variance)),
      },
    },
    harvest_timeline: {
      planting_date: inputData.planting_date,
      earliest_harvest: addDaysToDate(inputData.planting_date, crop.growing_season_days * 0.9),
      optimal_harvest: addDaysToDate(inputData.planting_date, crop.growing_season_days),
      latest_harvest: addDaysToDate(inputData.planting_date, crop.growing_season_days * 1.1),
    },
    quality_factors: {
      overall_score: Math.round(yieldModifier * 100),
      contributing_factors: factors,
      confidence_level: confidence,
    },
    recommendations: getHarvestRecommendations(crop, field, yieldModifier),
  };
}

// Helper Functions

function getOptimalPlantingSeason(crop: any): string[] {
  const seasons = crop.metadata?.suitable_seasons || ['spring', 'summer'];
  return seasons;
}

function getSoilTemperatureRange(crop: any): { min: number; max: number } {
  const tempMin = crop.optimal_temp_min || 15;
  const tempMax = crop.optimal_temp_max || 25;
  return { min: tempMin - 2, max: tempMax + 2 }; // Soil temp usually lower than air temp
}

function getSoilPreparationSteps(crop: any): string[] {
  const steps = [
    'Clear field of weeds and debris',
    'Test soil pH and nutrient levels',
    'Incorporate organic matter (compost or well-rotted manure)',
    'Till soil to depth of 20-30 cm',
    'Create raised beds if drainage is poor',
  ];

  if (crop.category === 'root') {
    steps.push('Remove rocks and break up soil clumps for root development');
  }

  if (crop.category === 'legumes') {
    steps.push('Inoculate seeds with rhizobium bacteria if needed');
  }

  return steps;
}

function getFertilizerRequirements(crop: any): any {
  return {
    nitrogen:
      crop.category === 'legumes' ? 'Low (legumes fix their own nitrogen)' : 'Medium to high',
    phosphorus: 'Medium - important for root development',
    potassium: 'Medium to high - for overall plant health',
    organic_matter: 'High - improves soil structure and water retention',
    application_timing: 'Base fertilizer before planting, side-dress during growth',
  };
}

function getSeedTreatmentRecommendations(crop: any): string[] {
  const recommendations = [
    'Select high-quality, disease-free seeds',
    'Test germination rate before planting',
  ];

  if (crop.category === 'grains') {
    recommendations.push('Consider fungicide treatment for damping off prevention');
  }

  if (crop.category === 'vegetables') {
    recommendations.push('Soak seeds overnight for faster germination (if applicable)');
  }

  return recommendations;
}

function generatePlantingSchedule(crop: any, growthStages: any[]): any[] {
  const schedule = [];
  const plantingDate = new Date();

  // Add planting date
  schedule.push({
    activity: 'Planting',
    date: plantingDate.toISOString().split('T')[0],
    days_from_start: 0,
    importance: 'critical',
    notes: 'Optimal planting conditions',
  });

  // Add key growth stages
  growthStages.forEach((stage) => {
    const stageDate = new Date(plantingDate);
    stageDate.setDate(stageDate.getDate() + stage.days_after_planting);

    schedule.push({
      activity: stage.name,
      date: stageDate.toISOString().split('T')[0],
      days_from_start: stage.days_after_planting,
      importance: stage.importance || 'medium',
      notes: stage.description,
    });
  });

  // Add expected harvest date
  const harvestDate = new Date(plantingDate);
  harvestDate.setDate(harvestDate.getDate() + crop.growing_season_days);

  schedule.push({
    activity: 'Harvest',
    date: harvestDate.toISOString().split('T')[0],
    days_from_start: crop.growing_season_days,
    importance: 'critical',
    notes: 'Expected harvest window',
  });

  return schedule;
}

function getWateringInstructions(crop: any): any {
  const waterRequirement = crop.water_requirement_mm || 25;

  return {
    frequency: waterRequirement > 30 ? 'Daily during hot weather' : '2-3 times per week',
    amount: `${waterRequirement}mm per week`,
    timing: 'Early morning or late evening to reduce evaporation',
    special_considerations: getWateringSpecialConsiderations(crop),
  };
}

function getWateringSpecialConsiderations(crop: any): string[] {
  const considerations = [];

  if (crop.category === 'root') {
    considerations.push('Consistent moisture important for root development');
  }

  if (crop.category === 'fruits') {
    considerations.push('Reduce watering as fruit ripens to concentrate flavor');
  }

  if (crop.category === 'leafy_greens') {
    considerations.push('Shallow, frequent watering to prevent bolting');
  }

  return considerations;
}

function getFertilizingSchedule(crop: any): any[] {
  const schedule = [
    {
      stage: 'Planting',
      fertilizer_type: 'Balanced NPK or compost',
      application_rate: 'Base application',
      timing: 'Incorporate into soil before planting',
    },
  ];

  if (crop.category !== 'legumes') {
    schedule.push({
      stage: 'Early Growth',
      fertilizer_type: 'Nitrogen-rich',
      application_rate: 'Side-dress application',
      timing: '2-3 weeks after planting',
    });
  }

  schedule.push({
    stage: 'Flowering/Fruiting',
    fertilizer_type: 'Phosphorus and potassium rich',
    application_rate: 'Light application',
    timing: 'When flowers/fruit set appears',
  });

  return schedule;
}

function getPestControlRecommendations(crop: any): any {
  return {
    common_pests: getCommonPests(crop),
    prevention_methods: [
      'Crop rotation',
      'Companion planting',
      'Proper spacing for air circulation',
      'Regular monitoring',
    ],
    organic_treatments: [
      'Neem oil',
      'Insecticidal soap',
      'Beneficial insects release',
      'Row covers',
    ],
    monitoring_frequency: 'Weekly inspection recommended',
  };
}

function getCommonPests(crop: any): string[] {
  const pestMap = {
    tomatoes: ['Aphids', 'Tomato hornworm', 'Whiteflies', 'Spider mites'],
    corn: ['Corn earworm', 'European corn borer', 'Aphids', 'Cutworms'],
    wheat: ['Aphids', 'Hessian fly', 'Armyworms', 'Sawflies'],
    potatoes: ['Colorado potato beetle', 'Aphids', 'Potato tuberworm', 'Flea beetles'],
  };

  return (
    pestMap[crop.name?.toLowerCase() as keyof typeof pestMap] || [
      'Aphids',
      'Cutworms',
      'Spider mites',
      'General garden pests',
    ]
  );
}

function getWeedManagementStrategy(crop: any): any {
  return {
    prevention: ['Mulching', 'Proper plant spacing', 'Pre-emergent herbicide (if conventional)'],
    mechanical_methods: ['Hand weeding', 'Hoeing', 'Cultivation'],
    timing: 'Critical during first 4-6 weeks after planting',
    organic_alternatives: ['Corn gluten meal', 'Vinegar-based herbicides', 'Flame weeding'],
  };
}

function getYieldExpectations(crop: any): any {
  const baseYield = crop.expected_yield_kg_per_hectare || 5000;

  return {
    typical_range: {
      poor: Math.round(baseYield * 0.6),
      average: Math.round(baseYield),
      excellent: Math.round(baseYield * 1.4),
    },
    factors_affecting_yield: [
      'Weather conditions',
      'Soil fertility',
      'Pest and disease pressure',
      'Water availability',
      'Planting density',
    ],
    unit: 'kg per hectare',
  };
}

function calculateSoilQualityScore(field: any): number {
  let score = 5; // Base score

  // Soil type scoring
  const soilScores = { loam: 9, silty: 8, clay: 6, sandy: 5 };
  score = soilScores[field.soil_type as keyof typeof soilScores] || 5;

  // pH adjustment
  if (field.soil_ph >= 6.0 && field.soil_ph <= 7.5) {
    score += 1;
  } else if (field.soil_ph >= 5.5 && field.soil_ph <= 8.0) {
    score += 0.5;
  }

  return Math.min(Math.round(score), 10);
}

function getWeatherImpact(weatherConditions: string, crop: any): number {
  const impacts = {
    optimal: 1.1,
    good: 1.0,
    average: 0.9,
    poor: 0.7,
    drought: 0.5,
    excessive_rain: 0.6,
  };

  return impacts[weatherConditions.toLowerCase() as keyof typeof impacts] || 1.0;
}

function calculatePredictionConfidence(soilQuality: number, weatherConditions?: string): string {
  let confidence = 'medium';

  if (soilQuality >= 8 && weatherConditions === 'optimal') {
    confidence = 'high';
  } else if (soilQuality < 5 || weatherConditions === 'poor' || weatherConditions === 'drought') {
    confidence = 'low';
  }

  return confidence;
}

function addDaysToDate(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + Math.round(days));
  return date.toISOString().split('T')[0];
}

function getHarvestRecommendations(crop: any, field: any, yieldModifier: number): string[] {
  const recommendations = [];

  if (yieldModifier < 0.8) {
    recommendations.push('Consider soil amendment for next season');
    recommendations.push('Monitor for nutrient deficiencies');
  }

  if (yieldModifier > 1.2) {
    recommendations.push('Document successful practices for future reference');
    recommendations.push('Consider expanding similar crops next season');
  }

  recommendations.push('Plan post-harvest soil preparation');
  recommendations.push('Record actual yields for future predictions');

  if (crop.category === 'grains') {
    recommendations.push('Plan for proper drying and storage facilities');
  }

  return recommendations;
}
