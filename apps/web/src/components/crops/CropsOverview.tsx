/**
 * CROPS OVERVIEW COMPONENT
 * ========================
 * Main dashboard view for crop management with real-time data
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCrops, useDeleteCrop, useCreateCrop, useUpdateCrop } from '../../api/hooks/useCrops';
import { useLocations } from '../../api/hooks/useLocations';
import { useFarms } from '../../api/hooks/useFarms';
import type { Crop, CropStatus, CreateRequest, UpdateRequest } from '../../api/types';
import {
  Plus,
  Sprout,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Leaf,
  BarChart3,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
} from 'lucide-react';

interface CropsOverviewProps {
  farmId?: string;
  className?: string;
  onCropSelect?: (crop: Crop) => void;
}

type ViewMode = 'grid' | 'list' | 'table';
type FilterStatus = 'all' | CropStatus;

const STATUS_CONFIG: Record<
  CropStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  planned: {
    label: 'Planned',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <Clock className="w-4 h-4" />,
  },
  planted: {
    label: 'Planted',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: <Sprout className="w-4 h-4" />,
  },
  growing: {
    label: 'Growing',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  harvested: {
    label: 'Harvested',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  failed: {
    label: 'Failed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
};

export function CropsOverview({ farmId, className = '', onCropSelect }: CropsOverviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCropForm, setShowCropForm] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get current farm
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;

  // Fetch crops data
  const { data: crops, isLoading, error, refetch } = useCrops(currentFarmId);
  const { data: locations } = useLocations(currentFarmId);

  // Mutations
  const deleteCrop = useDeleteCrop();
  const createCrop = useCreateCrop();
  const updateCrop = useUpdateCrop();

  // Filter and search crops
  const filteredCrops = useMemo(() => {
    if (!crops) return [];

    let result = [...crops];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(crop => crop.status === filterStatus);
    }

    // Search by name or type
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        crop =>
          crop.crop_type?.toLowerCase().includes(query) ||
          crop.variety?.toLowerCase().includes(query) ||
          crop.name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [crops, filterStatus, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!crops)
      return { total: 0, byStatus: {} as Record<string, number>, totalArea: 0, avgYield: 0 };

    const byStatus = crops.reduce(
      (acc, crop) => {
        const status = crop.status || 'planned';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalArea = crops.reduce((sum, crop) => sum + (crop.area_planted || 0), 0);
    const harvestedCrops = crops.filter(c => c.status === 'harvested' && c.actual_yield);
    const avgYield =
      harvestedCrops.length > 0
        ? harvestedCrops.reduce((sum, c) => sum + (c.actual_yield || 0), 0) / harvestedCrops.length
        : 0;

    return { total: crops.length, byStatus, totalArea, avgYield };
  }, [crops]);

  const handleDeleteCrop = async (id: string) => {
    try {
      await deleteCrop.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete crop:', error);
    }
  };

  const handleEditCrop = (crop: Crop) => {
    setSelectedCrop(crop);
    setShowCropForm(true);
  };

  const handleFormClose = () => {
    setShowCropForm(false);
    setSelectedCrop(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Crops</h3>
        <p className="text-gray-600 mb-4">Failed to load crop data. Please try again.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crops Overview</h2>
          <p className="text-gray-600">Manage and monitor your crop production</p>
        </div>
        <Button onClick={() => setShowCropForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Crop
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Crops</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Sprout className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Growing</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byStatus['growing'] || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Area (ha)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArea.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Leaf className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Yield</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgYield.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search crops..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            title="Filter by status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              title="Grid view"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600'}`}
            >
              Grid
            </button>
            <button
              title="List view"
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600'}`}
            >
              List
            </button>
            <button
              title="Table view"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 ${viewMode === 'table' ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600'}`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Crops Display */}
      {filteredCrops.length === 0 ? (
        <div className="text-center py-12">
          <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No crops found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Get started by adding your first crop'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <Button onClick={() => setShowCropForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Crop
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCrops.map(crop => (
            <CropCard
              key={crop.id}
              crop={crop}
              field={locations?.find((f: { id: string; name: string }) => f.id === crop.field_id)}
              statusConfig={STATUS_CONFIG[crop.status]}
              onEdit={() => handleEditCrop(crop)}
              onDelete={() => setShowDeleteConfirm(crop.id)}
              onSelect={() => onCropSelect?.(crop)}
            />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredCrops.map(crop => (
            <CropListItem
              key={crop.id}
              crop={crop}
              field={locations?.find((f: { id: string; name: string }) => f.id === crop.field_id)}
              statusConfig={STATUS_CONFIG[crop.status]}
              onEdit={() => handleEditCrop(crop)}
              onDelete={() => setShowDeleteConfirm(crop.id)}
              onSelect={() => onCropSelect?.(crop)}
            />
          ))}
        </div>
      ) : (
        <CropTable
          crops={filteredCrops}
          fields={locations}
          statusConfig={STATUS_CONFIG}
          onEdit={handleEditCrop}
          onDelete={(id: string) => setShowDeleteConfirm(id)}
          onSelect={onCropSelect}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirm Delete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this crop? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteCrop(showDeleteConfirm)}
                  disabled={deleteCrop.isPending}
                >
                  {deleteCrop.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Crop Form Modal */}
      {showCropForm && (
        <CropFormModal
          crop={selectedCrop}
          farmId={currentFarmId}
          fields={locations}
          onClose={handleFormClose}
          onSave={handleFormClose}
          createCrop={createCrop}
          updateCrop={updateCrop}
        />
      )}
    </div>
  );
}

// Crop Form Modal Component
interface CropFormModalProps {
  crop: Crop | null;
  farmId?: string;
  fields?: { id: string; name: string }[];
  onClose: () => void;
  onSave: () => void;
  createCrop: { mutateAsync: (data: CreateRequest<Crop>) => Promise<Crop> };
  updateCrop: { mutateAsync: (params: { id: string; data: UpdateRequest<Crop> }) => Promise<Crop> };
}

function CropFormModal({
  crop,
  farmId,
  fields,
  onClose,
  onSave,
  createCrop,
  updateCrop,
}: CropFormModalProps) {
  const [formData, setFormData] = useState({
    crop_type: crop?.crop_type || '',
    variety: crop?.variety || '',
    field_id: crop?.field_id || '',
    status: crop?.status || 'planned',
    area_planted: crop?.area_planted || 0,
    planting_date: crop?.planting_date || '',
    expected_harvest_date: crop?.expected_harvest_date || '',
    expected_yield: crop?.expected_yield || 0,
    notes: crop?.notes || '',
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
        farm_id: farmId,
      };

      if (crop?.id) {
        await updateCrop.mutateAsync({ id: crop.id, data });
      } else {
        await createCrop.mutateAsync(data as CreateRequest<Crop>);
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
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{crop ? 'Edit Crop' : 'Add New Crop'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                <input
                  type="text"
                  required
                  value={formData.crop_type}
                  onChange={e => setFormData({ ...formData, crop_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Maize, Wheat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                <input
                  type="text"
                  value={formData.variety}
                  onChange={e => setFormData({ ...formData, variety: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., SC 513"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                <select
                  title="Select field"
                  value={formData.field_id}
                  onChange={e => setFormData({ ...formData, field_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select a field</option>
                  {fields?.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  title="Select status"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as CropStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <option key={status} value={status}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area Planted (ha)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.area_planted}
                  onChange={e =>
                    setFormData({ ...formData, area_planted: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Yield
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.expected_yield}
                  onChange={e =>
                    setFormData({ ...formData, expected_yield: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planting Date
                </label>
                <input
                  type="date"
                  value={formData.planting_date}
                  onChange={e => setFormData({ ...formData, planting_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Harvest Date
                </label>
                <input
                  type="date"
                  value={formData.expected_harvest_date}
                  onChange={e =>
                    setFormData({ ...formData, expected_harvest_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Additional notes about this crop..."
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
                    {crop ? 'Update Crop' : 'Add Crop'}
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

// Crop Card Component for Grid View
interface CropCardProps {
  crop: Crop;
  field?: { id: string; name: string };
  statusConfig: { label: string; color: string; bgColor: string; icon: React.ReactNode };
  onEdit: () => void;
  onDelete: () => void;
  onSelect?: () => void;
}

function CropCard({ crop, field, statusConfig, onEdit, onDelete, onSelect }: CropCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>{statusConfig.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{crop.crop_type}</h3>
              <p className="text-sm text-gray-500">{crop.variety || 'No variety'}</p>
            </div>
          </div>
          <div className="relative">
            <button
              title="More options"
              onClick={e => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status:</span>
            <Badge className={statusConfig.bgColor}>{statusConfig.label}</Badge>
          </div>
          {field && (
            <div className="flex justify-between">
              <span className="text-gray-500">Field:</span>
              <span className="text-gray-900">{field.name}</span>
            </div>
          )}
          {crop.area_planted && (
            <div className="flex justify-between">
              <span className="text-gray-500">Area:</span>
              <span className="text-gray-900">{crop.area_planted} ha</span>
            </div>
          )}
          {crop.planting_date && (
            <div className="flex justify-between">
              <span className="text-gray-500">Planted:</span>
              <span className="text-gray-900">
                {new Date(crop.planting_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {crop.expected_harvest_date && (
            <div className="flex justify-between">
              <span className="text-gray-500">Harvest:</span>
              <span className="text-gray-900">
                {new Date(crop.expected_harvest_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Crop List Item Component for List View
interface CropListItemProps {
  crop: Crop;
  field?: { id: string; name: string };
  statusConfig: { label: string; color: string; bgColor: string; icon: React.ReactNode };
  onEdit: () => void;
  onDelete: () => void;
  onSelect?: () => void;
}

function CropListItem({
  crop,
  field,
  statusConfig,
  onEdit,
  onDelete,
  onSelect,
}: CropListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>{statusConfig.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{crop.crop_type}</h3>
              <p className="text-sm text-gray-500">
                {crop.variety || 'No variety'} • {field?.name || 'No field'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="text-gray-900">{crop.area_planted || 0} ha</p>
              <p className="text-gray-500">
                {crop.planting_date
                  ? new Date(crop.planting_date).toLocaleDateString()
                  : 'Not planted'}
              </p>
            </div>
            <Badge className={statusConfig.bgColor}>{statusConfig.label}</Badge>
            <div className="flex gap-1">
              <button
                title="Edit crop"
                onClick={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <Edit className="w-4 h-4 text-gray-500" />
              </button>
              <button
                title="Delete crop"
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Crop Table Component for Table View
interface CropTableProps {
  crops: Crop[];
  fields?: { id: string; name: string }[];
  statusConfig: Record<
    CropStatus,
    { label: string; color: string; bgColor: string; icon: React.ReactNode }
  >;
  onEdit: (crop: Crop) => void;
  onDelete: (id: string) => void;
  onSelect?: (crop: Crop) => void;
}

function CropTable({ crops, fields, statusConfig, onEdit, onDelete, onSelect }: CropTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Crop</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Variety</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Field</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Area</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Planted</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Harvest Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {crops.map(crop => (
                <tr
                  key={crop.id}
                  onClick={() => onSelect?.(crop)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{crop.crop_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{crop.variety || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {fields?.find(f => f.id === crop.field_id)?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusConfig[crop.status].bgColor}>
                      {statusConfig[crop.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {crop.area_planted ? `${crop.area_planted} ha` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {crop.planting_date ? new Date(crop.planting_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {crop.expected_harvest_date
                      ? new Date(crop.expected_harvest_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        title="Edit"
                        onClick={e => {
                          e.stopPropagation();
                          onEdit(crop);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        title="Delete"
                        onClick={e => {
                          e.stopPropagation();
                          onDelete(crop.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default CropsOverview;
