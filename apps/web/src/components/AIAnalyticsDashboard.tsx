import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Brain,
  BarChart3,
  Activity,
  Zap,
  Target,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  Sprout,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { apiClient } from '@/lib';

interface AIInsight {
  id: string;
  type:
    | 'crop_health'
    | 'weather_optimization'
    | 'resource_allocation'
    | 'yield_prediction'
    | 'cost_optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  recommendation: string;
  potential_savings?: number;
  timeline?: string;
  metrics?: {
    current?: number;
    predicted?: number;
    unit?: string;
  };
}

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    precipitation: number;
  }>;
}

interface CropHealthMetrics {
  overall_health: number;
  growth_stage: string;
  stress_factors: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
}

interface AIAnalyticsDashboardProps {
  farmId?: string;
}

const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({ farmId }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('insights');

  // Fetch AI insights from API
  const {
    data: aiInsights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery<AIInsight[]>({
    queryKey: ['ai-insights', selectedTimeRange, farmId],
    queryFn: async () => {
      const params = new URLSearchParams({
        time_range: selectedTimeRange,
        ...(farmId && { farm_id: farmId }),
      });
      return await apiClient.get<AIInsight[]>(`/ai/insights?${params}`);
    },
  });

  // Fetch weather data from API
  const {
    data: weatherData,
    isLoading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather,
  } = useQuery<WeatherData>({
    queryKey: ['weather-data', farmId],
    queryFn: async () => {
      const params = farmId ? `?farm_id=${farmId}` : '';
      return await apiClient.get<WeatherData>(`/weather/current${params}`);
    },
  });

  // Fetch crop health metrics from API
  const {
    data: cropHealth,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useQuery<CropHealthMetrics>({
    queryKey: ['crop-health', farmId],
    queryFn: async () => {
      const params = farmId ? `?farm_id=${farmId}` : '';
      return await apiClient.get<CropHealthMetrics>(`/crops/health-metrics${params}`);
    },
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crop_health':
        return <Sprout className="h-5 w-5" />;
      case 'weather_optimization':
        return <Sun className="h-5 w-5" />;
      case 'resource_allocation':
        return <Droplets className="h-5 w-5" />;
      case 'yield_prediction':
        return <BarChart3 className="h-5 w-5" />;
      case 'cost_optimization':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const totalPotentialSavings = useMemo(() => {
    return aiInsights?.reduce((sum, insight) => sum + (insight.potential_savings || 0), 0) || 0;
  }, [aiInsights]);

  const avgConfidence = useMemo(() => {
    if (!aiInsights || aiInsights.length === 0) return 0;
    return Math.round(aiInsights.reduce((sum, i) => sum + i.confidence, 0) / aiInsights.length);
  }, [aiInsights]);

  const handleRefreshAll = () => {
    refetchInsights();
    refetchWeather();
    refetchHealth();
  };

  const handleGenerateAnalysis = async () => {
    try {
      await apiClient.post('/ai/generate-analysis', {
        farm_id: farmId,
        time_range: selectedTimeRange,
      });
      refetchInsights();
    } catch (error) {
      console.error('Failed to generate analysis:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered insights and recommendations for optimal farm management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </label>
            <select
              value={selectedTimeRange}
              onChange={e => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
              title="Select time range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={handleGenerateAnalysis}>
            <Brain className="h-4 w-4 mr-2" />
            Generate New Analysis
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{aiInsights?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {aiInsights?.filter(i => i.impact === 'high').length || 0} high priority
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${totalPotentialSavings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This time period</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{avgConfidence}%</div>
                <p className="text-xs text-muted-foreground">AI prediction accuracy</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crop Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{cropHealth?.overall_health || 0}%</div>
                <p className="text-xs text-muted-foreground">Overall farm health score</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="weather">Weather Analysis</TabsTrigger>
          <TabsTrigger value="health">Crop Health</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading AI insights...</span>
            </div>
          ) : insightsError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Error loading AI insights</p>
              <Button variant="outline" size="sm" onClick={() => refetchInsights()}>
                Retry
              </Button>
            </div>
          ) : !aiInsights || aiInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Brain className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No AI insights available</p>
              <Button variant="outline" size="sm" onClick={handleGenerateAnalysis}>
                Generate Analysis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiInsights.map(insight => (
                <Card key={insight.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(insight.type)}
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline">{insight.confidence}% confidence</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base leading-relaxed">
                      {insight.description}
                    </CardDescription>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Recommendation:
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {insight.recommendation}
                      </p>
                    </div>

                    {insight.metrics && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Expected Improvement:
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {insight.metrics.current} {'->'} {insight.metrics.predicted}
                          </div>
                          <div className="text-xs text-blue-600">{insight.metrics.unit}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-4">
                        {insight.timeline && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {insight.timeline}
                            </span>
                          </div>
                        )}
                        {insight.potential_savings && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              ${insight.potential_savings.toLocaleString()} savings
                            </span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Weather */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sun className="h-5 w-5" />
                  Current Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weatherLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : weatherError ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <p className="text-sm text-muted-foreground">Error loading weather</p>
                  </div>
                ) : !weatherData ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Sun className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No weather data available</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Temperature</span>
                      <div className="flex items-center space-x-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-lg font-bold">{weatherData.temperature}°F</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Humidity</span>
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="text-lg font-bold">{weatherData.humidity}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Wind Speed</span>
                      <div className="flex items-center space-x-2">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <span className="text-lg font-bold">{weatherData.wind_speed} mph</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Rainfall</span>
                      <div className="flex items-center space-x-2">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-lg font-bold">{weatherData.rainfall}"</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 5-Day Forecast */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  5-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weatherLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : weatherError ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                    <p className="text-sm text-muted-foreground">Error loading forecast</p>
                  </div>
                ) : !weatherData?.forecast || weatherData.forecast.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No forecast data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weatherData.forecast.map((day, index) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium">{day.date}</div>
                          <div className="flex items-center space-x-1">
                            {day.precipitation > 0.5 ? (
                              <Droplets className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Sun className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {day.precipitation}" rain
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-red-600">{day.high}°</span>
                            <span className="text-sm text-gray-400">/</span>
                            <span className="text-sm font-medium text-blue-600">{day.low}°</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {healthLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading crop health data...</span>
            </div>
          ) : healthError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Error loading crop health data</p>
              <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
                Retry
              </Button>
            </div>
          ) : !cropHealth ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Sprout className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No crop health data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Health Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    Overall Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(cropHealth.overall_health / 100) * 352} 352`}
                          className="text-green-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{cropHealth.overall_health}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Growth Stage: <span className="font-medium">{cropHealth.growth_stage}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stress Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    Stress Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cropHealth.stress_factors.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No stress factors detected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cropHealth.stress_factors.map((factor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{factor.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {factor.description}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              factor.severity === 'high' && 'bg-red-100 text-red-800',
                              factor.severity === 'medium' && 'bg-yellow-100 text-yellow-800',
                              factor.severity === 'low' && 'bg-green-100 text-green-800'
                            )}
                          >
                            {factor.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cropHealth.recommendations.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No recommendations available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {cropHealth.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalyticsDashboard;
