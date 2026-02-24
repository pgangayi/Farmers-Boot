/**
 * LIVESTOCK LIST COMPONENT
 * =========================
 * Comprehensive livestock listing with filtering, sorting, and management
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  useLivestock,
  useDeleteLivestock,
  useBreeds,
  useLivestockStats,
} from '../../api/hooks/useLivestock';
import { useFarms } from '../../api/hooks/useFarms';
import type { Livestock, AnimalStatus } from '../../api/types';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Weight,
  X,
  Save,
  Loader2,
  RefreshCw,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LivestockListProps {
  farmId?: string;
  className?: string;
  onAnimalSelect?: (animal: Livestock) => void;
}

type ViewMode = 'grid' | 'list' | 'table';
type FilterStatus = 'all' | AnimalStatus;
type FilterSpecies = 'all' | string;

const STATUS_CONFIG: Record<
  AnimalStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  active: {
    label: 'Active',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  healthy: {
    label: 'Healthy',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  sick: {
    label: 'Sick',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  sold: {
    label: 'Sold',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: <Activity className="w-4 h-4" />,
  },
  deceased: {
    label: 'Deceased',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  pregnant: {
    label: 'Pregnant',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: <Heart className="w-4 h-4" />,
  },
  quarantine: {
    label: 'Quarantine',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: <Clock className="w-4 h-4" />,
  },
};

const SPECIES_CONFIG: Record<string, { label: string; icon: string }> = {
  cattle: { label: 'Cattle', icon: '🐄' },
  goats: { label: 'Goats', icon: '🐐' },
  sheep: { label: 'Sheep', icon: '🐑' },
  pigs: { label: 'Pigs', icon: '🐷' },
  chickens: { label: 'Chickens', icon: '🐔' },
  ducks: { label: 'Ducks', icon: '🦆' },
  horses: { label: 'Horses', icon: '🐴' },
  other: { label: 'Other', icon: '🐾' },
};

export function LivestockList({ farmId, className = '', onAnimalSelect }: LivestockListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSpecies, setFilterSpecies] = useState<FilterSpecies>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedAnimal, setExpandedAnimal] = useState<string | null>(null);

  // Get farm and livestock data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: livestock, isLoading, error, refetch } = useLivestock(currentFarmId);
  const { data: breeds } = useBreeds();
  const { data: stats } = useLivestockStats(currentFarmId);

  // Delete mutation
  const deleteLivestock = useDeleteLivestock();

  // Filter livestock
  const filteredLivestock = useMemo(() => {
    if (!livestock) return [];

    let result = [...livestock];

    if (filterStatus !== 'all') {
      result = result.filter(animal => animal.status === filterStatus);
    }

    if (filterSpecies !== 'all') {
      result = result.filter(
        animal =>
          (animal as any).species === filterSpecies || (animal as any).type === filterSpecies
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        animal =>
          animal.name?.toLowerCase().includes(query) ||
          animal.identification_tag?.toLowerCase().includes(query) ||
          (animal as any).tag_number?.toLowerCase().includes(query) ||
          (animal as any).species?.toLowerCase().includes(query) ||
          (animal as any).type?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [livestock, filterStatus, filterSpecies, searchQuery]);

  // Get unique species for filter
  const speciesList = useMemo(() => {
    if (!livestock) return [];
    const species = new Set(
      livestock.map(a => (a as any).species || (a as any).type).filter(Boolean)
    );
    return ['all', ...Array.from(species)];
  }, [livestock]);

  const handleDeleteAnimal = async (id: string) => {
    try {
      await deleteLivestock.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete animal:', error);
    }
  };

  const handleEditAnimal = (animal: Livestock) => {
    setSelectedAnimal(animal);
    setShowAddModal(true);
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Livestock</h3>
        <p className="text-gray-600 mb-4">Failed to load livestock data.</p>
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
            <Heart className="w-6 h-6 text-amber-600" />
            Livestock Management
          </h2>
          <p className="text-gray-600">Track and manage your animals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Animal
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Animals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total || livestock?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Heart className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {livestock?.filter(a => a.status === 'active').length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Quarantine</p>
                <p className="text-2xl font-bold text-gray-900">
                  {livestock?.filter(a => a.status === 'quarantine').length || 0}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Species</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(stats?.by_species || {}).length || speciesList.length - 1}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
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
            placeholder="Search by name, tag, or species..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            title="Filter by status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            title="Filter by species"
            value={filterSpecies}
            onChange={e => setFilterSpecies(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Species</option>
            {speciesList
              .filter(s => s !== 'all')
              .map(species => (
                <option key={species} value={species}>
                  {SPECIES_CONFIG[species]?.label || species}
                </option>
              ))}
          </select>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              title="Table view"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 ${viewMode === 'table' ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              title="List view"
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Livestock Display */}
      {filteredLivestock.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No animals found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterStatus !== 'all' || filterSpecies !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Get started by adding your first animal'}
          </p>
          {!searchQuery && filterStatus === 'all' && filterSpecies === 'all' && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Animal
            </Button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Animal
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tag</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Species
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Breed</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Weight
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLivestock.map(animal => (
                    <tr
                      key={animal.id}
                      onClick={() => onAnimalSelect?.(animal)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {SPECIES_CONFIG[(animal as any).species || (animal as any).type]
                              ?.icon || '🐾'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {animal.name || 'Unnamed'}
                            </div>
                            {animal.date_of_birth && (
                              <div className="text-xs text-gray-500">
                                Born {new Date(animal.date_of_birth).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {animal.identification_tag || (animal as any).tag_number || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">
                          {SPECIES_CONFIG[(animal as any).species || (animal as any).type]?.label ||
                            (animal as any).type ||
                            'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{animal.breed || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {animal.sex || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_CONFIG[animal.status]?.bgColor || 'bg-gray-100'}>
                          {STATUS_CONFIG[animal.status]?.label || animal.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {animal.current_weight ? `${animal.current_weight} kg` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            title="View"
                            onClick={e => {
                              e.stopPropagation();
                              onAnimalSelect?.(animal);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            title="Edit"
                            onClick={e => {
                              e.stopPropagation();
                              handleEditAnimal(animal);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            title="Delete"
                            onClick={e => {
                              e.stopPropagation();
                              setShowDeleteConfirm(animal.id);
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
      ) : (
        <div className="space-y-2">
          {filteredLivestock.map(animal => (
            <Card
              key={animal.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedAnimal(expandedAnimal === animal.id ? null : animal.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">
                      {SPECIES_CONFIG[(animal as any).species || (animal as any).type]?.icon ||
                        '🐾'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{animal.name || 'Unnamed'}</h3>
                      <p className="text-sm text-gray-500">
                        {animal.identification_tag || (animal as any).tag_number} •{' '}
                        {animal.breed || 'Unknown breed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={STATUS_CONFIG[animal.status]?.bgColor || 'bg-gray-100'}>
                      {STATUS_CONFIG[animal.status]?.label || animal.status}
                    </Badge>
                    {expandedAnimal === animal.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedAnimal === animal.id && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Species:</span>
                      <p className="font-medium">
                        {SPECIES_CONFIG[(animal as any).species || (animal as any).type]?.label ||
                          (animal as any).type}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Gender:</span>
                      <p className="font-medium capitalize">{animal.sex || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Weight:</span>
                      <p className="font-medium">
                        {animal.current_weight ? `${animal.current_weight} kg` : 'Not recorded'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Birth Date:</span>
                      <p className="font-medium">
                        {animal.date_of_birth
                          ? new Date(animal.date_of_birth).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-4 flex justify-end gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => onAnimalSelect?.(animal)}>
                        <Eye className="w-4 h-4 mr-1" /> View Details
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditAnimal(animal)}>
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this animal record?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAnimal(showDeleteConfirm)}
                  disabled={deleteLivestock.isPending}
                >
                  {deleteLivestock.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <LivestockFormModal
          animal={selectedAnimal}
          farmId={currentFarmId}
          breeds={breeds}
          onClose={() => {
            setShowAddModal(false);
            setSelectedAnimal(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setSelectedAnimal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// Livestock Form Modal
interface LivestockFormModalProps {
  animal: Livestock | null;
  farmId?: string;
  breeds?: any[];
  onClose: () => void;
  onSave: () => void;
}

function LivestockFormModal({ animal, farmId, breeds, onClose, onSave }: LivestockFormModalProps) {
  const [formData, setFormData] = useState({
    name: animal?.name || '',
    type: (animal as any)?.type || 'cattle',
    species: (animal as any)?.species || 'cattle',
    breed: animal?.breed || '',
    identification_tag: animal?.identification_tag || '',
    tag_number: (animal as any)?.tag_number || '',
    gender: animal?.sex || 'male',
    birth_date: animal?.date_of_birth || '',
    weight_kg: (animal as any)?.weight_kg || animal?.current_weight || '',
    status: animal?.status || 'active',
    notes: (animal as any)?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    // In production, this would call the create/update mutation
    setTimeout(() => {
      onSave();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{animal ? 'Edit Animal' : 'Add New Animal'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Animal name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag Number</label>
                <input
                  type="text"
                  value={formData.tag_number || formData.identification_tag}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      tag_number: e.target.value,
                      identification_tag: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Tag ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
                <select
                  title="Select species"
                  value={formData.species || formData.type}
                  onChange={e =>
                    setFormData({ ...formData, species: e.target.value, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(SPECIES_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={e => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="Breed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  title="Select gender"
                  value={formData.gender}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as 'male' | 'female' | 'unknown',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  title="Select status"
                  value={formData.status}
                  onChange={e =>
                    setFormData({ ...formData, status: e.target.value as AnimalStatus })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
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
                    {animal ? 'Update' : 'Add'} Animal
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

// ReferenceTabs export for backward compatibility
export function ReferenceTabs(props: any) {
  return <div>Reference Tabs - See ReferenceTabs.tsx for implementation</div>;
}

export default LivestockList;
