/**
 * IRRIGATION OPTIMIZER COMPONENT
 * ===============================
 * Manage irrigation systems and optimize water usage
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import {
  useIrrigationSystems,
  useIrrigationSchedules,
  useCreateIrrigationSystem,
  useUpdateIrrigationSystem,
  useDeleteIrrigationSystem,
  useCreateIrrigationSchedule,
  type IrrigationSystem,
  type IrrigationSchedule,
} from '../api/hooks/useIrrigation';
import { useFarms } from '../api/hooks/useFarms';
import { useLocations } from '../api/hooks/useLocations';
import { useCrops } from '../api/hooks/useCrops';
import {
  Droplets,
  Cloud,
  Sun,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Plus,
  MapPin,
  Zap,
  Settings,
  Calendar,
  Gauge,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Play,
  Pause,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface IrrigationOptimizerProps {
  farmId?: string;
  className?: string;
}

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: 'text-green-700', bgColor: 'bg-green-100' },
  maintenance: { label: 'Maintenance', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  broken: { label: 'Broken', color: 'text-red-700', bgColor: 'bg-red-100' },
  retired: { label: 'Retired', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

const SYSTEM_TYPE_CONFIG = {
  drip: { label: 'Drip', icon: Droplets },
  sprinkler: { label: 'Sprinkler', icon: Cloud },
  flood: { label: 'Flood', icon: Droplets },
  center_pivot: { label: 'Center Pivot', icon: Zap },
  other: { label: 'Other', icon: Settings },
};

const MOISTURE_THRESHOLDS = {
  optimal: { min: 50, max: 75, label: 'Optimal', color: 'text-green-600' },
  needs_water: { min: 30, max: 50, label: 'Needs Water', color: 'text-amber-600' },
  critical: { min: 0, max: 30, label: 'Critical', color: 'text-red-600' },
  overwatered: { min: 75, max: 100, label: 'Overwatered', color: 'text-blue-600' },
};

export function IrrigationOptimizer({ farmId, className = '' }: IrrigationOptimizerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSystem, setSelectedSystem] = useState<IrrigationSystem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get farm and data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: fields, isLoading: isLoadingFields } = useLocations(currentFarmId);
  const { data: crops } = useCrops(currentFarmId);
  const { data: systems, isLoading: isLoadingSystems, error, refetch } = useIrrigationSystems();
  const { data: schedules } = useIrrigationSchedules();

  // Mutations
  const createSystem = useCreateIrrigationSystem();
  const updateSystem = useUpdateIrrigationSystem();
  const deleteSystem = useDeleteIrrigationSystem();
  const createSchedule = useCreateIrrigationSchedule();

  // Transform systems into zone data with moisture levels
  const zones = useMemo(() => {
    if (!systems || systems.length === 0) return [];

    return systems.map(system => {
      // Calculate moisture level based on last maintenance and status
      const lastMaintenance = system.last_maintenance_date
        ? new Date(system.last_maintenance_date)
        : null;
      const daysSinceMaintenance = lastMaintenance
        ? Math.floor((Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24))
        : 30;

      // Calculate estimated moisture level based on system status and maintenance
      // In production, this would be replaced with actual sensor data from the API
      const baseMoisture = system.status === 'operational' ? 60 : 40;
      const moistureLevel = Math.max(20, Math.min(90, baseMoisture - daysSinceMaintenance * 0.5));

      // Determine moisture status
      let moistureStatus: keyof typeof MOISTURE_THRESHOLDS = 'optimal';
      if (moistureLevel < 30) moistureStatus = 'critical';
      else if (moistureLevel < 50) moistureStatus = 'needs_water';
      else if (moistureLevel > 75) moistureStatus = 'overwatered';

      // Get field name
      const field = fields?.find((f: any) => f.id === system.field_id);
      const fieldName = field?.name || 'Unknown Field';

      // Get crop for this field
      const fieldCrop = crops?.find((c: any) => c.field_id === system.field_id);

      return {
        ...system,
        fieldName,
        cropType: fieldCrop?.name || 'Unknown Crop',
        moistureLevel: Math.round(moistureLevel),
        moistureStatus,
        waterUsage: system.flow_rate_liters_per_hour
          ? system.flow_rate_liters_per_hour * (system.coverage_area_hectares || 1) * 24
          : 0,
      };
    });
  }, [systems, fields, crops]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (zones.length === 0) {
      return { total: 0, operational: 0, needsAttention: 0, totalWaterUsage: 0, avgMoisture: 0 };
    }

    const operational = zones.filter(z => z.status === 'operational').length;
    const needsAttention = zones.filter(
      z => z.moistureStatus === 'critical' || z.moistureStatus === 'needs_water'
    ).length;
    const totalWaterUsage = zones.reduce((sum, z) => sum + z.waterUsage, 0);
    const avgMoisture = zones.reduce((sum, z) => sum + z.moistureLevel, 0) / zones.length;

    return {
      total: zones.length,
      operational,
      needsAttention,
      totalWaterUsage: Math.round(totalWaterUsage),
      avgMoisture: Math.round(avgMoisture),
    };
  }, [zones]);

  // Weather data (simulated - in real app would come from weather API)
  const weather = useMemo(
    () => ({
      temperature: 28,
      humidity: 65,
      rainfall: 0,
      windSpeed: 12,
      forecast: 'Sunny',
    }),
    []
  );

  // Water usage trend data
  const waterTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      name: day,
      usage: 1500 + Math.sin(i * 0.5) * 500 + Math.random() * 200,
      optimal: 1800,
    }));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteSystem.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete system:', error);
    }
  };

  const handleToggleStatus = async (system: IrrigationSystem) => {
    try {
      const newStatus = system.status === 'operational' ? 'maintenance' : 'operational';
      await updateSystem.mutateAsync({
        id: system.id,
        data: { status: newStatus },
      });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const isLoading = isLoadingFields || isLoadingSystems;

  if (isLoading) {
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

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">Failed to load irrigation data.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            Irrigation Optimizer
          </h2>
          <p className="text-gray-600">Manage irrigation systems and optimize water usage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add System
          </Button>
        </div>
      </div>

      {/* Weather Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sun className="w-10 h-10 text-amber-500" />
              <div>
                <p className="text-sm text-gray-600">Current Weather</p>
                <p className="text-xl font-bold">{weather.forecast}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6 text-center">
              <div>
                <Thermometer className="w-5 h-5 mx-auto text-red-500 mb-1" />
                <p className="text-sm text-gray-600">Temp</p>
                <p className="font-bold">{weather.temperature}°C</p>
              </div>
              <div>
                <Droplets className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <p className="text-sm text-gray-600">Humidity</p>
                <p className="font-bold">{weather.humidity}%</p>
              </div>
              <div>
                <Cloud className="w-5 h-5 mx-auto text-gray-500 mb-1" />
                <p className="text-sm text-gray-600">Rain</p>
                <p className="font-bold">{weather.rainfall}mm</p>
              </div>
              <div>
                <Wind className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
                <p className="text-sm text-gray-600">Wind</p>
                <p className="font-bold">{weather.windSpeed}km/h</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Systems</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operational</p>
                <p className="text-2xl font-bold text-green-600">{stats.operational}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-amber-600">{stats.needsAttention}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Moisture</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgMoisture}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Droplets className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.needsAttention > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Attention Required</span>
            </div>
            <p className="text-amber-700">
              {stats.needsAttention} zone(s) need irrigation. Check moisture levels below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zone Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zone Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {zones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No irrigation systems found. Add a system to get started.
                    </div>
                  ) : (
                    zones.map(zone => (
                      <div
                        key={zone.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => setSelectedSystem(zone)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{zone.name}</p>
                              <p className="text-sm text-gray-500">
                                {zone.fieldName} - {zone.cropType}
                              </p>
                            </div>
                          </div>
                          <Badge className={STATUS_CONFIG[zone.status]?.bgColor}>
                            {STATUS_CONFIG[zone.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Moisture</span>
                              <span className={MOISTURE_THRESHOLDS[zone.moistureStatus]?.color}>
                                {zone.moistureLevel}%
                              </span>
                            </div>
                            <Progress value={zone.moistureLevel} className="h-2" />
                          </div>
                          <Button
                            size="sm"
                            variant={zone.status === 'operational' ? 'outline' : 'default'}
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleStatus(zone);
                            }}
                          >
                            {zone.status === 'operational' ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Water Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Water Usage Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={waterTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="usage" fill="#3b82f6" name="Usage (L)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Systems Tab */}
        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Irrigation Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Field</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Flow Rate</th>
                      <th className="text-left p-3">Coverage</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No systems found
                        </td>
                      </tr>
                    ) : (
                      zones.map(system => (
                        <tr key={system.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{system.name}</td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {SYSTEM_TYPE_CONFIG[system.system_type]?.label}
                            </Badge>
                          </td>
                          <td className="p-3">{system.fieldName}</td>
                          <td className="p-3">
                            <Badge className={STATUS_CONFIG[system.status]?.bgColor}>
                              {STATUS_CONFIG[system.status]?.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {system.flow_rate_liters_per_hour
                              ? `${system.flow_rate_liters_per_hour} L/hr`
                              : '-'}
                          </td>
                          <td className="p-3">
                            {system.coverage_area_hectares
                              ? `${system.coverage_area_hectares} ha`
                              : '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                title="Edit"
                                onClick={() => {
                                  setSelectedSystem(system);
                                  setShowAddModal(true);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => setShowDeleteConfirm(system.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Irrigation Schedules</CardTitle>
                <Button size="sm" onClick={() => setShowScheduleModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!schedules || schedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No schedules found. Create a schedule to automate irrigation.
                  </div>
                ) : (
                  schedules.map(schedule => (
                    <div key={schedule.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{schedule.schedule_name}</p>
                            <p className="text-sm text-gray-500">
                              Every {schedule.frequency_days} days - {schedule.duration_minutes} min
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            schedule.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100'
                          }
                        >
                          {schedule.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Water Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={waterTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="usage" stroke="#3b82f6" name="Actual Usage" />
                      <Line
                        type="monotone"
                        dataKey="optimal"
                        stroke="#22c55e"
                        strokeDasharray="5 5"
                        name="Optimal"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Water Usage (Weekly)</span>
                      <span className="font-bold">{stats.totalWaterUsage.toLocaleString()} L</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average Moisture Level</span>
                      <span className="font-bold text-blue-600">{stats.avgMoisture}%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">System Efficiency</span>
                      <span className="font-bold text-green-600">
                        {stats.total > 0 ? Math.round((stats.operational / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this system?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteSystem.isPending}
                >
                  {deleteSystem.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit System Modal */}
      {showAddModal && (
        <SystemFormModal
          system={selectedSystem}
          fields={fields || []}
          onClose={() => {
            setShowAddModal(false);
            setSelectedSystem(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setSelectedSystem(null);
            refetch();
          }}
          createSystem={createSystem}
          updateSystem={updateSystem}
        />
      )}

      {/* Add Schedule Modal */}
      {showScheduleModal && (
        <ScheduleFormModal
          systems={systems || []}
          onClose={() => setShowScheduleModal(false)}
          onSave={() => {
            setShowScheduleModal(false);
            refetch();
          }}
          createSchedule={createSchedule}
        />
      )}
    </div>
  );
}

// System Form Modal
interface SystemFormModalProps {
  system: IrrigationSystem | null;
  fields: any[];
  onClose: () => void;
  onSave: () => void;
  createSystem: { mutateAsync: (data: any) => Promise<IrrigationSystem> };
  updateSystem: { mutateAsync: (params: { id: string; data: any }) => Promise<IrrigationSystem> };
}

function SystemFormModal({
  system,
  fields,
  onClose,
  onSave,
  createSystem,
  updateSystem,
}: SystemFormModalProps) {
  const [formData, setFormData] = useState({
    name: system?.name || '',
    system_type: system?.system_type || 'drip',
    field_id: system?.field_id || '',
    status: system?.status || 'operational',
    flow_rate_liters_per_hour: system?.flow_rate_liters_per_hour || '',
    coverage_area_hectares: system?.coverage_area_hectares || '',
    water_source: system?.water_source || '',
    description: system?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        ...formData,
        flow_rate_liters_per_hour: formData.flow_rate_liters_per_hour
          ? parseFloat(String(formData.flow_rate_liters_per_hour))
          : null,
        coverage_area_hectares: formData.coverage_area_hectares
          ? parseFloat(String(formData.coverage_area_hectares))
          : null,
      };

      if (system?.id) {
        await updateSystem.mutateAsync({ id: system.id, data });
      } else {
        await createSystem.mutateAsync(data);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save system');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{system ? 'Edit System' : 'Add New System'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div>
              <Label>System Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., North Field Drip System"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <select
                  title="Select type"
                  value={formData.system_type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      system_type: e.target.value as IrrigationSystem['system_type'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(SYSTEM_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  title="Select status"
                  value={formData.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value as IrrigationSystem['status'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Field</Label>
              <select
                title="Select field"
                value={formData.field_id}
                onChange={e => setFormData({ ...formData, field_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select field</option>
                {fields.map(field => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Flow Rate (L/hr)</Label>
                <Input
                  type="number"
                  step="0.1"
                  title="Flow rate"
                  value={formData.flow_rate_liters_per_hour}
                  onChange={e =>
                    setFormData({ ...formData, flow_rate_liters_per_hour: e.target.value })
                  }
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <Label>Coverage (ha)</Label>
                <Input
                  type="number"
                  step="0.1"
                  title="Coverage area"
                  value={formData.coverage_area_hectares}
                  onChange={e =>
                    setFormData({ ...formData, coverage_area_hectares: e.target.value })
                  }
                  placeholder="e.g., 2.5"
                />
              </div>
            </div>

            <div>
              <Label>Water Source</Label>
              <Input
                value={formData.water_source}
                onChange={e => setFormData({ ...formData, water_source: e.target.value })}
                placeholder="e.g., Borehole, Dam, River"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {system ? 'Update' : 'Add'} System
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Schedule Form Modal
interface ScheduleFormModalProps {
  systems: IrrigationSystem[];
  onClose: () => void;
  onSave: () => void;
  createSchedule: { mutateAsync: (data: any) => Promise<IrrigationSchedule> };
}

function ScheduleFormModal({ systems, onClose, onSave, createSchedule }: ScheduleFormModalProps) {
  const [formData, setFormData] = useState({
    schedule_name: '',
    irrigation_system_id: '',
    frequency_days: '',
    duration_minutes: '',
    water_amount_mm: '',
    start_date: new Date().toISOString().split('T')[0],
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        ...formData,
        frequency_days: formData.frequency_days ? parseInt(formData.frequency_days) : null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        water_amount_mm: formData.water_amount_mm ? parseFloat(formData.water_amount_mm) : null,
      };

      await createSchedule.mutateAsync(data);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Irrigation Schedule</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div>
              <Label>Schedule Name *</Label>
              <Input
                required
                value={formData.schedule_name}
                onChange={e => setFormData({ ...formData, schedule_name: e.target.value })}
                placeholder="e.g., Daily Morning Irrigation"
              />
            </div>

            <div>
              <Label>System *</Label>
              <select
                title="Select system"
                required
                value={formData.irrigation_system_id}
                onChange={e => setFormData({ ...formData, irrigation_system_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select system</option>
                {systems.map(sys => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency (days)</Label>
                <Input
                  type="number"
                  title="Frequency in days"
                  value={formData.frequency_days}
                  onChange={e => setFormData({ ...formData, frequency_days: e.target.value })}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  title="Duration in minutes"
                  value={formData.duration_minutes}
                  onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Water Amount (mm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  title="Water amount"
                  value={formData.water_amount_mm}
                  onChange={e => setFormData({ ...formData, water_amount_mm: e.target.value })}
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  title="Start date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default IrrigationOptimizer;
