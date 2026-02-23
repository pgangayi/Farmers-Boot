/**
 * ============================================================================
 * WEATHER EDGE FUNCTION
 * ============================================================================
 * Handles weather-related requests
 * ============================================================================
 */

import { supabase, getUserFromAuth, getUserFarmIds } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  errorHandler,
  createSuccessResponse,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../_shared/error-handler.ts';
import { validate, validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';
import { broadcastWeatherUpdate } from '../_shared/realtime.ts';

export async function handleWeatherRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/weather', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Weather request: ${method} ${path}`);

  try {
    if (path === '' && method === 'GET') {
      return await handleGetWeatherData(req, url, requestId);
    } else if (path === '/forecast' && method === 'GET') {
      return await handleGetWeatherForecast(req, url, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const locationId = path.substring(1);
      return await handleGetWeatherByLocation(req, locationId, requestId);
    } else if (path === '/recommendations' && method === 'GET') {
      return await handleGetWeatherRecommendations(req, url, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Weather endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

async function handleGetWeatherData(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const { page, pageSize, offset } = validatePagination(url.searchParams);

  let query = supabase
    .from('weather_data')
    .select('*', { count: 'exact' })
    .order('recorded_at', { ascending: false });

  const locationId = url.searchParams.get('location_id');
  if (locationId) {
    query = query.eq('location_id', locationId);
  } else {
    // Get weather for user's farm locations
    const farmIds = await getUserFarmIds(authHeader);
    const { data: farms } = await supabase.from('farms').select('location_id').in('id', farmIds);

    const locationIds = farms?.map((f: any) => f.location_id).filter(Boolean) || [];
    if (locationIds.length > 0) {
      query = query.in('location_id', locationIds);
    }
  }

  const startDate = url.searchParams.get('start_date');
  if (startDate) query = query.gte('recorded_at', startDate);

  const endDate = url.searchParams.get('end_date');
  if (endDate) query = query.lte('recorded_at', endDate);

  const { count } = await query;
  const { data: weatherData, error } = await query.range(offset, offset + pageSize - 1);

  if (error) throw new Error('Failed to fetch weather data');

  return createSuccessResponse({
    data: weatherData || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      hasNextPage: page * pageSize < (count || 0),
      hasPreviousPage: page > 1,
    },
  });
}

async function handleGetWeatherByLocation(
  req: Request,
  locationId: string,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  // Get location
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (locationError || !location) throw new NotFoundError('Location not found');

  // Get latest weather data
  const { data: weatherData, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('location_id', locationId)
    .order('recorded_at', { ascending: false })
    .limit(24); // Last 24 readings

  if (error) throw new Error('Failed to fetch weather data');

  return createSuccessResponse({
    location,
    weather: weatherData || [],
  });
}

async function handleGetWeatherForecast(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const locationId = url.searchParams.get('location_id');
  const days = parseInt(url.searchParams.get('days') || '7', 10);

  if (!locationId) {
    throw new ValidationError('location_id is required');
  }

  // Get location
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (locationError || !location) throw new NotFoundError('Location not found');

  // Try to get real weather data from OpenWeatherMap API
  const forecast = await getWeatherForecast(location, days);

  return createSuccessResponse({
    location,
    forecast,
  });
}

async function handleGetWeatherRecommendations(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const locationId = url.searchParams.get('location_id');
  const cropType = url.searchParams.get('crop_type');

  if (!locationId) {
    throw new ValidationError('location_id is required');
  }

  // Get latest weather data
  const { data: weatherData, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('location_id', locationId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !weatherData) {
    throw new NotFoundError('No weather data available for this location');
  }

  // Generate recommendations based on weather
  const recommendations = generateWeatherRecommendations(weatherData, cropType);

  return createSuccessResponse({
    weather: weatherData,
    recommendations,
  });
}

// Real weather API integration
async function getWeatherForecast(location: any, days: number): Promise<any[]> {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');

  if (!apiKey) {
    logger.warn('OpenWeather API key not found, using mock data');
    return generateMockForecast(location, days);
  }

  try {
    const lat = location.latitude;
    const lon = location.longitude;

    if (!lat || !lon) {
      logger.warn('Location missing coordinates, using mock data');
      return generateMockForecast(location, days);
    }

    // Get current weather and 5-day forecast
    const weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=metric`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform OpenWeather data to our format
    const forecast = data.daily.slice(0, days).map((day: any) => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      temperature_min: Math.round(day.temp.min),
      temperature_max: Math.round(day.temp.max),
      humidity: day.humidity,
      precipitation: day.rain ? day.rain['3h'] || 0 : day.snow ? day.snow['3h'] || 0 : 0,
      wind_speed: Math.round(day.wind_speed * 3.6), // Convert m/s to km/h
      condition: getWeatherCondition(day.weather[0].main, day.weather[0].description),
      pressure: day.pressure,
      uv_index: day.uvi,
      visibility: day.visibility / 1000, // Convert m to km
    }));

    logger.info(`Real weather data retrieved for location: ${location.id}`);
    return forecast;
  } catch (error) {
    logger.error('Failed to get weather data from API:', error);
    logger.info('Falling back to mock data');
    return generateMockForecast(location, days);
  }
}

// Map OpenWeather conditions to our format
function getWeatherCondition(main: string, description: string): string {
  const conditionMap: Record<string, string> = {
    Clear: 'sunny',
    Clouds: description.includes('few') ? 'partly_cloudy' : 'cloudy',
    Rain: 'rainy',
    Drizzle: 'rainy',
    Thunderstorm: 'rainy',
    Snow: 'snowy',
    Mist: 'cloudy',
    Fog: 'cloudy',
    Haze: 'cloudy',
  };

  return conditionMap[main] || 'cloudy';
}

// Mock forecast generator (fallback)
function generateMockForecast(location: any, days: number): any[] {
  const forecast = [];
  const baseDate = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString().split('T')[0],
      temperature_min: 15 + Math.random() * 10,
      temperature_max: 25 + Math.random() * 10,
      humidity: 50 + Math.random() * 30,
      precipitation: Math.random() * 10,
      wind_speed: 5 + Math.random() * 15,
      condition: ['sunny', 'cloudy', 'partly_cloudy', 'rainy'][Math.floor(Math.random() * 4)],
    });
  }

  return forecast;
}

// Generate weather-based recommendations
function generateWeatherRecommendations(weather: any, cropType?: string): string[] {
  const recommendations: string[] = [];

  if (weather.temperature_c) {
    if (weather.temperature_c > 35) {
      recommendations.push(
        'High temperature detected. Ensure adequate irrigation and consider shade protection.'
      );
    } else if (weather.temperature_c < 5) {
      recommendations.push('Low temperature detected. Consider frost protection measures.');
    }
  }

  if (weather.humidity_percent) {
    if (weather.humidity_percent > 80) {
      recommendations.push(
        'High humidity detected. Monitor for fungal diseases and ensure good ventilation.'
      );
    } else if (weather.humidity_percent < 30) {
      recommendations.push('Low humidity detected. Increase irrigation frequency.');
    }
  }

  if (weather.precipitation_mm && weather.precipitation_mm > 20) {
    recommendations.push('Heavy rain expected. Ensure proper drainage and avoid field operations.');
  }

  if (weather.wind_speed_kmh && weather.wind_speed_kmh > 30) {
    recommendations.push('Strong winds expected. Secure equipment and avoid spraying operations.');
  }

  // Crop-specific recommendations
  if (cropType) {
    switch (cropType.toLowerCase()) {
      case 'maize':
      case 'corn':
        if (weather.temperature_c && weather.temperature_c < 10) {
          recommendations.push(
            'Maize is sensitive to cold. Delay planting if temperature is below 10°C.'
          );
        }
        break;
      case 'tomato':
        if (weather.humidity_percent && weather.humidity_percent > 70) {
          recommendations.push('High humidity increases risk of tomato blight. Monitor closely.');
        }
        break;
      case 'wheat':
        if (weather.precipitation_mm && weather.precipitation_mm > 50) {
          recommendations.push('Excessive rain may cause wheat lodging. Monitor field conditions.');
        }
        break;
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Weather conditions are favorable for farming activities.');
  }

  return recommendations;
}
