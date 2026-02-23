/**
 * WEATHER ANALYTICS COMPONENT
 * ===========================
 * Comprehensive weather analytics dashboard with forecasts,
 * historical data, and agricultural insights
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
} from 'lucide-react';
import type { WeatherData } from '../api/types';

interface WeatherAnalyticsProps {
  farmId?: string;
  className?: string;
}

interface DailyForecast {
  date: string;
  day: string;
  temp_max: number;
  temp_min: number;
  condition: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy';
  precipitation: number;
  humidity: number;
  wind_speed: number;
  wind_direction: string;
  uv_index: number;
}

interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  valid_from: string;
  valid_to: string;
  impact: string[];
}

interface AgriculturalInsight {
  id: string;
  category: 'planting' | 'irrigation' | 'pest' | 'harvest';
  title: string;
  description: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
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
  stormy: { icon: <Umbrella className="w-6 h-6" />, color: 'text-purple-600', bg: 'bg-purple-100' },
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

// Generate sample forecast data (in production, this would come from API)
const generateForecast = (): DailyForecast[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const conditions: DailyForecast['condition'][] = [
    'sunny',
    'partly_cloudy',
    'cloudy',
    'rainy',
    'stormy',
  ];
  const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0] || '2024-01-01';
    const dayIndex = date.getDay();
    const conditionIndex = Math.floor(Math.random() * conditions.length);
    const windIndex = Math.floor(Math.random() * windDirections.length);

    return {
      date: dateStr,
      day: days[dayIndex] || 'Mon',
      temp_max: 25 + Math.floor(Math.random() * 10),
      temp_min: 15 + Math.floor(Math.random() * 5),
      condition: conditions[conditionIndex] || 'sunny',
      precipitation: Math.floor(Math.random() * 30),
      humidity: 40 + Math.floor(Math.random() * 40),
      wind_speed: 5 + Math.floor(Math.random() * 20),
      wind_direction: windDirections[windIndex] || 'N',
      uv_index: 3 + Math.floor(Math.random() * 8),
    };
  });
};

// Generate historical data for charts
const generateHistoricalData = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temp_max: 25 + Math.floor(Math.random() * 10),
      temp_min: 12 + Math.floor(Math.random() * 8),
      rainfall: Math.random() > 0.6 ? Math.floor(Math.random() * 20) : 0,
      humidity: 40 + Math.floor(Math.random() * 40),
    };
  });
};

// Sample weather alerts
const WEATHER_ALERTS: WeatherAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Heavy Rain Warning',
    description:
      'Heavy rainfall expected (50-70mm) over the next 48 hours. Risk of localized flooding in low-lying areas.',
    valid_from: new Date().toISOString(),
    valid_to: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    impact: [
      'Field access may be limited',
      'Delay planting activities',
      'Monitor drainage systems',
    ],
  },
  {
    id: '2',
    type: 'advisory',
    title: 'High Temperature Advisory',
    description:
      'Temperatures expected to reach 35°C. Ensure adequate water supply for livestock and crops.',
    valid_from: new Date().toISOString(),
    valid_to: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    impact: ['Increase irrigation frequency', 'Provide shade for livestock', 'Monitor crop stress'],
  },
];

// Sample agricultural insights
const AGRICULTURAL_INSIGHTS: AgriculturalInsight[] = [
  {
    id: '1',
    category: 'planting',
    title: 'Optimal Planting Window',
    description: 'Current soil temperature and moisture conditions are ideal for maize planting.',
    recommendation: 'Consider planting maize varieties SC 403 or SC 513 within the next 5-7 days.',
    priority: 'high',
  },
  {
    id: '2',
    category: 'irrigation',
    title: 'Irrigation Scheduling',
    description:
      'Based on forecast, reduce irrigation by 30% over the next week due to expected rainfall.',
    recommendation:
      'Skip scheduled irrigation for fields with good drainage. Monitor soil moisture levels.',
    priority: 'medium',
  },
  {
    id: '3',
    category: 'pest',
    title: 'Pest Risk Alert',
    description: 'High humidity conditions favor aphid proliferation in vegetable crops.',
    recommendation:
      'Scout vegetable fields regularly. Consider preventive application of neem oil.',
    priority: 'high',
  },
  {
    id: '4',
    category: 'harvest',
    title: 'Harvest Timing',
    description: 'Dry conditions expected next week - ideal for wheat harvesting.',
    recommendation: 'Prepare harvesting equipment. Plan to harvest wheat fields by mid-week.',
    priority: 'medium',
  },
];

export function WeatherAnalytics({ farmId, className = '' }: WeatherAnalyticsProps) {
  const [forecast] = useState<DailyForecast[]>(generateForecast);
  const [historicalData] = useState(generateHistoricalData);
  const [selectedDay, setSelectedDay] = useState(0);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  // Calculate weather statistics
  const stats = useMemo(() => {
    const avgTemp =
      forecast.reduce((sum, d) => sum + (d.temp_max + d.temp_min) / 2, 0) / forecast.length;
    const totalRain = forecast.reduce((sum, d) => sum + d.precipitation, 0);
    const avgHumidity = forecast.reduce((sum, d) => sum + d.humidity, 0) / forecast.length;
    const avgWind = forecast.reduce((sum, d) => sum + d.wind_speed, 0) / forecast.length;

    return { avgTemp, totalRain, avgHumidity, avgWind };
  }, [forecast]);

  // Ensure currentDay is always defined with a fallback
  const currentDay: DailyForecast = forecast[selectedDay] ??
    forecast[0] ?? {
      date: new Date().toISOString().split('T')[0] || '2024-01-01',
      day: 'Mon',
      temp_max: 25,
      temp_min: 15,
      condition: 'sunny',
      precipitation: 0,
      humidity: 50,
      wind_speed: 10,
      wind_direction: 'N',
      uv_index: 5,
    };

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
            Farm weather station data
          </p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
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
                  {Math.round((currentDay.temp_max + currentDay.temp_min) / 2)}°C
                </div>
                <div className="text-blue-100 capitalize">
                  {currentDay.condition.replace('_', ' ')}
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  {new Date(currentDay.date).toLocaleDateString('en-US', {
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
                <div className="font-semibold">{currentDay.humidity}%</div>
              </div>
              <div className="text-center">
                <Wind className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                <div className="text-sm text-blue-200">Wind</div>
                <div className="font-semibold">
                  {currentDay.wind_speed} km/h {currentDay.wind_direction}
                </div>
              </div>
              <div className="text-center">
                <Umbrella className="w-5 h-5 mx-auto mb-1 text-blue-200" />
                <div className="text-sm text-blue-200">Rain</div>
                <div className="font-semibold">{currentDay.precipitation} mm</div>
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
            {forecast.map((day, index) => (
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
                <p className="text-2xl font-bold text-gray-900">{stats.totalRain} mm</p>
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
                <p className="text-sm text-gray-600">Avg Humidity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgHumidity.toFixed(0)}%</p>
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
                <AreaChart data={historicalData.slice(-7)}>
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
                <BarChart data={historicalData.slice(-7)}>
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
              {WEATHER_ALERTS.map(alert => (
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
                      {alert.impact.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
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
              {AGRICULTURAL_INSIGHTS.map(insight => (
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
                      <span className="font-medium">Recommendation:</span> {insight.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Humidity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Humidity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name="Humidity %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WeatherAnalytics;
