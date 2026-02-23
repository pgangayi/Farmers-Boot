/**
 * PEST AND DISEASE MANAGER COMPONENT
 * ====================================
 * Manage pest and disease issues with detection, treatment, and monitoring
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  usePestDiseaseRecords,
  useCreatePestDiseaseRecord,
  useUpdatePestDiseaseRecord,
  useDeletePestDiseaseRecord,
  type PestDiseaseRecord,
} from '../api/hooks/usePestDisease';
import { useFarms } from '../api/hooks/useFarms';
import { useCrops } from '../api/hooks/useCrops';
import { useLocations } from '../api/hooks/useLocations';
import {
  AlertTriangle,
  Bug,
  Shield,
  SprayCan,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Plus,
  Search,
  Filter,
  X,
  Save,
  Loader2,
  Edit,
  Trash2,
  Activity,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface PestDiseaseManagerProps {
  farmId?: string;
  className?: string;
}

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { label: 'Medium', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  severe: { label: 'Severe', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-red-700', bgColor: 'bg-red-100' },
  monitoring: { label: 'Monitoring', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  treated: { label: 'Treated', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  resolved: { label: 'Resolved', color: 'text-green-700', bgColor: 'bg-green-100' },
};

const TYPE_CONFIG = {
  pest: { label: 'Pest', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Bug },
  disease: { label: 'Disease', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertCircle },
};

const CHART_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

export function PestDiseaseManager({ farmId, className = '' }: PestDiseaseManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIssue, setSelectedIssue] = useState<PestDiseaseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Get farm and data
  const { data: farms } = useFarms();
  const currentFarmId = farmId || farms?.[0]?.id;
  const { data: crops } = useCrops(currentFarmId);
  const { data: fields } = useLocations(currentFarmId);
  const {
    data: issues,
    isLoading,
    error,
    refetch,
  } = usePestDiseaseRecords({ farm_id: currentFarmId });

  // Mutations
  const createRecord = useCreatePestDiseaseRecord();
  const updateRecord = useUpdatePestDiseaseRecord();
  const deleteRecord = useDeletePestDiseaseRecord();

  // Filter issues
  const filteredIssues = useMemo(() => {
    if (!issues) return [];

    let result = [...issues];

    if (filterType !== 'all') {
      result = result.filter(issue => issue.record_type === filterType);
    }

    if (filterSeverity !== 'all') {
      result = result.filter(issue => issue.severity === filterSeverity);
    }

    if (filterStatus !== 'all') {
      result = result.filter(issue => issue.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        issue =>
          issue.name.toLowerCase().includes(query) || issue.notes?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [issues, filterType, filterSeverity, filterStatus, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!issues || issues.length === 0) {
      return { total: 0, active: 0, pests: 0, diseases: 0, bySeverity: [], byStatus: [] };
    }

    const active = issues.filter(i => i.status === 'active').length;
    const pests = issues.filter(i => i.record_type === 'pest').length;
    const diseases = issues.filter(i => i.record_type === 'disease').length;

    const bySeverity = Object.entries(
      issues.reduce(
        (acc, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    ).map(([name, value]) => ({
      name: SEVERITY_CONFIG[name as keyof typeof SEVERITY_CONFIG]?.label || name,
      value,
    }));

    const byStatus = Object.entries(
      issues.reduce(
        (acc, issue) => {
          acc[issue.status] = (acc[issue.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      )
    ).map(([name, value]) => ({
      name: STATUS_CONFIG[name as keyof typeof STATUS_CONFIG]?.label || name,
      value,
    }));

    return { total: issues.length, active, pests, diseases, bySeverity, byStatus };
  }, [issues]);

  // Get active alerts
  const activeAlerts = useMemo(() => {
    if (!issues) return [];
    return issues
      .filter(i => i.status === 'active' && (i.severity === 'high' || i.severity === 'severe'))
      .sort((a, b) => {
        const severityOrder = { severe: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }, [issues]);

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord.mutateAsync(id);
      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  const handleStatusChange = async (
    issue: PestDiseaseRecord,
    newStatus: PestDiseaseRecord['status']
  ) => {
    try {
      await updateRecord.mutateAsync({
        id: issue.id,
        data: { status: newStatus },
      });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
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
        <p className="text-gray-600 mb-4">Failed to load pest and disease records.</p>
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
            <Shield className="w-6 h-6 text-red-600" />
            Pest & Disease Manager
          </h2>
          <p className="text-gray-600">Monitor and manage pest and disease issues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">
                Active Alerts ({activeAlerts.length})
              </span>
            </div>
            <div className="space-y-2">
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <div className="flex items-center gap-3">
                    {alert.record_type === 'pest' ? (
                      <Bug className="w-5 h-5 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{alert.name}</p>
                      <p className="text-sm text-gray-500">Detected: {alert.detection_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={SEVERITY_CONFIG[alert.severity]?.bgColor}>
                      {SEVERITY_CONFIG[alert.severity]?.label}
                    </Badge>
                    <Button size="sm" onClick={() => setSelectedIssue(alert)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Activity className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Issues</p>
                <p className="text-2xl font-bold text-red-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pests</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pests}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Bug className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Diseases</p>
                <p className="text-2xl font-bold text-red-600">{stats.diseases}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">All Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.bySeverity}
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
                        {stats.bySeverity.map((_, index) => (
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

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredIssues.slice(0, 5).map(issue => (
                  <div
                    key={issue.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {issue.record_type === 'pest' ? (
                          <Bug className="w-5 h-5 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{issue.name}</p>
                          <p className="text-sm text-gray-500">
                            Detected: {new Date(issue.detection_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={SEVERITY_CONFIG[issue.severity]?.bgColor}>
                          {SEVERITY_CONFIG[issue.severity]?.label}
                        </Badge>
                        <Badge className={STATUS_CONFIG[issue.status]?.bgColor}>
                          {STATUS_CONFIG[issue.status]?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">All Issues</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <select
                    title="Filter by type"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Types</option>
                    <option value="pest">Pests</option>
                    <option value="disease">Diseases</option>
                  </select>
                  <select
                    title="Filter by severity"
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Severity</option>
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Detected</th>
                      <th className="text-left p-3">Treatment</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          No issues found
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map(issue => (
                        <tr key={issue.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <Badge className={TYPE_CONFIG[issue.record_type]?.bgColor}>
                              {TYPE_CONFIG[issue.record_type]?.label}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium">{issue.name}</td>
                          <td className="p-3">
                            <Badge className={SEVERITY_CONFIG[issue.severity]?.bgColor}>
                              {SEVERITY_CONFIG[issue.severity]?.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <select
                              title="Change status"
                              value={issue.status}
                              onChange={e =>
                                handleStatusChange(
                                  issue,
                                  e.target.value as PestDiseaseRecord['status']
                                )
                              }
                              className={`px-2 py-1 rounded ${STATUS_CONFIG[issue.status]?.bgColor}`}
                            >
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <option key={key} value={key}>
                                  {config.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            {new Date(issue.detection_date).toLocaleDateString()}
                          </td>
                          <td className="p-3">{issue.treatment_method || '-'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                title="Edit"
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setShowAddModal(true);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => setShowDeleteConfirm(issue.id)}
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treatment Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredIssues
                    .filter(i => i.treatment_method)
                    .slice(0, 5)
                    .map(issue => (
                      <div key={issue.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{issue.name}</span>
                          <Badge className={STATUS_CONFIG[issue.status]?.bgColor}>
                            {STATUS_CONFIG[issue.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.treatment_method}</p>
                        {issue.treatment_cost && (
                          <p className="text-sm text-gray-500 mt-1">
                            Cost: ${issue.treatment_cost}
                          </p>
                        )}
                      </div>
                    ))}
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
                      <span className="text-gray-600">Total Treatment Cost</span>
                      <span className="font-bold">
                        $
                        {filteredIssues
                          .reduce((sum, i) => sum + (i.treatment_cost || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Resolution Rate</span>
                      <span className="font-bold text-green-600">
                        {stats.total > 0
                          ? Math.round(((stats.total - stats.active) / stats.total) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">High Priority Issues</span>
                      <span className="font-bold text-red-600">
                        {
                          filteredIssues.filter(
                            i => i.severity === 'high' || i.severity === 'severe'
                          ).length
                        }
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
              <p className="text-gray-600 mb-4">Are you sure you want to delete this record?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={deleteRecord.isPending}
                >
                  {deleteRecord.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <RecordFormModal
          record={selectedIssue}
          fields={fields || []}
          crops={crops || []}
          onClose={() => {
            setShowAddModal(false);
            setSelectedIssue(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setSelectedIssue(null);
            refetch();
          }}
          createRecord={createRecord}
          updateRecord={updateRecord}
        />
      )}
    </div>
  );
}

// Record Form Modal
interface RecordFormModalProps {
  record: PestDiseaseRecord | null;
  fields: any[];
  crops: any[];
  onClose: () => void;
  onSave: () => void;
  createRecord: { mutateAsync: (data: any) => Promise<PestDiseaseRecord> };
  updateRecord: { mutateAsync: (params: { id: string; data: any }) => Promise<PestDiseaseRecord> };
}

function RecordFormModal({
  record,
  fields,
  crops,
  onClose,
  onSave,
  createRecord,
  updateRecord,
}: RecordFormModalProps) {
  const [formData, setFormData] = useState({
    record_type: record?.record_type || 'pest',
    name: record?.name || '',
    severity: record?.severity || 'medium',
    status: record?.status || 'active',
    detection_date: record?.detection_date || new Date().toISOString().split('T')[0],
    treatment_method: record?.treatment_method || '',
    treatment_date: record?.treatment_date || '',
    treatment_cost: record?.treatment_cost || '',
    notes: record?.notes || '',
    field_id: record?.field_id || '',
    crop_id: record?.crop_id || '',
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
        treatment_cost: formData.treatment_cost
          ? parseFloat(String(formData.treatment_cost))
          : null,
      };

      if (record?.id) {
        await updateRecord.mutateAsync({ id: record.id, data });
      } else {
        await createRecord.mutateAsync(data);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{record ? 'Edit Record' : 'Add New Record'}</CardTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full" title="Close">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <select
                  title="Select type"
                  value={formData.record_type}
                  onChange={e =>
                    setFormData({ ...formData, record_type: e.target.value as 'pest' | 'disease' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pest">Pest</option>
                  <option value="disease">Disease</option>
                </select>
              </div>
              <div>
                <Label>Severity</Label>
                <select
                  title="Select severity"
                  value={formData.severity}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      severity: e.target.value as PestDiseaseRecord['severity'],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Aphid Infestation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <select
                  title="Select status"
                  value={formData.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value as PestDiseaseRecord['status'],
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
              <div>
                <Label>Detection Date</Label>
                <Input
                  type="date"
                  title="Detection date"
                  value={formData.detection_date}
                  onChange={e => setFormData({ ...formData, detection_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label>Crop</Label>
                <select
                  title="Select crop"
                  value={formData.crop_id}
                  onChange={e => setFormData({ ...formData, crop_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select crop</option>
                  {crops.map(crop => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Treatment Method</Label>
              <Input
                value={formData.treatment_method}
                onChange={e => setFormData({ ...formData, treatment_method: e.target.value })}
                placeholder="e.g., Organic Insecticidal Soap"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Treatment Date</Label>
                <Input
                  type="date"
                  title="Treatment date"
                  value={formData.treatment_date}
                  onChange={e => setFormData({ ...formData, treatment_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Treatment Cost ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  title="Treatment cost"
                  value={formData.treatment_cost}
                  onChange={e => setFormData({ ...formData, treatment_cost: e.target.value })}
                  placeholder="0.00"
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
                    {record ? 'Update' : 'Add'} Record
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

export default PestDiseaseManager;
