/**
 * WEATHER HOOKS
 * =============
 * TanStack Query hooks for weather data integration with Open-Meteo
 *
 * This module provides React Query hooks for fetching weather data,
 * forecasts, recommendations, and alerts using the Open-Meteo API
 * through our Supabase Edge Function.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import type { WeatherData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface WeatherForecast {
  date: string;
  temperature_max: number;
  temperature_min: number;
  feels_like_max: number;
  feels_like_min: number;
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';
  weather_code: number;
  weather_description: string;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  precipitation_hours: number;
  precipitation_probability: number;
  wind_speed_max: number;
  wind_gusts_max: number;
  wind_direction_dominant: number;
  uv_index_max: number;
  sunrise: string;
  sunset: string;
  daylight_duration_hours: number;
}

export interface CurrentWeather extends WeatherData {
  feels_like_c?: number;
  rain_mm?: number;
  showers_mm?: number;
  snowfall_mm?: number;
  wind_direction_deg?: number;
  wind_gusts_kmh?: number;
  sea_level_pressure_hpa?: number;
  cloud_cover_percent?: number;
  is_day?: boolean;
  weather_code?: number;
  weather_description?: string;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  valid_from: string;
  valid_to: string;
  impact: string[];
  recommendations: string[];
}

export interface AgriculturalInsight {
  id: string;
  category: 'planting' | 'irrigation' | 'pest' | 'harvest' | 'maintenance' | 'livestock';
  title: string;
  description: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  timezone?: string;
  population?: number;
}

export interface WeatherRecommendations {
  weather: CurrentWeather;
  recommendations: string[];
  agriculturalInsights: AgriculturalInsight[];
}

export interface WeatherResponse {
  location: {
    id?: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  current: CurrentWeather;
  weather?: CurrentWeather[];
}

export interface ForecastResponse {
  location: {
    id?: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  forecast: WeatherForecast[];
  days: number;
}

export interface AlertsResponse {
  alerts: WeatherAlert[];
  current: CurrentWeather;
  forecast: WeatherForecast[];
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const WEATHER_QUERY_KEYS = {
  all: ['weather'] as const,
  current: (locationId?: string, lat?: number, lon?: number) =>
    ['weather', 'current', locationId, lat, lon] as const,
  forecast: (locationId?: string, lat?: number, lon?: number, days?: number) =>
    ['weather', 'forecast', locationId, lat, lon, days] as const,
  byLocation: (locationId: string) => ['weather', 'location', locationId] as const,
  recommendations: (locationId?: string, lat?: number, lon?: number, cropType?: string) =>
    ['weather', 'recommendations', locationId, lat, lon, cropType] as const,
  alerts: (locationId?: string, lat?: number, lon?: number) =>
    ['weather', 'alerts', locationId, lat, lon] as const,
  geocode: (query: string) => ['weather', 'geocode', query] as const,
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const WEATHER_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const FORECAST_CACHE_TIME = 15 * 60 * 1000; // 15 minutes

// ============================================================================
// CURRENT WEATHER
// ============================================================================

interface UseCurrentWeatherOptions {
  locationId?: string;
  lat?: number;
  lon?: number;
  enabled?: boolean;
}

/**
 * Fetch current weather for a location
 */
export function useCurrentWeather(options: UseCurrentWeatherOptions = {}) {
  const { locationId, lat, lon, enabled = true } = options;

  return useQuery({
    queryKey: WEATHER_QUERY_KEYS.current(locationId, lat, lon),
    queryFn: async (): Promise<CurrentWeather | null> => {
      const params = new URLSearchParams();
      if (locationId) params.append('location_id', locationId);
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lon !== undefined) params.append('lon', lon.toString());

      const response = await apiClient.get<WeatherResponse>(
        `/functions/v1/weather/current?${params.toString()}`
      );
      return response.current || null;
    },
    enabled: enabled && !!(locationId || (lat !== undefined && lon !== undefined)),
    staleTime: WEATHER_CACHE_TIME,
    gcTime: WEATHER_CACHE_TIME * 2,
  });
}

// ============================================================================
// WEATHER FORECAST
// ============================================================================

interface UseWeatherForecastOptions {
  locationId?: string;
  lat?: number;
  lon?: number;
  days?: number;
  enabled?: boolean;
}

/**
 * Fetch weather forecast for a location
 */
export function useWeatherForecast(options: UseWeatherForecastOptions = {}) {
  const { locationId, lat, lon, days = 7, enabled = true } = options;

  return useQuery({
    queryKey: WEATHER_QUERY_KEYS.forecast(locationId, lat, lon, days),
    queryFn: async (): Promise<WeatherForecast[]> => {
      const params = new URLSearchParams();
      if (locationId) params.append('location_id', locationId);
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lon !== undefined) params.append('lon', lon.toString());
      params.append('days', Math.min(days, 16).toString()); // Open-Meteo max is 16 days

      const response = await apiClient.get<ForecastResponse>(
        `/functions/v1/weather/forecast?${params.toString()}`
      );
      return response.forecast || [];
    },
    enabled: enabled && !!(locationId || (lat !== undefined && lon !== undefined)),
    staleTime: FORECAST_CACHE_TIME,
    gcTime: FORECAST_CACHE_TIME * 2,
  });
}

// ============================================================================
// WEATHER BY LOCATION
// ============================================================================

interface UseWeatherByLocationOptions {
  locationId: string;
  enabled?: boolean;
}

/**
 * Fetch weather data for a specific location (includes current + historical)
 */
export function useWeatherByLocation(options: UseWeatherByLocationOptions) {
  const { locationId, enabled = true } = options;

  return useQuery({
    queryKey: WEATHER_QUERY_KEYS.byLocation(locationId),
    queryFn: async (): Promise<WeatherResponse | null> => {
      if (!locationId) return null;

      return await apiClient.get<WeatherResponse>(`/functions/v1/weather/${locationId}`);
    },
    enabled: enabled && !!locationId,
    staleTime: WEATHER_CACHE_TIME,
    gcTime: WEATHER_CACHE_TIME * 2,
  });
}

// ============================================================================
// WEATHER RECOMMENDATIONS
// ============================================================================

interface UseWeatherRecommendationsOptions {
  locationId?: string;
  lat?: number;
  lon?: number;
  cropType?: string;
  enabled?: boolean;
}

/**
 * Fetch weather-based agricultural recommendations
 */
export function useWeatherRecommendations(options: UseWeatherRecommendationsOptions = {}) {
  const { locationId, lat, lon, cropType, enabled = true } = options;

  return useQuery({
    queryKey: WEATHER_QUERY_KEYS.recommendations(locationId, lat, lon, cropType),
    queryFn: async (): Promise<WeatherRecommendations | null> => {
      const params = new URLSearchParams();
      if (locationId) params.append('location_id', locationId);
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lon !== undefined) params.append('lon', lon.toString());
      if (cropType) params.append('crop_type', cropType);

      return await apiClient.get<WeatherRecommendations>(
        `/functions/v1/weather/recommendations?${params.toString()}`
      );
    },
    enabled: enabled && !!(locationId || (lat !== undefined && lon !== undefined)),
    staleTime: WEATHER_CACHE_TIME,
    gcTime: WEATHER_CACHE_TIME * 2,
  });
}

// ============================================================================
// WEATHER ALERTS
// ============================================================================

interface UseWeatherAlertsOptions {
  locationId?: string;
  lat?: number;
  lon?: number;
  enabled?: boolean;
}

/**
 * Fetch weather alerts for a location
 */
export function useWeatherAlerts(options: UseWeatherAlertsOptions = {}) {
  const { locationId, lat, lon, enabled = true } = options;

  return useQuery({
    queryKey: WEATHER_QUERY_KEYS.alerts(locationId, lat, lon),
    queryFn: async (): Promise<AlertsResponse | null> => {
      const params = new URLSearchParams();
      if (locationId) params.append('location_id', locationId);
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lon !== undefined) params.append('lon', lon.toString());

      return await apiClient.get<AlertsResponse>(
        `/functions/v1/weather/alerts?${params.toString()}`
      );
    },
    enabled: enabled && !!(locationId || (lat !== undefined && lon !== undefined)),
    staleTime: WEATHER_CACHE_TIME,
    gcTime: WEATHER_CACHE_TIME * 2,
  });
}

// ============================================================================
// GEOCODING
// ============================================================================

interface UseGeocodeOptions {
  query: string;
  enabled?: boolean;
}

/**
 * Geocode a location name to coordinates
 */
export function useGeocode(options: UseGeocodeOptions) {
  const { query, enabled = true } = options;

  return useQuery({
    queryKey: WEATHER_QUERY_KEYS.geocode(query),
    queryFn: async (): Promise<GeocodingResult[]> => {
      if (!query || query.length < 2) return [];

      const params = new URLSearchParams();
      params.append('q', query);

      const response = await apiClient.get<{ query: string; results: GeocodingResult[] }>(
        `/functions/v1/weather/geocode?${params.toString()}`
      );
      return response.results || [];
    },
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - geocoding results don't change often
    gcTime: 24 * 60 * 60 * 1000,
  });
}

// ============================================================================
// COMBINED WEATHER HOOK
// ============================================================================

interface UseWeatherOptions {
  locationId?: string;
  lat?: number;
  lon?: number;
  days?: number;
  cropType?: string;
  enabled?: boolean;
}

/**
 * Combined hook for fetching all weather data at once
 */
export function useWeather(options: UseWeatherOptions = {}) {
  const { locationId, lat, lon, days = 7, cropType, enabled = true } = options;

  const current = useCurrentWeather({ locationId, lat, lon, enabled });
  const forecast = useWeatherForecast({ locationId, lat, lon, days, enabled });
  const recommendations = useWeatherRecommendations({ locationId, lat, lon, cropType, enabled });
  const alerts = useWeatherAlerts({ locationId, lat, lon, enabled });

  const isLoading =
    current.isLoading || forecast.isLoading || recommendations.isLoading || alerts.isLoading;
  const isError = current.isError || forecast.isError || recommendations.isError || alerts.isError;
  const error = current.error || forecast.error || recommendations.error || alerts.error;

  return {
    current: current.data,
    forecast: forecast.data,
    recommendations: recommendations.data,
    alerts: alerts.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      current.refetch();
      forecast.refetch();
      recommendations.refetch();
      alerts.refetch();
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get weather condition icon name based on condition
 */
export function getWeatherIcon(condition: string): string {
  const iconMap: Record<string, string> = {
    sunny: 'sun',
    partly_cloudy: 'cloud-sun',
    cloudy: 'cloud',
    rainy: 'cloud-rain',
    snowy: 'snowflake',
    stormy: 'cloud-lightning',
  };
  return iconMap[condition] || 'cloud';
}

/**
 * Get weather condition color based on condition
 */
export function getWeatherColor(condition: string): string {
  const colorMap: Record<string, string> = {
    sunny: 'text-yellow-500',
    partly_cloudy: 'text-blue-400',
    cloudy: 'text-gray-500',
    rainy: 'text-blue-600',
    snowy: 'text-cyan-400',
    stormy: 'text-purple-600',
  };
  return colorMap[condition] || 'text-gray-500';
}

/**
 * Get weather condition background color based on condition
 */
export function getWeatherBgColor(condition: string): string {
  const bgMap: Record<string, string> = {
    sunny: 'bg-yellow-100',
    partly_cloudy: 'bg-blue-100',
    cloudy: 'bg-gray-100',
    rainy: 'bg-blue-100',
    snowy: 'bg-cyan-100',
    stormy: 'bg-purple-100',
  };
  return bgMap[condition] || 'bg-gray-100';
}

/**
 * Format wind direction degrees to cardinal direction
 */
export function getWindDirection(degrees: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
}

/**
 * Get UV index risk level
 */
export function getUVRiskLevel(uvIndex: number): { level: string; color: string } {
  if (uvIndex <= 2) return { level: 'Low', color: 'text-green-600' };
  if (uvIndex <= 5) return { level: 'Moderate', color: 'text-yellow-600' };
  if (uvIndex <= 7) return { level: 'High', color: 'text-orange-600' };
  if (uvIndex <= 10) return { level: 'Very High', color: 'text-red-600' };
  return { level: 'Extreme', color: 'text-purple-600' };
}

/**
 * Prefetch weather data for a location (useful for route preloading)
 */
export function usePrefetchWeather() {
  const queryClient = useQueryClient();

  return {
    prefetchCurrent: (locationId?: string, lat?: number, lon?: number) => {
      return queryClient.prefetchQuery({
        queryKey: WEATHER_QUERY_KEYS.current(locationId, lat, lon),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (locationId) params.append('location_id', locationId);
          if (lat !== undefined) params.append('lat', lat.toString());
          if (lon !== undefined) params.append('lon', lon.toString());

          const response = await apiClient.get<WeatherResponse>(
            `/functions/v1/weather/current?${params.toString()}`
          );
          return response.current;
        },
        staleTime: WEATHER_CACHE_TIME,
      });
    },

    prefetchForecast: (locationId?: string, lat?: number, lon?: number, days = 7) => {
      return queryClient.prefetchQuery({
        queryKey: WEATHER_QUERY_KEYS.forecast(locationId, lat, lon, days),
        queryFn: async () => {
          const params = new URLSearchParams();
          if (locationId) params.append('location_id', locationId);
          if (lat !== undefined) params.append('lat', lat.toString());
          if (lon !== undefined) params.append('lon', lon.toString());
          params.append('days', Math.min(days, 16).toString());

          const response = await apiClient.get<ForecastResponse>(
            `/functions/v1/weather/forecast?${params.toString()}`
          );
          return response.forecast;
        },
        staleTime: FORECAST_CACHE_TIME,
      });
    },
  };
}
