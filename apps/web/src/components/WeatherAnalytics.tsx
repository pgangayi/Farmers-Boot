/**
 * WEATHER ANALYTICS COMPONENT
 * ===========================
 * Comprehensive weather analytics dashboard with forecasts,
 * historical data, and agricultural insights using Open-Meteo API
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  Cloud,
  CloudRain,
  Sun,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  TrendingUp,
  AlertTriangle,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gauge,
  Umbrella,
  SunMedium,
  CloudSun,
  Loader2,
  CloudLightning,
  Snowflake,
} from 'lucide-react';
import {
  useWeather,
  useWeatherForecast,
  useWeatherAlerts,
  useWeatherRecommendations,
  getWindDirection,
  getUVRiskLevel,
  type WeatherForecast,
  type WeatherAlert,
  type AgriculturalInsight,
} from '../api/hooks/useWeather';
import { useFarms } from '../api/hooks/useFarms';

interface WeatherAnalyticsProps {
  farmId?: string;
  locationId?: string;
  lat?: number;
  lon?: number;
  className?: string;
}

// Weather condition icons and colors
const WEATHER_CONDITIONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  sunny: { icon: <Sun className="w-6 h-6" />, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  partly_cloudy: {
    icon: <CloudSun className="w-6 h-6" />,
    color: 'text-blue-400',
    bg: 'bg-blue-100',
  },
  cloudy: { icon: <Cloud className="w-6 h-6" />, color: 'text-gray-500', bg: 'bg-gray-100' },
  rainy: { icon: <CloudRain className="w-6 h-6" />, color: 'text-blue-600', bg: 'bg-blue-100' },
  snowy: { icon: <Snowflake className="w-6 h-6" />, color: 'text-cyan-400', bg: 'bg-cyan-100' },
  stormy: {
    icon: <CloudLightning className="w-6 h-6" />,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
};

// Default weather condition for safety
const DEFAULT_WEATHER_CONDITION = {
  icon: <Cloud className="w-6 h-6" />,
  color: 'text-gray-500',
  bg: 'bg-gray-100',
};

// Helper function to safely get weather condition
const getWeatherCondition = (
  condition: string
): { icon: React.ReactNode; color: string; bg: string } => {
  return WEATHER_CONDITIONS[condition] || DEFAULT_WEATHER_CONDITION;
};

export function WeatherAnalytics({
  farmId,
  locationId: propLocationId,
  lat: propLat,
  lon: propLon,
  className = '',
}: WeatherAnalyticsProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  // Get farms to find location
  const { data: farms } = useFarms();
  const currentFarm = farms?.find(f => f.id === farmId) || farms?.[0];

  // Determine location coordinates
  const locationId = propLocationId || currentFarm?.location_id;
  // Note: Farm type doesn't have lat/lon directly - these must be passed as props
  // or fetched from the location record
  const lat = propLat;
  const lon = propLon;

  // Fetch all weather data
  const { current, forecast, recommendations, alerts, isLoading, isError, error, refetch } =
    useWeather({
      locationId,
      lat,
      lon,
      days: timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 16, // Open-Meteo max is 16
      enabled: !!(locationId || (lat && lon)),
    });

  // Calculate weather statistics from forecast
  const stats = useMemo(() => {
    if (!forecast || forecast.length === 0) {
      return { avgTemp: 0, totalRain: 0, avgHumidity: 0, avgWind: 0 };
    }

    const forecastData = forecast;
    const avgTemp =
      forecastData.reduce(
        (sum: number, d: WeatherForecast) => sum + (d.temperature_max + d.temperature_min) / 2,
        0
      ) / forecastData.length;
    const totalRain = forecastData.reduce(
      (sum: number, d: WeatherForecast) => sum + (d.precipitation || 0),
      0
    );
    const avgWind =
      forecastData.reduce((sum: number, d: WeatherForecast) => sum + (d.wind_speed_max || 0), 0) /
      forecastData.length;

    return { avgTemp, totalRain, avgHumidity: 0, avgWind }; // Humidity not available in daily forecast
  }, [forecast]);

  // Transform forecast data for display
  const forecastData = useMemo(() => {
    if (!forecast || forecast.length === 0) return [];

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return forecast.map((day: WeatherForecast, index: number) => {
      const date = new Date(day.date);
      const dayIndex = date.getDay();

      return {
        date: day.date,
        day: days[dayIndex] ?? 'Mon',
        temp_max: Math.round(day.temperature_max),
        temp_min: Math.round(day.temperature_min),
        condition: day.condition,
        precipitation: Math.round(day.precipitation || 0),
        humidity: 50, // Not available in daily forecast, using placeholder
        wind_speed: Math.round(day.wind_speed_max || 0),
        wind_direction: getWindDirection(day.wind_direction_dominant || 0),
        uv_index: day.uv_index_max || 0,
        precipitation_probability: day.precipitation_probability || 0,
      };
    });
  }, [forecast]);

  // Generate historical data from forecast for charts
  const historicalData = useMemo(() => {
    if (!forecastData.length) return [];

    return forecastData.map((day: any) => ({
      date: day.day,
      temp_max: day.temp_max,
      temp_min: day.temp_min,
      rainfall: day.precipitation,
      humidity: day.humidity,
    }));
  }, [forecastData]);

  // Ensure currentDay is always defined with a fallback
  const currentDay: any = forecastData[selectedDay] ??
    forecastData[0] ?? {
      date: new Date().toISOString().split('T')[0],
      day: 'Mon',
      temp_max: current?.temperature_c ? Math.round(current.temperature_c) + 2 : 25,
      temp_min: current?.temperature_c ? Math.round(current.temperature_c) - 2 : 15,
      condition: current?.condition || 'sunny',
      precipitation: current?.precipitation_mm || 0,
      humidity: current?.humidity_percent || 50,
      wind_speed: current?.wind_speed_kmh || 10,
      wind_direction: current?.wind_direction_deg
        ? getWindDirection(current.wind_direction_deg)
        : 'N',
      uv_index: 5,
    };

  // Get current weather data
  const currentWeather = current || {
    temperature_c: currentDay.temp_max,
    humidity_percent: currentDay.humidity,
    wind_speed_kmh: currentDay.wind_speed,
    precipitation_mm: currentDay.precipitation,
    condition: currentDay.condition,
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading weather data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Failed to Load Weather Data</h3>
            </div>
            <p className="text-red-700 mb-4">
              {error instanceof Error ? error.message : 'Unable to fetch weather information'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!locationId && !(lat && lon)) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">No Location Set</h3>
            </div>
            <p className="text-amber-700">
              Please set a location for your farm to view weather data. You can set the location in
              your farm settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-600" />
            Weather Analytics
          </h2>
          <p className="text-gray-600 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {currentFarm?.name || 'Farm'} weather - Powered by Open-Meteo
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => refetch()}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Current Weather Card */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl">
                {getWeatherCondition(currentDay.condition).icon}
              </div>
              <div>
                <div className="text-5xl font-bold">
                  {Math.round(currentWeather.temperature_c ?? currentDay.temp_max)}°C
                </div>
                <div className="text-blue-100 capitalize">
                  {(currentWeather.condition || currentDay.condition).replace('_', ' ')}
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Thermometer className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                <div className="text-sm text-blue-200">High / Low</div>
                <div className="font-semibold">
                  {currentDay.temp_max}° / {currentDay.temp_min}°
                </div>
              </div>
              <div className="text-center">
                <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                <div className="text-sm text-blue-200">Humidity</div>
                <div className="font-semibold">
                  {currentWeather.humidity_percent ?? currentDay.humidity}%
                </div>
              </div>
              <div className="text-center">
                <Wind className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                <div className="text-sm text-blue-200">Wind</div>
                <div className="font-semibold">
                  {currentWeather.wind_speed_kmh ?? currentDay.wind_speed} km/h{' '}
                  {currentDay.wind_direction}
                </div>
              </div>
              <div className="text-center">
                <Umbrella className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                <div className="text-sm text-blue-200">Rain</div>
                <div className="font-semibold">
                  {currentWeather.precipitation_mm ?? currentDay.precipitation} mm
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {forecastData.map((day: any, index: number) => (
              <button
                key={day.date}
                onClick={() => setSelectedDay(index)}
                className={`flex-shrink-0 p-3 rounded-lg text-center transition-colors ${
                  selectedDay === index
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="text-sm font-medium text-gray-600">{day.day}</div>
                <div className={`my-2 ${getWeatherCondition(day.condition).color}`}>
                  {getWeatherCondition(day.condition).icon}
                </div>
                <div className="text-sm font-semibold">{day.temp_max}°</div>
                <div className="text-xs text-gray-500">{day.temp_min}°</div>
                {day.precipitation > 0 && (
                  <div className="text-xs text-blue-500 mt-1">{day.precipitation}mm</div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Temperature</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgTemp.toFixed(1)}°C</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Thermometer className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expected Rainfall</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalRain)} mm</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CloudRain className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rain Probability</p>
                <p className="text-2xl font-bold text-gray-900">
                  {forecastData[selectedDay]?.precipitation_probability ?? 0}%
                </p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Droplets className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wind Speed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgWind.toFixed(1)} km/h</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Wind className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Temperature Trend</CardTitle>
              <div className="flex gap-1">
                {(['7d', '14d', '30d'] as const).map(range => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="temp_max"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#fecaca"
                    name="Max Temp"
                  />
                  <Area
                    type="monotone"
                    dataKey="temp_min"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#bfdbfe"
                    name="Min Temp"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rainfall Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rainfall Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="rainfall"
                    fill="#3b82f6"
                    name="Rainfall (mm)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Alerts and Agricultural Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts?.alerts && alerts.alerts.length > 0 ? (
                alerts.alerts.map((alert: WeatherAlert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'warning'
                        ? 'bg-red-50 border-red-500'
                        : alert.type === 'watch'
                          ? 'bg-amber-50 border-amber-500'
                          : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      </div>
                      <Badge
                        className={
                          alert.type === 'warning'
                            ? 'bg-red-100 text-red-800'
                            : alert.type === 'watch'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {alert.type}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 font-medium">Potential Impact:</p>
                      <ul className="text-sm text-gray-600 mt-1">
                        {alert.impact.map((item: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sun className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No weather alerts at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agricultural Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Agricultural Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations?.agriculturalInsights &&
              recommendations.agriculturalInsights.length > 0 ? (
                recommendations.agriculturalInsights.map((insight: AgriculturalInsight) => (
                  <div key={insight.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {insight.category === 'planting' && (
                          <Sun className="w-4 h-4 text-green-500" />
                        )}
                        {insight.category === 'irrigation' && (
                          <Droplets className="w-4 h-4 text-blue-500" />
                        )}
                        {insight.category === 'pest' && <Eye className="w-4 h-4 text-red-500" />}
                        {insight.category === 'harvest' && (
                          <Calendar className="w-4 h-4 text-amber-500" />
                        )}
                        {insight.category === 'livestock' && (
                          <SunMedium className="w-4 h-4 text-orange-500" />
                        )}
                        {insight.category === 'maintenance' && (
                          <Gauge className="w-4 h-4 text-gray-500" />
                        )}
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      </div>
                      <Badge
                        className={
                          insight.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : insight.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                        }
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{insight.description}</p>
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Recommendation:</span>{' '}
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No specific insights at this time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UV Index and Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Weather Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <SunMedium className="w-5 h-5 text-orange-500" />
                <span className="font-medium">UV Index</span>
              </div>
              <p className="text-2xl font-bold">{forecastData[selectedDay]?.uv_index ?? 0}</p>
              <p
                className={`text-sm ${getUVRiskLevel(forecastData[selectedDay]?.uv_index ?? 0).color}`}
              >
                {getUVRiskLevel(forecastData[selectedDay]?.uv_index ?? 0).level}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-5 h-5 text-cyan-500" />
                <span className="font-medium">Wind Gusts</span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round(forecast?.[selectedDay]?.wind_gusts_max || 0)} km/h
              </p>
              <p className="text-sm text-gray-600">
                Direction: {getWindDirection(forecast?.[selectedDay]?.wind_direction_dominant || 0)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Pressure</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(current?.pressure_hpa || 1013)} hPa</p>
              <p className="text-sm text-gray-600">
                {current?.pressure_hpa && current.pressure_hpa > 1020
                  ? 'High pressure - stable weather'
                  : current?.pressure_hpa && current.pressure_hpa < 1000
                    ? 'Low pressure - possible precipitation'
                    : 'Normal pressure'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WeatherAnalytics;
