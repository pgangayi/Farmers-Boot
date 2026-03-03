/**
 * ============================================================================
 * WEATHER EDGE FUNCTION - Open-Meteo Integration
 * ============================================================================
 * Handles weather-related requests using Open-Meteo API (free, no API key)
 * Open-Meteo documentation: https://open-meteo.com/en/docs
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
import { validatePagination } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';
import { broadcastWeatherUpdate } from '../_shared/realtime.ts';

// Open-Meteo API Configuration
const OPENMETEO_API_URL = 'https://api.open-meteo.com/v1/forecast';
const OPENMETEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Weather condition mapping from Open-Meteo WMO codes
// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
const WMO_WEATHER_CODES: Record<number, { condition: string; description: string; icon: string }> =
  {
    0: { condition: 'sunny', description: 'Clear sky', icon: 'sun' },
    1: { condition: 'partly_cloudy', description: 'Mainly clear', icon: 'cloud-sun' },
    2: { condition: 'partly_cloudy', description: 'Partly cloudy', icon: 'cloud-sun' },
    3: { condition: 'cloudy', description: 'Overcast', icon: 'cloud' },
    45: { condition: 'cloudy', description: 'Fog', icon: 'fog' },
    48: { condition: 'cloudy', description: 'Depositing rime fog', icon: 'fog' },
    51: { condition: 'rainy', description: 'Light drizzle', icon: 'cloud-drizzle' },
    53: { condition: 'rainy', description: 'Moderate drizzle', icon: 'cloud-drizzle' },
    55: { condition: 'rainy', description: 'Dense drizzle', icon: 'cloud-drizzle' },
    56: { condition: 'rainy', description: 'Light freezing drizzle', icon: 'cloud-drizzle' },
    57: { condition: 'rainy', description: 'Dense freezing drizzle', icon: 'cloud-drizzle' },
    61: { condition: 'rainy', description: 'Slight rain', icon: 'cloud-rain' },
    63: { condition: 'rainy', description: 'Moderate rain', icon: 'cloud-rain' },
    65: { condition: 'rainy', description: 'Heavy rain', icon: 'cloud-rain' },
    66: { condition: 'rainy', description: 'Light freezing rain', icon: 'cloud-rain' },
    67: { condition: 'rainy', description: 'Heavy freezing rain', icon: 'cloud-rain' },
    71: { condition: 'snowy', description: 'Slight snow fall', icon: 'snowflake' },
    73: { condition: 'snowy', description: 'Moderate snow fall', icon: 'snowflake' },
    75: { condition: 'snowy', description: 'Heavy snow fall', icon: 'snowflake' },
    77: { condition: 'snowy', description: 'Snow grains', icon: 'snowflake' },
    80: { condition: 'rainy', description: 'Slight rain showers', icon: 'cloud-rain' },
    81: { condition: 'rainy', description: 'Moderate rain showers', icon: 'cloud-rain' },
    82: { condition: 'rainy', description: 'Violent rain showers', icon: 'cloud-rain' },
    85: { condition: 'snowy', description: 'Slight snow showers', icon: 'snowflake' },
    86: { condition: 'snowy', description: 'Heavy snow showers', icon: 'snowflake' },
    95: { condition: 'stormy', description: 'Thunderstorm', icon: 'cloud-lightning' },
    96: {
      condition: 'stormy',
      description: 'Thunderstorm with slight hail',
      icon: 'cloud-lightning',
    },
    99: {
      condition: 'stormy',
      description: 'Thunderstorm with heavy hail',
      icon: 'cloud-lightning',
    },
  };

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
    } else if (path === '/current' && method === 'GET') {
      return await handleGetCurrentWeather(req, url, requestId);
    } else if (path === '/geocode' && method === 'GET') {
      return await handleGeocodeLocation(req, url, requestId);
    } else if (path.match(/^\/[^\/]+$/) && method === 'GET') {
      const locationId = path.substring(1);
      return await handleGetWeatherByLocation(req, locationId, requestId);
    } else if (path === '/recommendations' && method === 'GET') {
      return await handleGetWeatherRecommendations(req, url, requestId);
    } else if (path === '/alerts' && method === 'GET') {
      return await handleGetWeatherAlerts(req, url, requestId);
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

  // Try to fetch fresh data from Open-Meteo if coordinates are available
  let weatherData: any[] = [];
  let currentWeather = null;

  if (location.latitude && location.longitude) {
    try {
      currentWeather = await fetchCurrentWeatherFromOpenMeteo(
        location.latitude,
        location.longitude
      );

      // Store the current weather reading in the database
      await storeWeatherReading(locationId, currentWeather);

      // Broadcast update via realtime
      await broadcastWeatherUpdate(requestId, { location_id: locationId, ...currentWeather });
    } catch (error) {
      logger.warn('Failed to fetch from Open-Meteo, using cached data', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Get latest weather data from database
  const { data: dbWeatherData, error } = await supabase
    .from('weather_data')
    .select('*')
    .eq('location_id', locationId)
    .order('recorded_at', { ascending: false })
    .limit(24); // Last 24 readings

  if (error) throw new Error('Failed to fetch weather data');

  weatherData = dbWeatherData || [];

  return createSuccessResponse({
    location,
    current: currentWeather || weatherData[0] || null,
    weather: weatherData,
  });
}

async function handleGetCurrentWeather(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const locationId = url.searchParams.get('location_id');
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  let latitude: number;
  let longitude: number;
  let locationName = 'Current Location';

  if (locationId) {
    // Get location from database
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (locationError || !location) throw new NotFoundError('Location not found');

    if (!location.latitude || !location.longitude) {
      throw new ValidationError('Location does not have coordinates');
    }

    latitude = location.latitude;
    longitude = location.longitude;
    locationName = location.name;
  } else if (lat && lon) {
    latitude = parseFloat(lat);
    longitude = parseFloat(lon);
  } else {
    throw new ValidationError('Either location_id or lat/lon coordinates are required');
  }

  // Fetch current weather from Open-Meteo
  const currentWeather = await fetchCurrentWeatherFromOpenMeteo(latitude, longitude);

  // Store the reading if locationId is provided
  if (locationId) {
    await storeWeatherReading(locationId, currentWeather);
  }

  return createSuccessResponse({
    location: {
      name: locationName,
      latitude,
      longitude,
    },
    current: currentWeather,
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
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 16); // Max 16 days for Open-Meteo

  let latitude: number;
  let longitude: number;
  let locationName = 'Current Location';

  if (locationId) {
    // Get location from database
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (locationError || !location) throw new NotFoundError('Location not found');

    if (!location.latitude || !location.longitude) {
      throw new ValidationError('Location does not have coordinates');
    }

    latitude = location.latitude;
    longitude = location.longitude;
    locationName = location.name;
  } else if (lat && lon) {
    latitude = parseFloat(lat);
    longitude = parseFloat(lon);
  } else {
    throw new ValidationError('Either location_id or lat/lon coordinates are required');
  }

  // Fetch forecast from Open-Meteo
  const forecast = await fetchForecastFromOpenMeteo(latitude, longitude, days);

  return createSuccessResponse({
    location: {
      id: locationId,
      name: locationName,
      latitude,
      longitude,
    },
    forecast,
    days,
  });
}

async function handleGeocodeLocation(req: Request, url: URL, requestId: string): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const query = url.searchParams.get('q');
  if (!query) {
    throw new ValidationError('Query parameter "q" is required');
  }

  const results = await geocodeLocation(query);

  return createSuccessResponse({
    query,
    results,
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
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  let weatherData: any;

  if (locationId) {
    // Get latest weather data from database
    const { data, error } = await supabase
      .from('weather_data')
      .select('*')
      .eq('location_id', locationId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Try to fetch fresh data
      const { data: location } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (location?.latitude && location?.longitude) {
        weatherData = await fetchCurrentWeatherFromOpenMeteo(location.latitude, location.longitude);
        await storeWeatherReading(locationId, weatherData);
      } else {
        throw new NotFoundError('No weather data available for this location');
      }
    } else {
      weatherData = data;
    }
  } else if (lat && lon) {
    weatherData = await fetchCurrentWeatherFromOpenMeteo(parseFloat(lat), parseFloat(lon));
  } else {
    throw new ValidationError('Either location_id or lat/lon coordinates are required');
  }

  // Generate recommendations based on weather
  const recommendations = generateWeatherRecommendations(weatherData, cropType || undefined);
  const agriculturalInsights = generateAgriculturalInsights(weatherData, cropType || undefined);

  return createSuccessResponse({
    weather: weatherData,
    recommendations,
    agriculturalInsights,
  });
}

async function handleGetWeatherAlerts(
  req: Request,
  url: URL,
  requestId: string
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new AuthenticationError('No authorization header');

  const user = await getUserFromAuth(authHeader);
  if (!user) throw new AuthenticationError('Invalid token');

  const locationId = url.searchParams.get('location_id');
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  let weatherData: any;
  let forecast: any[] = [];

  if (locationId) {
    const { data: location } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (location?.latitude && location?.longitude) {
      weatherData = await fetchCurrentWeatherFromOpenMeteo(location.latitude, location.longitude);
      forecast = await fetchForecastFromOpenMeteo(location.latitude, location.longitude, 3);
    }
  } else if (lat && lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    weatherData = await fetchCurrentWeatherFromOpenMeteo(latitude, longitude);
    forecast = await fetchForecastFromOpenMeteo(latitude, longitude, 3);
  } else {
    throw new ValidationError('Either location_id or lat/lon coordinates are required');
  }

  // Generate alerts based on current weather and forecast
  const alerts = generateWeatherAlerts(weatherData, forecast);

  return createSuccessResponse({
    alerts,
    current: weatherData,
    forecast,
  });
}

// ============================================================================
// Open-Meteo API Integration
// ============================================================================

async function fetchCurrentWeatherFromOpenMeteo(lat: number, lon: number): Promise<any> {
  const url = new URL(OPENMETEO_API_URL);
  url.searchParams.append('latitude', lat.toString());
  url.searchParams.append('longitude', lon.toString());
  url.searchParams.append(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m'
  );
  url.searchParams.append('timezone', 'auto');

  logger.info(`Fetching current weather from Open-Meteo for ${lat}, ${lon}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;
  const wmoCode = current.weather_code || 0;
  const wmoInfo = WMO_WEATHER_CODES[wmoCode] || WMO_WEATHER_CODES[0];

  return {
    recorded_at: new Date().toISOString(),
    temperature_c: current.temperature_2m,
    feels_like_c: current.apparent_temperature,
    humidity_percent: current.relative_humidity_2m,
    precipitation_mm: current.precipitation,
    rain_mm: current.rain,
    showers_mm: current.showers,
    snowfall_mm: current.snowfall,
    wind_speed_kmh: current.wind_speed_10m,
    wind_direction_deg: current.wind_direction_10m,
    wind_gusts_kmh: current.wind_gusts_10m,
    pressure_hpa: current.surface_pressure,
    sea_level_pressure_hpa: current.pressure_msl,
    cloud_cover_percent: current.cloud_cover,
    is_day: current.is_day === 1,
    condition: wmoInfo.condition,
    weather_code: wmoCode,
    weather_description: wmoInfo.description,
    source: 'open-meteo',
  };
}

async function fetchForecastFromOpenMeteo(lat: number, lon: number, days: number): Promise<any[]> {
  const url = new URL(OPENMETEO_API_URL);
  url.searchParams.append('latitude', lat.toString());
  url.searchParams.append('longitude', lon.toString());
  url.searchParams.append(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant'
  );
  url.searchParams.append('timezone', 'auto');
  url.searchParams.append('forecast_days', days.toString());

  logger.info(`Fetching forecast from Open-Meteo for ${lat}, ${lon}, ${days} days`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data = await response.json();
  const daily = data.daily;

  return daily.time.map((time: string, index: number) => {
    const wmoCode = daily.weather_code[index] || 0;
    const wmoInfo = WMO_WEATHER_CODES[wmoCode] || WMO_WEATHER_CODES[0];

    return {
      date: time,
      temperature_max: daily.temperature_2m_max[index],
      temperature_min: daily.temperature_2m_min[index],
      feels_like_max: daily.apparent_temperature_max[index],
      feels_like_min: daily.apparent_temperature_min[index],
      condition: wmoInfo.condition,
      weather_code: wmoCode,
      weather_description: wmoInfo.description,
      precipitation: daily.precipitation_sum[index],
      rain: daily.rain_sum[index],
      showers: daily.showers_sum[index],
      snowfall: daily.snowfall_sum[index],
      precipitation_hours: daily.precipitation_hours[index],
      precipitation_probability: daily.precipitation_probability_max[index],
      wind_speed_max: daily.wind_speed_10m_max[index],
      wind_gusts_max: daily.wind_gusts_10m_max[index],
      wind_direction_dominant: daily.wind_direction_10m_dominant[index],
      uv_index_max: daily.uv_index_max[index],
      sunrise: daily.sunrise[index],
      sunset: daily.sunset[index],
      daylight_duration_hours: daily.daylight_duration[index] / 3600, // Convert seconds to hours
    };
  });
}

async function geocodeLocation(query: string): Promise<any[]> {
  const url = new URL(OPENMETEO_GEOCODING_URL);
  url.searchParams.append('name', query);
  url.searchParams.append('count', '10');
  url.searchParams.append('language', 'en');
  url.searchParams.append('format', 'json');

  logger.info(`Geocoding location: ${query}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results) {
    return [];
  }

  return data.results.map((result: any) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    elevation: result.elevation,
    feature_code: result.feature_code,
    country_code: result.country_code,
    country: result.country,
    admin1: result.admin1,
    admin2: result.admin2,
    admin3: result.admin3,
    admin4: result.admin4,
    timezone: result.timezone,
    population: result.population,
  }));
}

async function storeWeatherReading(locationId: string, weatherData: any): Promise<void> {
  try {
    const { error } = await supabase.from('weather_data').insert({
      location_id: locationId,
      recorded_at: weatherData.recorded_at,
      temperature_c: weatherData.temperature_c,
      humidity_percent: weatherData.humidity_percent,
      wind_speed_kmh: weatherData.wind_speed_kmh,
      precipitation_mm: weatherData.precipitation_mm,
      pressure_hpa: weatherData.pressure_hpa,
      condition: weatherData.condition,
      source: 'open-meteo',
      metadata: {
        feels_like_c: weatherData.feels_like_c,
        wind_direction_deg: weatherData.wind_direction_deg,
        wind_gusts_kmh: weatherData.wind_gusts_kmh,
        cloud_cover_percent: weatherData.cloud_cover_percent,
        weather_code: weatherData.weather_code,
        weather_description: weatherData.weather_description,
      },
    });

    if (error) {
      logger.warn('Failed to store weather reading:', error);
    }
  } catch (error) {
    logger.warn('Error storing weather reading', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================================
// Weather Alert Generation
// ============================================================================

function generateWeatherAlerts(current: any, forecast: any[]): any[] {
  const alerts: any[] = [];

  // Temperature alerts
  if (current.temperature_c > 35) {
    alerts.push({
      id: `temp-high-${Date.now()}`,
      type: 'warning',
      title: 'Extreme Heat Warning',
      description: `Temperatures reaching ${current.temperature_c}°C. Risk of heat stress for crops and livestock.`,
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      impact: [
        'Increased water requirements for crops',
        'Heat stress risk for livestock',
        'Potential wilting of sensitive plants',
        'Reduced pollination in some crops',
      ],
      recommendations: [
        'Increase irrigation frequency',
        'Provide shade for livestock',
        'Avoid field work during peak heat',
        'Monitor crop stress indicators',
      ],
    });
  }

  if (current.temperature_c < 5) {
    alerts.push({
      id: `temp-low-${Date.now()}`,
      type: current.temperature_c < 0 ? 'warning' : 'advisory',
      title: current.temperature_c < 0 ? 'Frost Warning' : 'Low Temperature Advisory',
      description: `Temperatures dropping to ${current.temperature_c}°C. Risk of frost damage to sensitive crops.`,
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      impact: [
        'Frost damage to tender plants',
        'Delayed germination',
        'Livestock cold stress',
        'Reduced crop growth rates',
      ],
      recommendations: [
        'Cover sensitive crops',
        'Delay planting activities',
        'Ensure livestock shelter',
        'Use frost protection measures',
      ],
    });
  }

  // Wind alerts
  if (current.wind_speed_kmh > 40 || current.wind_gusts_kmh > 50) {
    alerts.push({
      id: `wind-${Date.now()}`,
      type: 'warning',
      title: 'High Wind Warning',
      description: `Wind speeds reaching ${current.wind_speed_kmh} km/h with gusts up to ${current.wind_gusts_kmh} km/h.`,
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      impact: [
        'Risk of crop lodging in grains',
        'Difficult spray conditions',
        'Potential equipment damage',
        'Soil erosion risk',
      ],
      recommendations: [
        'Postpone spraying operations',
        'Secure loose equipment',
        'Check crop supports',
        'Avoid tall equipment operations',
      ],
    });
  }

  // Precipitation alerts
  const heavyRainForecast = forecast.find((day: any) => day.precipitation > 30);
  if (heavyRainForecast) {
    alerts.push({
      id: `rain-${Date.now()}`,
      type: 'watch',
      title: 'Heavy Rain Expected',
      description: `Heavy rainfall of ${heavyRainForecast.precipitation}mm expected on ${heavyRainForecast.date}.`,
      valid_from: new Date().toISOString(),
      valid_to: new Date(heavyRainForecast.date).toISOString(),
      impact: [
        'Field access may be limited',
        'Risk of waterlogging',
        'Delayed field operations',
        'Potential nutrient leaching',
      ],
      recommendations: [
        'Ensure drainage systems are clear',
        'Delay fertilizer application',
        'Plan indoor activities',
        'Monitor soil saturation',
      ],
    });
  }

  // Storm alerts
  if (current.condition === 'stormy' || forecast.some((day: any) => day.condition === 'stormy')) {
    alerts.push({
      id: `storm-${Date.now()}`,
      type: 'warning',
      title: 'Thunderstorm Warning',
      description: 'Thunderstorms with potential for heavy rain, hail, and strong winds.',
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      impact: ['Hail damage to crops', 'Lightning risk', 'Flash flooding', 'Equipment damage risk'],
      recommendations: [
        'Seek shelter immediately',
        'Move livestock to safe areas',
        'Secure all equipment',
        'Avoid open fields',
      ],
    });
  }

  // UV index alerts
  const highUvForecast = forecast.find((day: any) => day.uv_index_max > 8);
  if (highUvForecast) {
    alerts.push({
      id: `uv-${Date.now()}`,
      type: 'advisory',
      title: 'High UV Index Advisory',
      description: `UV index reaching ${highUvForecast.uv_index_max} on ${highUvForecast.date}.`,
      valid_from: new Date().toISOString(),
      valid_to: new Date(highUvForecast.date).toISOString(),
      impact: ['Sunburn risk for workers', 'Increased evapotranspiration', 'Heat stress on crops'],
      recommendations: [
        'Limit sun exposure during peak hours',
        'Use sun protection',
        'Increase irrigation if needed',
        'Schedule work for early morning or evening',
      ],
    });
  }

  return alerts;
}

// ============================================================================
// Weather Recommendation Generation
// ============================================================================

function generateWeatherRecommendations(weather: any, cropType?: string): string[] {
  const recommendations: string[] = [];

  // Temperature-based recommendations
  if (weather.temperature_c) {
    if (weather.temperature_c > 35) {
      recommendations.push(
        '🔥 High temperature alert: Ensure adequate irrigation and consider shade protection for sensitive crops.'
      );
    } else if (weather.temperature_c > 30) {
      recommendations.push(
        '☀️ Warm conditions: Monitor soil moisture closely and increase irrigation frequency.'
      );
    } else if (weather.temperature_c < 5) {
      recommendations.push(
        '❄️ Low temperature alert: Consider frost protection measures for vulnerable crops.'
      );
    } else if (weather.temperature_c >= 15 && weather.temperature_c <= 25) {
      recommendations.push(
        '🌱 Optimal temperature range: Good conditions for most farming activities.'
      );
    }
  }

  // Humidity-based recommendations
  if (weather.humidity_percent) {
    if (weather.humidity_percent > 80) {
      recommendations.push(
        '💧 High humidity: Monitor for fungal diseases and ensure good field ventilation.'
      );
    } else if (weather.humidity_percent < 30) {
      recommendations.push(
        '🌵 Low humidity: Increase irrigation frequency and monitor for water stress.'
      );
    }
  }

  // Precipitation-based recommendations
  if (weather.precipitation_mm) {
    if (weather.precipitation_mm > 20) {
      recommendations.push('🌧️ Heavy rain: Ensure proper drainage and delay field operations.');
    } else if (weather.precipitation_mm > 0) {
      recommendations.push(
        '🌦️ Light rain: Good conditions for transplanting and root establishment.'
      );
    } else if (weather.precipitation_mm === 0) {
      recommendations.push('☀️ No precipitation: Check irrigation needs for the day.');
    }
  }

  // Wind-based recommendations
  if (weather.wind_speed_kmh) {
    if (weather.wind_speed_kmh > 30) {
      recommendations.push('💨 Strong winds: Secure equipment and avoid spraying operations.');
    } else if (weather.wind_speed_kmh < 10) {
      recommendations.push(
        '🍃 Calm conditions: Ideal for spraying and pollination-dependent activities.'
      );
    }
  }

  // Crop-specific recommendations
  if (cropType) {
    const cropLower = cropType.toLowerCase();

    switch (cropLower) {
      case 'maize':
      case 'corn':
        if (weather.temperature_c && weather.temperature_c < 10) {
          recommendations.push(
            '🌽 Maize alert: Soil temperature below 10°C may delay germination. Consider delaying planting.'
          );
        }
        if (weather.temperature_c && weather.temperature_c > 35) {
          recommendations.push(
            '🌽 Maize alert: High temperatures during pollination can reduce kernel set. Ensure adequate moisture.'
          );
        }
        break;

      case 'tomato':
      case 'tomatoes':
        if (weather.humidity_percent && weather.humidity_percent > 70) {
          recommendations.push(
            '🍅 Tomato alert: High humidity increases risk of blight. Apply preventive fungicides and ensure good air circulation.'
          );
        }
        if (weather.temperature_c && weather.temperature_c > 32) {
          recommendations.push(
            '🍅 Tomato alert: Temperatures above 32°C can cause flower drop. Provide shade during peak heat.'
          );
        }
        break;

      case 'wheat':
      case 'barley':
      case 'oats':
        if (weather.precipitation_mm && weather.precipitation_mm > 50) {
          recommendations.push(
            '🌾 Cereal alert: Excessive rain may cause lodging. Monitor field conditions and consider early harvest if mature.'
          );
        }
        if (weather.wind_speed_kmh && weather.wind_speed_kmh > 40) {
          recommendations.push(
            '🌾 Cereal alert: High winds risk lodging in tall crops. Check field conditions.'
          );
        }
        break;

      case 'cotton':
        if (weather.humidity_percent && weather.humidity_percent > 60) {
          recommendations.push(
            '🌿 Cotton alert: High humidity may increase pest pressure. Scout fields regularly.'
          );
        }
        break;

      case 'sorghum':
      case 'millet':
        if (weather.temperature_c && weather.temperature_c > 38) {
          recommendations.push(
            '🌾 Sorghum/Millet alert: These crops are heat-tolerant but ensure adequate moisture during grain-filling.'
          );
        }
        break;

      case 'potato':
        if (weather.humidity_percent && weather.humidity_percent > 75) {
          recommendations.push(
            '🥔 Potato alert: High humidity favors late blight. Apply protective sprays and ensure hilling is adequate.'
          );
        }
        break;

      case 'cabbage':
      case 'kale':
      case 'spinach':
        if (weather.temperature_c && weather.temperature_c > 25) {
          recommendations.push(
            '🥬 Leafy green alert: Heat may cause bolting. Harvest mature plants promptly.'
          );
        }
        break;
    }
  }

  // UV index recommendations
  if (weather.uv_index_max && weather.uv_index_max > 8) {
    recommendations.push(
      '☀️ High UV index: Protect workers with sunscreen and hats. Consider shade cloth for sensitive crops.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Weather conditions are favorable for general farming activities.');
  }

  return recommendations;
}

function generateAgriculturalInsights(weather: any, cropType?: string): any[] {
  const insights: any[] = [];

  // Planting window insight
  if (
    weather.temperature_c >= 15 &&
    weather.temperature_c <= 25 &&
    weather.humidity_percent >= 40 &&
    weather.humidity_percent <= 70 &&
    weather.precipitation_mm < 5
  ) {
    insights.push({
      id: `planting-${Date.now()}`,
      category: 'planting',
      title: 'Optimal Planting Window',
      description:
        'Current conditions are ideal for planting most crops. Soil temperature and moisture are favorable.',
      recommendation: cropType
        ? `Consider planting ${cropType} within the next 2-3 days.`
        : 'Consider planting heat-tolerant varieties within the next 2-3 days.',
      priority: 'high',
    });
  }

  // Irrigation insight
  if (weather.temperature_c > 30 && weather.humidity_percent < 40) {
    insights.push({
      id: `irrigation-${Date.now()}`,
      category: 'irrigation',
      title: 'Increase Irrigation',
      description: `High evapotranspiration expected due to ${weather.temperature_c}°C temperatures and ${weather.humidity_percent}% humidity.`,
      recommendation:
        'Increase irrigation by 20-30% and schedule for early morning or evening to minimize losses.',
      priority: 'high',
    });
  }

  // Pest risk insight
  if (weather.humidity_percent > 75 && weather.temperature_c > 20) {
    insights.push({
      id: `pest-${Date.now()}`,
      category: 'pest',
      title: 'High Pest/Disease Risk',
      description: 'Warm, humid conditions favor pest proliferation and fungal diseases.',
      recommendation:
        'Scout fields for early signs of aphids, whiteflies, and fungal infections. Consider preventive treatments.',
      priority: 'high',
    });
  }

  // Harvest timing insight
  if (
    weather.precipitation_mm === 0 &&
    weather.humidity_percent < 60 &&
    weather.wind_speed_kmh < 20
  ) {
    insights.push({
      id: `harvest-${Date.now()}`,
      category: 'harvest',
      title: 'Good Harvest Conditions',
      description: 'Dry, stable weather is ideal for harvesting and drying crops.',
      recommendation: 'Prioritize harvesting mature crops. Good conditions for field drying.',
      priority: 'medium',
    });
  }

  // Field work insight
  if (weather.precipitation_mm > 10 || weather.wind_speed_kmh > 30) {
    insights.push({
      id: `fieldwork-${Date.now()}`,
      category: 'maintenance',
      title: 'Delay Field Operations',
      description: 'Current weather conditions are not suitable for field work.',
      recommendation:
        'Focus on equipment maintenance, record-keeping, or indoor tasks until conditions improve.',
      priority: 'medium',
    });
  }

  // Livestock insight
  if (weather.temperature_c > 35 || weather.temperature_c < 5) {
    insights.push({
      id: `livestock-${Date.now()}`,
      category: 'livestock',
      title: 'Livestock Weather Stress',
      description: `Temperature extremes (${weather.temperature_c}°C) can stress livestock.`,
      recommendation:
        weather.temperature_c > 35
          ? 'Provide shade, plenty of fresh water, and avoid moving animals during peak heat.'
          : 'Ensure adequate shelter, increase feed rations, and check water sources for freezing.',
      priority: 'high',
    });
  }

  return insights;
}

// ============================================================================
// Mock forecast generator (fallback - kept for compatibility)
// ============================================================================

function generateMockForecast(location: any, days: number): any[] {
  const forecast = [];
  const baseDate = new Date();
  const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'stormy'];

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    forecast.push({
      date: date.toISOString().split('T')[0],
      temperature_max: 25 + Math.floor(Math.random() * 10),
      temperature_min: 15 + Math.floor(Math.random() * 5),
      feels_like_max: 28 + Math.floor(Math.random() * 8),
      feels_like_min: 13 + Math.floor(Math.random() * 5),
      humidity: 50 + Math.floor(Math.random() * 30),
      precipitation: Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0,
      rain: 0,
      showers: 0,
      snowfall: 0,
      precipitation_hours: 0,
      precipitation_probability: Math.floor(Math.random() * 50),
      wind_speed_max: 5 + Math.floor(Math.random() * 20),
      wind_gusts_max: 10 + Math.floor(Math.random() * 25),
      wind_direction_dominant: Math.floor(Math.random() * 360),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      weather_code: 0,
      weather_description: 'Mock weather data',
      uv_index_max: 3 + Math.floor(Math.random() * 8),
      sunrise: '06:00',
      sunset: '18:30',
      daylight_duration_hours: 12.5,
    });
  }

  return forecast;
}
