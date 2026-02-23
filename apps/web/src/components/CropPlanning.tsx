/**
 * CROP PLANNING COMPONENT
 * ========================
 * Plan and manage crop planting schedules
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useCrops, useCreateCrop, useUpdateCrop, useDeleteCrop } from '../api/hooks/useCrops';
import { useFarms } from '../api/hooks/useFarms';
import { useLocations } from '../api/hooks/useLocations';
import type { Crop, CreateRequest } from '../api/types';
import {
  Calendar,
  MapPin,
  Droplets,
  Sun,
  Wind,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Sprout,
  Target,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CropPlanningProps {
  farmId?: string;
  className?: string;
}

const STATUS_CONFIG = {
  planned: { label: 'Planned', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: Calendar },
  planted: { label: 'Planted', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Sprout },
  growing: { label: 'Growing', color: 'text-green-700', bgColor: 'bg-green-100', icon: Sun },
  ready: { label: 'Ready', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: AlertTriangle },
  harvested: {
    label: 'Harvested',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: CheckCircle,
  },
};

const TYPE_COLORS: Record<string, string> = {
  vegetable: '#22c55e',
  grain: '#f59e0b',
  fruit: '#ef4444',
  legume: '#8b5cf6',
  other: '#6b7280',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function CropPlanning({ farmId, className = '' }: CropPlanningProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Get farm and data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: fields } = useLocations(currentFarmId);
  const { data: crops, isLoading, error, refetch } = useCrops(currentFarmId);

  // Mutations
  const createCrop = useCreateCrop();
  const updateCrop = useUpdateCrop();
  const deleteCrop = useDeleteCrop();

  // Transform crops data
  const plannedCrops = useMemo(() => {
    if (!crops) return [];

    return crops.map(crop => {
      // Get field name
      const field = fields?.find((f: any) => f.id === (crop as any).field_id);
      const fieldName = field?.name || 'Unassigned';

      // Determine status based on dates
      const today = new Date();
      const plantingDate = crop.planting_date ? new Date(crop.planting_date) : null;
      const harvestDate = crop.expected_harvest_date ? new Date(crop.expected_harvest_date) : null;

      let status: keyof typeof STATUS_CONFIG = 'planned';
      if (harvestDate && harvestDate < today) {
        status = 'harvested';
      } else if (plantingDate && plantingDate <= today && (!harvestDate || harvestDate > today)) {
        // Check if ready for harvest (within 2 weeks of expected harvest)
        if (harvestDate) {
          const twoWeeksBeforeHarvest = new Date(harvestDate);
          twoWeeksBeforeHarvest.setDate(twoWeeksBeforeHarvest.getDate() - 14);
          if (today >= twoWeeksBeforeHarvest) {
            status = 'ready';
          } else {
            status = 'growing';
          }
        } else {
          status = 'growing';
        }
      } else if (plantingDate && plantingDate > today) {
        status = 'planted';
      }

      return {
        ...crop,
        field: fieldName,
        status,
        type: (crop as any).category || 'other',
        area: (crop as any).area_hectares || (crop as any).planted_area_hectares || 0,
      };
    });
  }, [crops, fields]);

  // Filter crops
  const filteredCrops = useMemo(() => {
    if (!plannedCrops) return [];

    let result = [...plannedCrops];

    if (filterStatus !== 'all') {
      result = result.filter(crop => crop.status === filterStatus);
    }

    if (filterType !== 'all') {
      result = result.filter(crop => crop.type === filterType);
    }

    return result;
  }, [plannedCrops, filterStatus, filterType]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!plannedCrops || plannedCrops.length === 0) {
      return { total: 0, byStatus: [], byType: [], totalArea: 0, upcomingHarvests: 0 };
    }

    const byStatus = Object.entries(
      plannedCrops.reduce(
        (acc, crop) => {
          acc[crop.status] = (acc[crop.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    ).map(([name, value]) => ({
      name: STATUS_CONFIG[name as keyof typeof STATUS_CONFIG]?.label || name,
      value,
    }));

    const byType = Object.entries(
      plannedCrops.reduce(
        (acc, crop) => {
          acc[crop.type] = (acc[crop.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    ).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    const totalArea = plannedCrops.reduce((sum, c) => sum + (c.area || 0), 0);

    // Count upcoming harvests (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingHarvests = plannedCrops.filter(c => {
      const harvestDate = (c as any).expected_harvest_date
        ? new Date((c as any).expected_harvest_date)
        : null;
      return harvestDate && harvestDate >= today && harvestDate <= thirtyDaysFromNow;
    }).length;

    return { total: plannedCrops.length, byStatus, byType, totalArea, upcomingHarvests };
  }, [plannedCrops]);

  // Get upcoming activities
  const upcomingActivities = useMemo(() => {
    if (!plannedCrops) return [];

    const today = new Date();
    const activities: { date: Date; type: string; crop: string; action: string }[] = [];

    plannedCrops.forEach(crop => {
      const plantingDate = crop.planting_date ? new Date(crop.planting_date) : null;
      const harvestDate = (crop as any).expected_harvest_date
        ? new Date((crop as any).expected_harvest_date)
        : null;

      if (plantingDate && plantingDate >= today) {
        activities.push({
          date: plantingDate,
          type: 'planting',
          crop: crop.name || 'Unknown',
          action: 'Plant',
        });
      }

      if (harvestDate && harvestDate >= today) {
        activities.push({
          date: harvestDate,
          type: 'harvest',
          crop: crop.name || 'Unknown',
          action: 'Harvest',
        });
      }
    });

    return activities.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  }, [plannedCrops]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCrop.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete crop:', error);
    }
  };

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
        <p className="text-gray-600 mb-4">Failed to load crop planning data.</p>
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
            <Calendar className="w-6 h-6 text-green-600" />
            Crop Planning
          </h2>
          <p className="text-gray-600">Plan and manage your crop planting schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Crop
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Crops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Sprout className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Area</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArea.toFixed(1)} ha</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Growing</p>
                <p className="text-2xl font-bold text-green-600">
                  {plannedCrops.filter(c => c.status === 'growing').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Harvests</p>
                <p className="text-2xl font-bold text-amber-600">{stats.upcomingHarvests}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crops">All Crops</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.byStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {stats.byStatus.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming activities scheduled
                  </div>
                ) : (
                  upcomingActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === 'planting' ? 'bg-blue-100' : 'bg-amber-100'
                          }`}
                        >
                          {activity.type === 'planting' ? (
                            <Sprout className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Target className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {activity.action} {activity.crop}
                          </p>
                          <p className="text-sm text-gray-500">
                            {activity.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {activity.type === 'planting' ? 'Planting' : 'Harvest'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crops Tab */}
        <TabsContent value="crops">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">All Crops</CardTitle>
                <div className="flex gap-2">
                  <select
                    title="Filter by status"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  <select
                    title="Filter by type"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Types</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="grain">Grain</option>
                    <option value="fruit">Fruit</option>
                    <option value="legume">Legume</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Crop</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Field</th>
                      <th className="text-left p-3">Area</th>
                      <th className="text-left p-3">Planting Date</th>
                      <th className="text-left p-3">Expected Harvest</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCrops.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No crops found
                        </td>
                      </tr>
                    ) : (
                      filteredCrops.map(crop => {
                        const StatusIcon = STATUS_CONFIG[crop.status]?.icon || Calendar;
                        return (
                          <tr key={crop.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{crop.name}</td>
                            <td className="p-3">
                              <Badge variant="outline">{crop.type}</Badge>
                            </td>
                            <td className="p-3">{crop.field}</td>
                            <td className="p-3">{crop.area} ha</td>
                            <td className="p-3">
                              {crop.planting_date
                                ? new Date(crop.planting_date).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="p-3">
                              {(crop as any).expected_harvest_date
                                ? new Date((crop as any).expected_harvest_date).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="p-3">
                              <Badge className={STATUS_CONFIG[crop.status]?.bgColor}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {STATUS_CONFIG[crop.status]?.label}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <button
                                  title="Edit"
                                  onClick={() => {
                                    setSelectedCrop(crop as unknown as Crop);
                                    setShowAddModal(true);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Edit className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                  title="Delete"
                                  onClick={() => setShowDeleteConfirm(crop.id)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planting Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const StatusIcon = config.icon;
                  const statusCrops = plannedCrops.filter(c => c.status === status);

                  return (
                    <div key={status} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <StatusIcon className="w-5 h-5" />
                        <h4 className="font-semibold">{config.label}</h4>
                        <Badge variant="outline">{statusCrops.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {statusCrops.length === 0 ? (
                          <p className="text-sm text-gray-500">No crops</p>
                        ) : (
                          statusCrops.map(crop => (
                            <div key={crop.id} className="p-2 bg-gray-50 rounded text-sm">
                              <p className="font-medium">{crop.name}</p>
                              <p className="text-gray-500">
                                {crop.field} - {crop.area} ha
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
              <p className="text-gray-600 mb-4">Are you sure you want to delete this crop?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteCrop.isPending}
                >
                  {deleteCrop.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <CropFormModal
          crop={selectedCrop}
          fields={fields || []}
          farmId={currentFarmId}
          onClose={() => {
            setShowAddModal(false);
            setSelectedCrop(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setSelectedCrop(null);
            refetch();
          }}
          createCrop={createCrop}
          updateCrop={updateCrop}
        />
      )}
    </div>
  );
}

// Crop Form Modal
interface CropFormModalProps {
  crop: Crop | null;
  fields: any[];
  farmId?: string;
  onClose: () => void;
  onSave: () => void;
  createCrop: { mutateAsync: (data: CreateRequest<Crop>) => Promise<Crop> };
  updateCrop: { mutateAsync: (params: { id: string; data: Partial<Crop> }) => Promise<Crop> };
}

function CropFormModal({
  crop,
  fields,
  farmId,
  onClose,
  onSave,
  createCrop,
  updateCrop,
}: CropFormModalProps) {
  const [formData, setFormData] = useState({
    name: crop?.name || '',
    category: (crop as any)?.category || 'vegetable',
    field_id: (crop as any)?.field_id || '',
    planting_date: crop?.planting_date || '',
    expected_harvest_date: (crop as any)?.expected_harvest_date || '',
    area_hectares: (crop as any)?.area_hectares || '',
    variety: crop?.variety || '',
    notes: (crop as any)?.notes || '',
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
        area_hectares: formData.area_hectares ? parseFloat(formData.area_hectares) : null,
        farm_id: farmId,
        crop_type: formData.category,
        status: 'planned' as const,
      };

      if (crop?.id) {
        await updateCrop.mutateAsync({ id: crop.id, data: data as unknown as Partial<Crop> });
      } else {
        await createCrop.mutateAsync(data as unknown as CreateRequest<Crop>);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save crop');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{crop ? 'Edit Crop' : 'Add New Crop'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div>
              <Label>Crop Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tomatoes"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  title="Select category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="vegetable">Vegetable</option>
                  <option value="grain">Grain</option>
                  <option value="fruit">Fruit</option>
                  <option value="legume">Legume</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Variety</Label>
                <Input
                  value={formData.variety}
                  onChange={e => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="e.g., Roma"
                />
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

            <div>
              <Label>Area (hectares)</Label>
              <Input
                type="number"
                step="0.1"
                title="Area in hectares"
                value={formData.area_hectares}
                onChange={e => setFormData({ ...formData, area_hectares: e.target.value })}
                placeholder="e.g., 2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Planting Date</Label>
                <Input
                  type="date"
                  title="Planting date"
                  value={formData.planting_date}
                  onChange={e => setFormData({ ...formData, planting_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Expected Harvest</Label>
                <Input
                  type="date"
                  title="Expected harvest date"
                  value={formData.expected_harvest_date}
                  onChange={e =>
                    setFormData({ ...formData, expected_harvest_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
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
                    {crop ? 'Update' : 'Add'} Crop
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

export default CropPlanning;
