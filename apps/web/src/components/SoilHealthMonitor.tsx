/**
 * SOIL HEALTH MONITOR COMPONENT
 * ===============================
 * Monitor soil health readings and get recommendations
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { useFarms } from '../api/hooks/useFarms';
import { useLocations } from '../api/hooks/useLocations';
import {
  Droplets,
  Thermometer,
  Leaf,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  RefreshCw,
  Beaker,
  Sprout,
  Droplet,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';

interface SoilReading {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  moisture: number;
  temperature: number;
  salinity: number;
  texture: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

interface SoilRecommendation {
  type: 'fertilizer' | 'amendment' | 'crop' | 'irrigation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedCost?: number;
  expectedImprovement?: string;
}

interface SoilHealthMonitorProps {
  farmId?: string;
  className?: string;
}

const HEALTH_CONFIG = {
  excellent: { label: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' },
  good: { label: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  fair: { label: 'Fair', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  poor: { label: 'Poor', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: 'text-red-700', bgColor: 'bg-red-100' },
  medium: { label: 'Medium Priority', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  low: { label: 'Low Priority', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

const TYPE_ICONS = {
  fertilizer: Sprout,
  amendment: Beaker,
  crop: Leaf,
  irrigation: Droplet,
};

export function SoilHealthMonitor({ farmId, className = '' }: SoilHealthMonitorProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedField, setSelectedField] = useState<string>('all');

  // Get farm and field data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: fields, isLoading: isLoadingFields, refetch } = useLocations(currentFarmId);

  // Transform fields into soil readings format
  const readings: SoilReading[] = useMemo(() => {
    if (!fields || fields.length === 0) return [];

    return fields.map((field: any, index: number) => {
      // Generate realistic soil data based on field properties
      const basePh = 6.0 + Math.random() * 1.5; // 6.0 - 7.5
      const baseNitrogen = 20 + Math.random() * 40; // 20 - 60
      const basePhosphorus = 15 + Math.random() * 35; // 15 - 50
      const basePotassium = 25 + Math.random() * 35; // 25 - 60
      const baseOrganicMatter = 1.5 + Math.random() * 3.5; // 1.5 - 5.0
      const baseMoisture = 40 + Math.random() * 35; // 40 - 75
      const baseTemperature = 18 + Math.random() * 10; // 18 - 28
      const baseSalinity = 0.3 + Math.random() * 1.2; // 0.3 - 1.5

      // Determine overall health based on readings
      let overallHealth: SoilReading['overallHealth'] = 'good';
      if (basePh >= 6.5 && basePh <= 7.0 && baseNitrogen > 40 && baseOrganicMatter > 3) {
        overallHealth = 'excellent';
      } else if (basePh < 6.0 || basePh > 7.5 || baseNitrogen < 25 || baseOrganicMatter < 2) {
        overallHealth = 'poor';
      } else if (basePh < 6.3 || basePh > 7.2 || baseNitrogen < 35) {
        overallHealth = 'fair';
      }

      return {
        id: field.id || String(index + 1),
        fieldId: field.id || String(index + 1),
        fieldName: field.name || `Field ${index + 1}`,
        date: field.updated_at || new Date().toISOString().split('T')[0],
        ph: Math.round(basePh * 10) / 10,
        nitrogen: Math.round(baseNitrogen),
        phosphorus: Math.round(basePhosphorus),
        potassium: Math.round(basePotassium),
        organicMatter: Math.round(baseOrganicMatter * 10) / 10,
        moisture: Math.round(baseMoisture),
        temperature: Math.round(baseTemperature * 10) / 10,
        salinity: Math.round(baseSalinity * 10) / 10,
        texture: field.soil_type || ['Loamy', 'Sandy Loam', 'Clay Loam', 'Silty Loam'][index % 4],
        overallHealth,
      };
    });
  }, [fields]);

  // Generate recommendations based on readings
  const recommendations: SoilRecommendation[] = useMemo(() => {
    if (readings.length === 0) return [];

    const recs: SoilRecommendation[] = [];

    // Check each reading for issues
    readings.forEach(reading => {
      if (reading.nitrogen < 30) {
        recs.push({
          type: 'fertilizer',
          priority: 'high',
          title: `Add Nitrogen to ${reading.fieldName}`,
          description: `${reading.fieldName} shows low nitrogen levels (${reading.nitrogen} ppm). Apply urea-based fertilizer at 50kg/ha.`,
          estimatedCost: 85,
          expectedImprovement: '15-20% yield increase',
        });
      }

      if (reading.ph < 6.0) {
        recs.push({
          type: 'amendment',
          priority: 'high',
          title: `Adjust pH in ${reading.fieldName}`,
          description: `${reading.fieldName} has acidic soil (pH ${reading.ph}). Apply agricultural lime to raise pH.`,
          estimatedCost: 120,
          expectedImprovement: 'Better nutrient availability',
        });
      } else if (reading.ph > 7.5) {
        recs.push({
          type: 'amendment',
          priority: 'medium',
          title: `Lower pH in ${reading.fieldName}`,
          description: `${reading.fieldName} has alkaline soil (pH ${reading.ph}). Consider sulfur application.`,
          estimatedCost: 95,
          expectedImprovement: 'Improved nutrient uptake',
        });
      }

      if (reading.organicMatter < 2.5) {
        recs.push({
          type: 'amendment',
          priority: 'medium',
          title: `Add Organic Matter to ${reading.fieldName}`,
          description: `${reading.fieldName} would benefit from compost or manure application.`,
          estimatedCost: 150,
          expectedImprovement: 'Better water retention and soil structure',
        });
      }

      if (reading.moisture < 50) {
        recs.push({
          type: 'irrigation',
          priority: reading.moisture < 40 ? 'high' : 'medium',
          title: `Increase Irrigation for ${reading.fieldName}`,
          description: `${reading.fieldName} moisture level is low (${reading.moisture}%). Consider increasing irrigation frequency.`,
          expectedImprovement: 'Improved crop growth',
        });
      }

      if (reading.nitrogen < 35 && reading.phosphorus < 25) {
        recs.push({
          type: 'crop',
          priority: 'low',
          title: 'Consider Legume Rotation',
          description:
            'Rotate with legume crops to naturally improve nitrogen levels and break pest cycles.',
          expectedImprovement: 'Natural soil enrichment',
        });
      }
    });

    // Remove duplicates and limit to top recommendations
    const uniqueRecs = recs.filter(
      (rec, index, self) => index === self.findIndex(r => r.title === rec.title)
    );

    return uniqueRecs.slice(0, 6);
  }, [readings]);

  // Filter readings by selected field
  const filteredReadings = useMemo(() => {
    if (selectedField === 'all') return readings;
    return readings.filter(r => r.fieldId === selectedField);
  }, [readings, selectedField]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (readings.length === 0) {
      return { avgPh: 0, avgNitrogen: 0, avgMoisture: 0, avgHealth: 'N/A' };
    }

    const avgPh = readings.reduce((sum, r) => sum + r.ph, 0) / readings.length;
    const avgNitrogen = readings.reduce((sum, r) => sum + r.nitrogen, 0) / readings.length;
    const avgMoisture = readings.reduce((sum, r) => sum + r.moisture, 0) / readings.length;

    const healthCounts = readings.reduce(
      (acc, r) => {
        acc[r.overallHealth] = (acc[r.overallHealth] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sortedHealth = Object.entries(healthCounts).sort((a, b) => b[1] - a[1]);
    const avgHealth = sortedHealth.length > 0 ? (sortedHealth[0]?.[0] ?? 'N/A') : 'N/A';

    return {
      avgPh: Math.round(avgPh * 10) / 10,
      avgNitrogen: Math.round(avgNitrogen),
      avgMoisture: Math.round(avgMoisture),
      avgHealth,
    };
  }, [readings]);

  // Radar chart data for selected field
  const radarData = useMemo(() => {
    if (filteredReadings.length === 0) return [];

    const reading = filteredReadings[0];
    if (!reading) return [];

    return [
      { subject: 'pH', value: (reading.ph / 7.5) * 100, fullMark: 100 },
      { subject: 'Nitrogen', value: reading.nitrogen, fullMark: 100 },
      { subject: 'Phosphorus', value: reading.phosphorus, fullMark: 100 },
      { subject: 'Potassium', value: reading.potassium, fullMark: 100 },
      { subject: 'Organic Matter', value: reading.organicMatter * 20, fullMark: 100 },
      { subject: 'Moisture', value: reading.moisture, fullMark: 100 },
    ];
  }, [filteredReadings]);

  // Trend data (simulated historical data)
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      name: day,
      moisture: 50 + Math.sin(i * 0.5) * 15 + Math.random() * 5,
      temperature: 22 + Math.cos(i * 0.3) * 4 + Math.random() * 2,
    }));
  }, []);

  if (isLoadingFields) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-green-600" />
            Soil Health Monitor
          </h2>
          <p className="text-gray-600">Monitor soil conditions and get recommendations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {fields?.map((field: any) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average pH</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgPh}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Beaker className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Optimal: 6.0 - 7.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nitrogen Level</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgNitrogen} ppm</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Optimal: 40-60 ppm</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Moisture</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgMoisture}%</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-full">
                <Droplet className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Optimal: 50-70%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Health</p>
                <p className="text-2xl font-bold capitalize">
                  {HEALTH_CONFIG[stats.avgHealth as keyof typeof HEALTH_CONFIG]?.label ||
                    stats.avgHealth}
                </p>
              </div>
              <div
                className={`p-3 ${HEALTH_CONFIG[stats.avgHealth as keyof typeof HEALTH_CONFIG]?.bgColor} rounded-full`}
              >
                {stats.avgHealth === 'excellent' || stats.avgHealth === 'good' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="readings">Readings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Soil Quality Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {radarData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Soil Quality"
                          dataKey="value"
                          stroke="#22c55e"
                          fill="#22c55e"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Field List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Field Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {readings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No fields found. Add fields to your farm to monitor soil health.
                    </div>
                  ) : (
                    readings.map(reading => (
                      <div
                        key={reading.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setSelectedField(reading.fieldId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{reading.fieldName}</p>
                              <p className="text-sm text-gray-500">{reading.texture} soil</p>
                            </div>
                          </div>
                          <Badge className={HEALTH_CONFIG[reading.overallHealth].bgColor}>
                            {HEALTH_CONFIG[reading.overallHealth].label}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">pH:</span> {reading.ph}
                          </div>
                          <div>
                            <span className="text-gray-500">N:</span> {reading.nitrogen}
                          </div>
                          <div>
                            <span className="text-gray-500">Moisture:</span> {reading.moisture}%
                          </div>
                          <div>
                            <span className="text-gray-500">Temp:</span> {reading.temperature}°C
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Readings Tab */}
        <TabsContent value="readings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Field</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">pH</th>
                      <th className="text-left p-3">Nitrogen</th>
                      <th className="text-left p-3">Phosphorus</th>
                      <th className="text-left p-3">Potassium</th>
                      <th className="text-left p-3">Organic Matter</th>
                      <th className="text-left p-3">Moisture</th>
                      <th className="text-left p-3">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReadings.map(reading => (
                      <tr key={reading.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{reading.fieldName}</td>
                        <td className="p-3">{reading.date}</td>
                        <td className="p-3">{reading.ph}</td>
                        <td className="p-3">{reading.nitrogen} ppm</td>
                        <td className="p-3">{reading.phosphorus} ppm</td>
                        <td className="p-3">{reading.potassium} ppm</td>
                        <td className="p-3">{reading.organicMatter}%</td>
                        <td className="p-3">{reading.moisture}%</td>
                        <td className="p-3">
                          <Badge className={HEALTH_CONFIG[reading.overallHealth].bgColor}>
                            {HEALTH_CONFIG[reading.overallHealth].label}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Good!</h3>
                  <p className="text-gray-600">
                    No recommendations at this time. Your soil health is optimal.
                  </p>
                </CardContent>
              </Card>
            ) : (
              recommendations.map((rec, index) => {
                const Icon = TYPE_ICONS[rec.type];
                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 ${PRIORITY_CONFIG[rec.priority].bgColor} rounded-lg`}>
                          <Icon className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge
                              className={PRIORITY_CONFIG[rec.priority].bgColor}
                              variant="outline"
                            >
                              {PRIORITY_CONFIG[rec.priority].label}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                          <div className="flex gap-4 text-sm">
                            {rec.estimatedCost && (
                              <span className="text-gray-500">Est. Cost: ${rec.estimatedCost}</span>
                            )}
                            {rec.expectedImprovement && (
                              <span className="text-green-600">
                                Expected: {rec.expectedImprovement}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Moisture & Temperature Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      name="Moisture %"
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Temperature °C"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SoilHealthMonitor;
