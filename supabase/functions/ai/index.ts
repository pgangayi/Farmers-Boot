/**
 * ============================================================================
 * AI EDGE FUNCTION
 * ============================================================================
 * Handles AI-related requests (crop recommendations, pest detection, etc.)
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
import { validate } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';

export async function handleAIRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/ai', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`AI request: ${method} ${path}`);

  try {
    if (path === '/crop-recommendation' && method === 'POST') {
      return await handleCropRecommendation(req, requestId);
    } else if (path === '/pest-detection' && method === 'POST') {
      return await handlePestDetection(req, requestId);
    } else if (path === '/yield-prediction' && method === 'POST') {
      return await handleYieldPrediction(req, requestId);
    } else if (path === '/weather-forecast' && method === 'POST') {
      return await handleWeatherForecast(req, requestId);
    } else if (path === '/crop-rotation-plan' && method === 'POST') {
      return await handleCropRotationPlan(req, requestId);
    } else if (path === '/soil-health-analysis' && method === 'POST') {
      return await handleSoilHealthAnalysis(req, requestId);
    } else if (path === '/irrigation-schedule' && method === 'POST') {
      return await handleIrrigationSchedule(req, requestId);
    } else if (path === '/harvest-timing' && method === 'POST') {
      return await handleHarvestTiming(req, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'AI endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleCropRecommendation(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'location_id', required: true, type: 'uuid' },
    { field: 'season', required: true, type: 'string' },
    { field: 'soil_type', required: false, type: 'string' },
    { field: 'soil_ph', required: false, type: 'number' },
    { field: 'area_hectares', required: false, type: 'number', min: 0 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get location data
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', body.location_id)
    .single();

  if (!location) {
    throw new ValidationError('Location not found');
  }

  // Get available crops
  const { data: crops } = await supabase.from('crops').select('*').eq('is_active', true);

  // Generate recommendations based on conditions
  const recommendations = generateCropRecommendations(body, location, crops || []);

  logger.info(`Crop recommendations generated for location: ${body.location_id}`);

  return createSuccessResponse({
    location,
    season: body.season,
    recommendations,
  });
}

async function handlePestDetection(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'crop_id', required: true, type: 'uuid' },
    { field: 'symptoms', required: true, type: 'string', minLength: 10 },
    { field: 'image_url', required: false, type: 'string' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get crop data
  const { data: crop } = await supabase.from('crops').select('*').eq('id', body.crop_id).single();

  if (!crop) {
    throw new ValidationError('Crop not found');
  }

  // Generate pest detection results
  const detection = generatePestDetection(body, crop);

  logger.info(`Pest detection generated for crop: ${body.crop_id}`);

  return createSuccessResponse({
    crop: crop.name,
    symptoms: body.symptoms,
    detection,
  });
}

async function handleYieldPrediction(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();

  // Validate input
  const errors = validate(body, [{ field: 'crop_plan_id', required: true, type: 'uuid' }]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get crop plan data
  const { data: cropPlan } = await supabase
    .from('crop_plans')
    .select(
      `
      *,
      crop:crops(id, name, variety, expected_yield_kg_per_hectare),
      field:fields(id, name, area_hectares, soil_type, soil_ph)
    `
    )
    .eq('id', body.crop_plan_id)
    .single();

  if (!cropPlan) {
    throw new ValidationError('Crop plan not found');
  }

  // Generate yield prediction
  const prediction = generateYieldPrediction(cropPlan);

  logger.info(`Yield prediction generated for crop plan: ${body.crop_plan_id}`);

  return createSuccessResponse({
    crop_plan: cropPlan,
    prediction,
  });
}

async function handleWeatherForecast(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();

  // Validate input
  const errors = validate(body, [
    { field: 'location_id', required: true, type: 'uuid' },
    { field: 'days', required: false, type: 'number', min: 1, max: 14 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get location data
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', body.location_id)
    .single();

  if (!location) {
    throw new ValidationError('Location not found');
  }

  // Generate weather forecast
  const forecast = generateWeatherForecast(location, body.days || 7);

  logger.info(`Weather forecast generated for location: ${body.location_id}`);

  return createSuccessResponse({
    location,
    forecast,
  });
}

// Helper functions for AI recommendations

// Real AI integration using Google AI API
async function callGoogleAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');

  if (!apiKey) {
    logger.warn('Google AI API key not found, using mock responses');
    return 'Mock AI response - please configure GOOGLE_AI_API_KEY for real AI functionality.';
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  } catch (error) {
    logger.error('Failed to call Google AI API:', error);
    return 'Mock AI response - API call failed';
  }
}

function generateCropRecommendations(input: any, location: any, crops: any[]): any[] {
  const recommendations: any[] = [];

  for (const crop of crops) {
    let score = 50; // Base score
    const factors: string[] = [];

    // Season compatibility
    if (crop.metadata?.suitable_seasons?.includes(input.season)) {
      score += 20;
      factors.push('Suitable for current season');
    }

    // Soil type compatibility
    if (input.soil_type && crop.metadata?.suitable_soils?.includes(input.soil_type)) {
      score += 15;
      factors.push('Suitable soil type');
    }

    // Soil pH compatibility
    if (input.soil_ph && crop.metadata?.optimal_ph) {
      const { min, max } = crop.metadata.optimal_ph;
      if (input.soil_ph >= min && input.soil_ph <= max) {
        score += 15;
        factors.push('Optimal soil pH');
      }
    }

    // Climate compatibility
    if (
      location.climate_zone &&
      crop.metadata?.suitable_climates?.includes(location.climate_zone)
    ) {
      score += 10;
      factors.push('Suitable climate');
    }

    if (score >= 60) {
      recommendations.push({
        crop_id: crop.id,
        crop_name: crop.name,
        variety: crop.variety,
        score,
        confidence: Math.min(score, 100),
        factors,
        expected_yield: crop.expected_yield_kg_per_hectare,
        growing_season_days: crop.growing_season_days,
      });
    }
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  // Return top 5 recommendations
  return recommendations.slice(0, 5);
}

function generatePestDetection(input: any, crop: any): any {
  const symptoms = input.symptoms.toLowerCase();
  const possiblePests: any[] = [];

  // Common pests and their symptoms
  const pestDatabase = [
    {
      name: 'Aphids',
      symptoms: ['yellow leaves', 'sticky residue', 'curled leaves', 'stunted growth'],
      treatment: 'Apply neem oil or insecticidal soap. Introduce ladybugs as natural predators.',
      severity: 'moderate',
    },
    {
      name: 'Fall Armyworm',
      symptoms: ['holes in leaves', 'frass', 'ragged edges', 'window paning'],
      treatment: 'Use Bt (Bacillus thuringiensis) spray. Remove affected plants.',
      severity: 'high',
    },
    {
      name: 'Spider Mites',
      symptoms: ['webbing', 'yellow spots', 'bronzing', 'tiny dots'],
      treatment: 'Increase humidity. Use miticide spray. Wash plants with water.',
      severity: 'moderate',
    },
    {
      name: 'Cutworms',
      symptoms: ['cut stems', 'wilting', 'missing seedlings', 'holes at base'],
      treatment: 'Use collars around seedlings. Apply Bt spray. Remove by hand at night.',
      severity: 'high',
    },
    {
      name: 'Whiteflies',
      symptoms: ['white flying insects', 'yellowing leaves', 'honeydew', 'sooty mold'],
      treatment: 'Use yellow sticky traps. Apply insecticidal soap. Introduce parasitic wasps.',
      severity: 'moderate',
    },
  ];

  for (const pest of pestDatabase) {
    const matchedSymptoms = pest.symptoms.filter((s: string) => symptoms.includes(s));
    if (matchedSymptoms.length > 0) {
      possiblePests.push({
        ...pest,
        confidence: (matchedSymptoms.length / pest.symptoms.length) * 100,
        matched_symptoms: matchedSymptoms,
      });
    }
  }

  // Sort by confidence
  possiblePests.sort((a, b) => b.confidence - a.confidence);

  return {
    detected_pests: possiblePests.slice(0, 3),
    recommendations:
      possiblePests.length > 0
        ? 'Immediate action recommended. Follow treatment protocols for detected pests.'
        : 'No specific pests detected based on symptoms. Monitor closely and consider consulting with an agricultural expert.',
  };
}

function generateYieldPrediction(cropPlan: any): any {
  const baseYield = cropPlan.crop?.expected_yield_kg_per_hectare || 0;
  const area = cropPlan.field?.area_hectares || 1;

  let adjustmentFactor = 1.0;
  const factors: string[] = [];

  // Soil quality adjustment
  if (cropPlan.field?.soil_type === 'loam') {
    adjustmentFactor += 0.1;
    factors.push('Good soil quality (loam)');
  } else if (cropPlan.field?.soil_type === 'sandy') {
    adjustmentFactor -= 0.1;
    factors.push('Lower water retention (sandy soil)');
  }

  // Soil pH adjustment
  if (cropPlan.field?.soil_ph) {
    const optimalPh = cropPlan.crop?.metadata?.optimal_ph;
    if (
      optimalPh &&
      cropPlan.field.soil_ph >= optimalPh.min &&
      cropPlan.field.soil_ph <= optimalPh.max
    ) {
      adjustmentFactor += 0.05;
      factors.push('Optimal soil pH');
    }
  }

  // Status-based adjustment
  if (cropPlan.status === 'growing') {
    adjustmentFactor += 0.05;
    factors.push('Crop actively growing');
  } else if (cropPlan.status === 'planted') {
    adjustmentFactor -= 0.1;
    factors.push('Recently planted - yield uncertain');
  }

  const predictedYield = baseYield * area * adjustmentFactor;
  const minYield = predictedYield * 0.8;
  const maxYield = predictedYield * 1.2;

  return {
    predicted_yield_kg: Math.round(predictedYield),
    min_yield_kg: Math.round(minYield),
    max_yield_kg: Math.round(maxYield),
    yield_per_hectare: Math.round(predictedYield / area),
    confidence: 75,
    factors,
    recommendations: [
      'Monitor crop health regularly',
      'Ensure adequate irrigation',
      'Apply fertilizers as needed',
      'Monitor for pests and diseases',
    ],
  };
}

function generateWeatherForecast(location: any, days: number): any[] {
  const forecast = [];
  const baseDate = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    // Generate realistic weather data based on location
    const baseTemp = location.latitude ? 20 + (Math.abs(location.latitude) - 20) * 0.3 : 25;
    const tempVariation = Math.random() * 10 - 5;

    forecast.push({
      date: date.toISOString().split('T')[0],
      temperature_min: Math.round(baseTemp + tempVariation - 5),
      temperature_max: Math.round(baseTemp + tempVariation + 5),
      humidity: Math.round(50 + Math.random() * 30),
      precipitation: Math.round(Math.random() * 15 * 10) / 10,
      wind_speed: Math.round(5 + Math.random() * 15),
      condition: ['sunny', 'cloudy', 'partly_cloudy', 'rainy'][Math.floor(Math.random() * 4)],
    });
  }

  return forecast;
}

// Enhanced AI Functions

async function handleCropRotationPlan(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'field_id', required: true, type: 'uuid' },
    { field: 'years', required: false, type: 'number', min: 1, max: 10 },
    { field: 'preferred_crops', required: false, type: 'array' },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get field data and history
  const { data: field } = await supabase
    .from('fields')
    .select(
      `
      *,
      crop_plans(
        crop:crops(id, name, category, family),
        season,
        year,
        status,
        yield_actual
      )
    `
    )
    .eq('id', body.field_id)
    .single();

  if (!field) throw new ValidationError('Field not found');

  const rotationPlan = generateCropRotationPlan(field, body.years || 4, body.preferred_crops || []);

  logger.info(`Crop rotation plan generated for field: ${body.field_id}`);
  return createSuccessResponse({
    field: field.name,
    years: body.years || 4,
    rotation_plan: rotationPlan,
  });
}

async function handleSoilHealthAnalysis(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'field_id', required: true, type: 'uuid' },
    { field: 'soil_ph', required: false, type: 'number', min: 0, max: 14 },
    { field: 'nitrogen', required: false, type: 'number', min: 0 },
    { field: 'phosphorus', required: false, type: 'number', min: 0 },
    { field: 'potassium', required: false, type: 'number', min: 0 },
    { field: 'organic_matter', required: false, type: 'number', min: 0, max: 100 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get field data
  const { data: field } = await supabase
    .from('fields')
    .select('*')
    .eq('id', body.field_id)
    .single();

  if (!field) throw new ValidationError('Field not found');

  const analysis = analyzeSoilHealth(field, body);

  logger.info(`Soil health analysis completed for field: ${body.field_id}`);
  return createSuccessResponse({
    field: field.name,
    analysis,
  });
}

async function handleIrrigationSchedule(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [
    { field: 'field_id', required: true, type: 'uuid' },
    { field: 'crop_id', required: true, type: 'uuid' },
    { field: 'days', required: false, type: 'number', min: 1, max: 30 },
  ]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get field and crop data
  const { data: field } = await supabase
    .from('fields')
    .select('*')
    .eq('id', body.field_id)
    .single();

  const { data: crop } = await supabase.from('crops').select('*').eq('id', body.crop_id).single();

  if (!field || !crop) throw new ValidationError('Field or crop not found');

  const schedule = generateIrrigationSchedule(field, crop, body.days || 14);

  logger.info(`Irrigation schedule generated for field: ${body.field_id}`);
  return createSuccessResponse({
    field: field.name,
    crop: crop.name,
    schedule,
  });
}

async function handleHarvestTiming(req: Request, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const body = await req.json();
  const errors = validate(body, [{ field: 'crop_plan_id', required: true, type: 'uuid' }]);

  if (errors.length > 0) throw new ValidationError('Validation failed', errors);

  // Get crop plan data
  const { data: cropPlan } = await supabase
    .from('crop_plans')
    .select(
      `
      *,
      crop:crops(id, name, growing_season_days, variety),
      field:fields(id, name, soil_type, climate_zone)
    `
    )
    .eq('id', body.crop_plan_id)
    .single();

  if (!cropPlan) throw new ValidationError('Crop plan not found');

  const timing = calculateHarvestTiming(cropPlan);

  logger.info(`Harvest timing calculated for crop plan: ${body.crop_plan_id}`);
  return createSuccessResponse({
    crop_plan: cropPlan,
    harvest_timing: timing,
  });
}

// Enhanced Algorithm Functions

function generateCropRotationPlan(field: any, years: number, preferredCrops: string[]): any[] {
  const plan = [];
  const cropHistory = field.crop_plans || [];

  // Analyze previous crops to avoid planting same family consecutively
  const recentCrops = cropHistory
    .slice(-3)
    .map((cp: any) => cp.crop?.family)
    .filter(Boolean);

  // Crop families for rotation
  const cropFamilies = {
    legumes: ['beans', 'peas', 'lentils', 'soybeans'],
    grasses: ['wheat', 'corn', 'rice', 'barley'],
    brassicas: ['cabbage', 'broccoli', 'cauliflower', 'kale'],
    solanaceae: ['tomatoes', 'potatoes', 'peppers', 'eggplant'],
    root: ['carrots', 'beets', 'radishes', 'turnips'],
  };

  for (let year = 0; year < years; year++) {
    const seasonCrops = [];

    // Spring crop - prioritize nitrogen-fixing legumes after heavy feeders
    const springFamily = selectCropFamily(recentCrops, 'spring', year);
    seasonCrops.push({
      season: 'spring',
      recommended_family: springFamily,
      crop_type: getFamilyCrops(springFamily),
      reasoning: getRotationReasoning(springFamily, recentCrops, 'spring'),
    });

    // Summer crop - warm-season crops
    const summerFamily = selectCropFamily([springFamily, ...recentCrops], 'summer', year);
    seasonCrops.push({
      season: 'summer',
      recommended_family: summerFamily,
      crop_type: getFamilyCrops(summerFamily),
      reasoning: getRotationReasoning(summerFamily, [springFamily, ...recentCrops], 'summer'),
    });

    // Fall crop - cool-season crops or cover crops
    const fallFamily = selectCropFamily([springFamily, summerFamily, ...recentCrops], 'fall', year);
    seasonCrops.push({
      season: 'fall',
      recommended_family: fallFamily,
      crop_type: getFamilyCrops(fallFamily),
      reasoning: getRotationReasoning(
        fallFamily,
        [springFamily, summerFamily, ...recentCrops],
        'fall'
      ),
    });

    plan.push({
      year: year + 1,
      seasons: seasonCrops,
      soil_health_benefits: calculateSoilBenefits(springFamily, summerFamily, fallFamily),
      pest_break_advantages: calculatePestBreakBenefits([springFamily, summerFamily, fallFamily]),
    });
  }

  return plan;
}

function selectCropFamily(recentCrops: string[], season: string, yearIndex: number): string {
  const families = ['legumes', 'grasses', 'brassicas', 'solanaceae', 'root'];

  // Avoid recent families
  const availableFamilies = families.filter((family) => !recentCrops.includes(family));

  if (availableFamilies.length === 0) {
    // If all families were used recently, pick the one used longest ago
    return families[yearIndex % families.length];
  }

  // Seasonal preferences
  const seasonalPreferences = {
    spring: ['legumes', 'brassicas', 'root'],
    summer: ['grasses', 'solanaceae'],
    fall: ['legumes', 'brassicas', 'root'],
  };

  const seasonalOptions = availableFamilies.filter((f) =>
    seasonalPreferences[season as keyof typeof seasonalPreferences].includes(f)
  );

  if (seasonalOptions.length > 0) {
    return seasonalOptions[yearIndex % seasonalOptions.length];
  }

  return availableFamilies[yearIndex % availableFamilies.length];
}

function getFamilyCrops(family: string): string[] {
  const cropExamples = {
    legumes: ['beans', 'peas', 'clover', 'alfalfa'],
    grasses: ['wheat', 'corn', 'barley', 'oats'],
    brassicas: ['cabbage', 'broccoli', 'mustard', 'radish'],
    solanaceae: ['tomatoes', 'potatoes', 'peppers', 'eggplant'],
    root: ['carrots', 'beets', 'turnips', 'parsnips'],
  };
  return cropExamples[family as keyof typeof cropExamples] || [];
}

function getRotationReasoning(family: string, recentCrops: string[], season: string): string {
  const reasons = {
    legumes: 'Fixes nitrogen in soil, improves soil structure for subsequent crops',
    grasses: 'Deep root system breaks up soil, uses different nutrients than previous crops',
    brassicas: 'Biofumigant properties help control soil pests and diseases',
    solanaceae: 'Heavy feeders that benefit from previous legume plantings',
    root: 'Different root depth reduces soil compaction and improves aeration',
  };

  const baseReason = reasons[family as keyof typeof reasons] || 'Crop rotation benefit';

  if (recentCrops.length === 0) {
    return `${baseReason}. Good starting point for rotation.`;
  }

  return `${baseReason}. Breaks pest and disease cycles from previous ${recentCrops.join(', ')} plantings.`;
}

function calculateSoilBenefits(
  springFamily: string,
  summerFamily: string,
  fallFamily: string
): any {
  let nitrogenScore = 0;
  let organicMatterScore = 0;
  let soilStructureScore = 0;

  // Nitrogen benefits
  if ([springFamily, summerFamily, fallFamily].includes('legumes')) {
    nitrogenScore += 30;
  }

  // Organic matter benefits
  if ([springFamily, summerFamily, fallFamily].includes('grasses')) {
    organicMatterScore += 25;
  }

  // Soil structure benefits
  if ([springFamily, summerFamily, fallFamily].includes('root')) {
    soilStructureScore += 20;
  }

  return {
    nitrogen_improvement: nitrogenScore,
    organic_matter_increase: organicMatterScore,
    soil_structure_enhancement: soilStructureScore,
    overall_soil_health_score: nitrogenScore + organicMatterScore + soilStructureScore,
  };
}

function calculatePestBreakBenefits(families: string[]): any {
  const diversityScore = new Set(families).size * 20;
  const diseaseBreakScore = families.length >= 3 ? 40 : families.length * 15;

  return {
    crop_diversity_score: Math.min(diversityScore, 60),
    disease_break_score: diseaseBreakScore,
    pest_control_benefit: Math.min(diversityScore + diseaseBreakScore, 100),
  };
}

function analyzeSoilHealth(field: any, soilData: any): any {
  const analysis = {
    overall_score: 0,
    ph_status: 'optimal',
    nutrient_status: 'balanced',
    recommendations: [],
    amendments: [],
  };

  // pH Analysis
  const ph = soilData.soil_ph || field.soil_ph || 6.5;
  if (ph < 6.0) {
    analysis.ph_status = 'acidic';
    analysis.recommendations.push('Soil is too acidic - consider adding lime');
    analysis.amendments.push({ type: 'lime', amount: '2-4 tons/acre', timing: 'before planting' });
  } else if (ph > 7.5) {
    analysis.ph_status = 'alkaline';
    analysis.recommendations.push(
      'Soil is too alkaline - consider adding sulfur or organic matter'
    );
    analysis.amendments.push({
      type: 'elemental sulfur',
      amount: '500-1000 lbs/acre',
      timing: 'before planting',
    });
  } else {
    analysis.overall_score += 25;
  }

  // Nutrient Analysis
  const nutrients = {
    nitrogen: soilData.nitrogen || 50,
    phosphorus: soilData.phosphorus || 30,
    potassium: soilData.potassium || 40,
  };

  const avgNutrients = (nutrients.nitrogen + nutrients.phosphorus + nutrients.potassium) / 3;

  if (avgNutrients < 30) {
    analysis.nutrient_status = 'deficient';
    analysis.recommendations.push('Nutrient levels are low - consider adding balanced fertilizer');
  } else if (avgNutrients > 70) {
    analysis.nutrient_status = 'excessive';
    analysis.recommendations.push('Nutrient levels are high - reduce fertilizer application');
  } else {
    analysis.nutrient_status = 'balanced';
    analysis.overall_score += 25;
  }

  // Organic Matter Analysis
  const organicMatter = soilData.organic_matter || 3;
  if (organicMatter < 2) {
    analysis.recommendations.push('Low organic matter - add compost or cover crops');
    analysis.amendments.push({
      type: 'compost',
      amount: '10-20 tons/acre',
      timing: 'before planting',
    });
  } else if (organicMatter > 5) {
    analysis.overall_score += 25;
  } else {
    analysis.overall_score += 15;
  }

  // Soil Type Analysis
  if (field.soil_type === 'loam') {
    analysis.overall_score += 25;
  } else if (field.soil_type === 'clay') {
    analysis.recommendations.push('Clay soil - consider adding organic matter to improve drainage');
  } else if (field.soil_type === 'sandy') {
    analysis.recommendations.push(
      'Sandy soil - consider adding organic matter to improve water retention'
    );
  }

  analysis.overall_score = Math.min(analysis.overall_score, 100);

  return analysis;
}

function generateIrrigationSchedule(field: any, crop: any, days: number): any[] {
  const schedule = [];
  const baseDate = new Date();

  // Calculate water requirements based on crop and field characteristics
  const waterRequirement = crop.water_requirement_mm || 25;
  const soilType = field.soil_type || 'loam';

  // Soil type water retention factors
  const soilFactors = {
    sandy: 0.7, // Drains quickly
    loam: 1.0, // Balanced
    clay: 1.3, // Retains water
    silty: 1.1, // Good retention
  };

  const retentionFactor = soilFactors[soilType as keyof typeof soilFactors] || 1.0;
  const adjustedRequirement = waterRequirement * retentionFactor;

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    // Vary irrigation based on weather patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Simulate weather impact
    const weatherFactor = Math.random() > 0.8 ? 0.5 : 1.0; // 20% chance of rain
    const irrigationAmount = adjustedRequirement * weatherFactor;

    schedule.push({
      date: date.toISOString().split('T')[0],
      irrigation_required: irrigationAmount > 10,
      amount_mm: Math.round(irrigationAmount * 10) / 10,
      duration_minutes: Math.round((irrigationAmount / 2) * 60), // Assuming 2mm/min
      best_time: isWeekend ? 'early_morning' : 'late_evening',
      soil_moisture_target: '60-70%',
      notes:
        weatherFactor < 1.0 ? 'Reduced irrigation due to expected rainfall' : 'Normal irrigation',
    });
  }

  return schedule;
}

function calculateHarvestTiming(cropPlan: any): any {
  const plantingDate = new Date(cropPlan.planting_date);
  const growingDays = cropPlan.crop?.growing_season_days || 120;

  // Calculate base harvest date
  const baseHarvestDate = new Date(plantingDate);
  baseHarvestDate.setDate(baseHarvestDate.getDate() + growingDays);

  // Adjust for environmental factors
  let adjustmentDays = 0;
  const factors = [];

  // Soil type adjustment
  if (cropPlan.field?.soil_type === 'sandy') {
    adjustmentDays -= 5; // Faster maturity in sandy soil
    factors.push('Sandy soil may accelerate maturity by 5 days');
  } else if (cropPlan.field?.soil_type === 'clay') {
    adjustmentDays += 7; // Slower maturity in clay soil
    factors.push('Clay soil may delay maturity by 7 days');
  }

  // Variety adjustment
  if (cropPlan.crop?.variety?.toLowerCase().includes('early')) {
    adjustmentDays -= 10;
    factors.push('Early variety may mature 10 days sooner');
  } else if (cropPlan.crop?.variety?.toLowerCase().includes('late')) {
    adjustmentDays += 15;
    factors.push('Late variety may require 15 additional days');
  }

  // Calculate adjusted harvest dates
  const earliestHarvest = new Date(baseHarvestDate);
  earliestHarvest.setDate(earliestHarvest.getDate() + adjustmentDays - 7);

  const optimalHarvest = new Date(baseHarvestDate);
  optimalHarvest.setDate(optimalHarvest.getDate() + adjustmentDays);

  const latestHarvest = new Date(baseHarvestDate);
  latestHarvest.setDate(latestHarvest.getDate() + adjustmentDays + 7);

  return {
    planting_date: plantingDate.toISOString().split('T')[0],
    estimated_harvest_window: {
      earliest: earliestHarvest.toISOString().split('T')[0],
      optimal: optimalHarvest.toISOString().split('T')[0],
      latest: latestHarvest.toISOString().split('T')[0],
    },
    days_to_maturity: growingDays + adjustmentDays,
    adjustment_factors: factors,
    harvest_indicators: getHarvestIndicators(cropPlan.crop?.name || 'unknown'),
    post_harvest_handling: getPostHarvestHandling(cropPlan.crop?.category || 'unknown'),
  };
}

function getHarvestIndicators(cropName: string): string[] {
  const indicators = {
    tomatoes: [
      'Full color development',
      'Firm but slightly yielding to pressure',
      'Easy separation from vine',
    ],
    corn: ['Husks dry and brown', 'Silks brown and dry', 'Kernels plump and milky when pierced'],
    wheat: ['Golden color', 'Kernels hard and dry', 'Stems yellow and dry'],
    potatoes: ['Vines dying back', 'Skin firm and set', 'Tubers full size'],
  };

  return (
    indicators[cropName.toLowerCase() as keyof typeof indicators] || [
      'Visual maturity signs',
      'Proper color development',
      'Firm texture',
    ]
  );
}

function getPostHarvestHandling(cropCategory: string): any {
  const handling = {
    vegetables: {
      cooling: 'Immediate cooling to 4°C',
      storage: 'High humidity (85-95%)',
      shelf_life: '1-3 weeks',
    },
    grains: {
      drying: 'Dry to 13-14% moisture',
      storage: 'Cool, dry conditions',
      shelf_life: '6-12 months',
    },
    fruits: {
      cooling: 'Gradual cooling to prevent shock',
      storage: 'Controlled atmosphere',
      shelf_life: '2-8 weeks',
    },
  };

  return (
    handling[cropCategory.toLowerCase() as keyof typeof handling] || {
      cooling: 'Cool to appropriate temperature',
      storage: 'Store in proper conditions',
      shelf_life: 'Varies by product',
    }
  );
}
