/**
 * INVENTORY OVERVIEW COMPONENT
 * =============================
 * Main dashboard for inventory management with summary and quick actions
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  useInventory,
  useInventoryLowStock,
  useCreateInventoryItem,
  useDeleteInventoryItem,
} from '../../api/hooks/useInventory';
import { useFarms } from '../../api/hooks/useFarms';
import type { InventoryItem, CreateRequest } from '../../api/types';
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';

interface InventoryOverviewProps {
  farmId?: string;
  className?: string;
  onItemClick?: (item: InventoryItem) => void;
}

type FilterCategory =
  | 'all'
  | 'seeds'
  | 'fertilizers'
  | 'chemicals'
  | 'equipment'
  | 'feed'
  | 'other';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  seeds: { label: 'Seeds', color: 'text-green-700', bgColor: 'bg-green-100' },
  fertilizers: { label: 'Fertilizers', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  chemicals: { label: 'Chemicals', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  equipment: { label: 'Equipment', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  feed: { label: 'Feed', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  other: { label: 'Other', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

const DEFAULT_CATEGORY_CONFIG = { label: 'Other', color: 'text-gray-700', bgColor: 'bg-gray-100' };

const getCategoryConfig = (category: string): { label: string; color: string; bgColor: string } => {
  return CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_CONFIG;
};

export function InventoryOverview({ farmId, className = '', onItemClick }: InventoryOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get farm and inventory data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: inventory, isLoading, error, refetch } = useInventory(currentFarmId);
  const { data: lowStockItems } = useInventoryLowStock(currentFarmId);

  // Mutations
  const createItem = useCreateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  // Filter inventory
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    let result = [...inventory];

    if (filterCategory !== 'all') {
      result = result.filter(item => (item as any).category === filterCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          (item as any).name?.toLowerCase().includes(query) ||
          (item as any).category?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [inventory, filterCategory, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!inventory) return { total: 0, totalValue: 0, lowStock: 0, expiringSoon: 0 };

    const total = inventory.length;
    const totalValue = inventory.reduce((sum, item) => {
      const value = (item as any).unit_cost ? (item as any).unit_cost * (item as any).quantity : 0;
      return sum + value;
    }, 0);

    const lowStock = inventory.filter(
      item => (item as any).quantity <= ((item as any).min_stock_level || 0)
    ).length;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = inventory.filter(item => {
      const expiry = (item as any).expiry_date;
      return expiry && new Date(expiry) <= thirtyDaysFromNow;
    }).length;

    return { total, totalValue, lowStock, expiringSoon };
  }, [inventory]);

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Inventory</h3>
        <p className="text-gray-600 mb-4">Failed to load inventory data.</p>
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
            <Package className="w-6 h-6 text-purple-600" />
            Inventory Overview
          </h2>
          <p className="text-gray-600">Manage your farm supplies and stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alerts ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.slice(0, 5).map(item => (
                <Badge key={item.id} className="bg-amber-100 text-amber-800">
                  {(item as any).name}: {(item as any).quantity} {(item as any).unit}
                </Badge>
              ))}
              {lowStockItems.length > 5 && (
                <Badge className="bg-amber-100 text-amber-800">
                  +{lowStockItems.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          title="Filter by category"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as FilterCategory)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery || filterCategory !== 'all'
                        ? 'No items match your filters'
                        : 'No inventory items. Add your first item to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const category = (item as any).category || 'other';
                    const config = getCategoryConfig(category);
                    const quantity = (item as any).quantity || 0;
                    const minStock = (item as any).min_stock_level || 0;
                    const unitCost = (item as any).unit_cost || 0;
                    const isLowStock = quantity <= minStock;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onItemClick?.(item)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{(item as any).name}</div>
                          {(item as any).supplier && (
                            <div className="text-xs text-gray-500">{(item as any).supplier}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={config.bgColor}>{config.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                            {quantity} {(item as any).unit}
                          </span>
                          {isLowStock && (
                            <span className="text-xs text-red-500 block">Below minimum</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">${unitCost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          ${(quantity * unitCost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {isLowStock ? (
                            <Badge className="bg-red-100 text-red-800">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              title="Edit"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedItem(item);
                                setShowAddModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              title="Delete"
                              onClick={e => {
                                e.stopPropagation();
                                setShowDeleteConfirm(item.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this item?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteItem(showDeleteConfirm)}
                  disabled={deleteItem.isPending}
                >
                  {deleteItem.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <InventoryFormModal
          item={selectedItem}
          farmId={currentFarmId}
          categories={CATEGORY_CONFIG}
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setSelectedItem(null);
            refetch();
          }}
          createItem={createItem}
        />
      )}
    </div>
  );
}

// Inventory Form Modal
interface InventoryFormModalProps {
  item: InventoryItem | null;
  farmId?: string;
  categories: Record<string, { label: string; color: string; bgColor: string }>;
  onClose: () => void;
  onSave: () => void;
  createItem: { mutateAsync: (data: CreateRequest<InventoryItem>) => Promise<InventoryItem> };
}

function InventoryFormModal({
  item,
  farmId,
  categories,
  onClose,
  onSave,
  createItem,
}: InventoryFormModalProps) {
  const [formData, setFormData] = useState({
    name: (item as any)?.name || '',
    category: (item as any)?.category || 'other',
    quantity: (item as any)?.quantity || 0,
    unit: (item as any)?.unit || 'kg',
    min_stock_level: (item as any)?.min_stock_level || 0,
    unit_cost: (item as any)?.unit_cost || 0,
    supplier: (item as any)?.supplier || '',
    expiry_date: (item as any)?.expiry_date || '',
    notes: (item as any)?.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createItem.mutateAsync({
        ...formData,
        farm_id: farmId,
      } as CreateRequest<InventoryItem>);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{item ? 'Edit Item' : 'Add New Item'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Item name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  title="Select category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(categories).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  title="Select unit"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="L">Liters (L)</option>
                  <option value="units">Units</option>
                  <option value="bags">Bags</option>
                  <option value="pieces">Pieces</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={e =>
                    setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.min_stock_level}
                  onChange={e =>
                    setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={e =>
                    setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                    {item ? 'Update' : 'Add'} Item
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

export default InventoryOverview;
