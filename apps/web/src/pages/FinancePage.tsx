import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Receipt, Target, FileText, BarChart3, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useAuth } from '../hooks/AuthContext';
import {
  useFinance,
  useCreateFinanceRecord,
  useUpdateFinanceRecord,
  useDeleteFinanceRecord,
  useBudgets,
  useFarmWithSelection,
  apiClient,
  ENDPOINTS,
} from '../api';
import type { FinanceRecord } from '../api/types';
import { FinanceFormData, Budget, FinanceAnalytics } from '../components/finance/types';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { FinanceEntryList } from '../components/finance/FinanceEntryList';
import { BudgetProgress } from '../components/finance/BudgetProgress';
import { FinanceReports } from '../components/finance/FinanceReports';
import { FinanceAnalytics as FinanceAnalyticsComponent } from '../components/finance/FinanceAnalytics';
import { FinanceEntryModal } from '../components/finance/FinanceEntryModal';

// Helper function to build query string from filters
const buildQueryString = (filters?: Record<string, any>): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
};

export function FinancePage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { currentFarm } = useFarmWithSelection();
  const [viewMode, setViewMode] = useState<
    'overview' | 'entries' | 'budgets' | 'reports' | 'analytics'
  >('overview');

  // State for modals and forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceRecord | null>(null);
  const [showCreateBudget, setShowCreateBudget] = useState(false);

  // Use unified hooks
  const {
    data: rawEntries = [],
    isLoading,
    error,
  } = useFinance(currentFarm?.id ? { farm_id: currentFarm.id } : undefined);

  const entries: FinanceRecord[] = useMemo(() => {
    return rawEntries.map((entry: FinanceRecord) => ({
      ...entry,
      date: entry.transaction_date || entry.date,
      status: entry.status || 'completed',
    }));
  }, [rawEntries]);

  const createMutation = useCreateFinanceRecord();
  const updateMutation = useUpdateFinanceRecord();
  const deleteMutation = useDeleteFinanceRecord();

  // Get budget categories
  const { data: budgets = [] } = useBudgets(currentFarm?.id);

  // Get financial analytics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['finance', 'analytics', currentFarm?.id],
    queryFn: async () => {
      if (!currentFarm?.id) return null;
      const queryString = buildQueryString({ farm_id: currentFarm.id, period: '12months' });
      return await apiClient.get<any>(`${ENDPOINTS.finance.stats}${queryString}`);
    },
    enabled: !!currentFarm?.id && isAuthenticated(),
  });

  // Report generation state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleCreateEntry = async (entryData: FinanceFormData) => {
    try {
      await createMutation.mutateAsync({
        ...entryData,
        farm_id: currentFarm?.id || '',
      } as FinanceFormData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create entry', error);
    }
  };

  const handleUpdateEntry = async (entryData: FinanceFormData) => {
    if (editingEntry) {
      try {
        await updateMutation.mutateAsync({
          id: editingEntry.id,
          data: entryData,
        });
        setEditingEntry(null);
      } catch (error) {
        console.error('Failed to update entry', error);
      }
    }
  };

  const handleGenerateReport = async (reportType: string = 'monthly') => {
    if (currentFarm) {
      try {
        setIsGeneratingReport(true);
        const reportData = {
          farm_id: currentFarm.id,
          report_type: reportType,
          report_period: new Date().toISOString().substring(0, 7),
        };
        const result = await apiClient.post<Blob>(ENDPOINTS.finance.report, reportData, {});

        // Create and trigger download of the report
        const blob =
          result instanceof Blob
            ? result
            : new Blob([JSON.stringify(result)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `finance-report-${reportData.report_period}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to generate report', error);
        throw error;
      } finally {
        setIsGeneratingReport(false);
      }
    }
  };

  // Handle view entry - convert to editing mode for now
  const handleViewEntry = (entry: FinanceRecord) => {
    setEditingEntry(entry);
  };

  // Handle edit entry
  const handleEditEntry = (entry: FinanceRecord) => {
    setEditingEntry(entry);
  };

  // Breadcrumb items
  const breadcrumbItems = [{ label: 'Dashboard', href: '/' }, { label: 'Finance' }];

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to view finance data.</p>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading finance data...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error loading finance data</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600 mt-1">Track revenue, expenses, and financial performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setViewMode('analytics')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: DollarSign },
              { key: 'entries', label: 'Entries', icon: Receipt },
              { key: 'budgets', label: 'Budgets', icon: Target },
              { key: 'reports', label: 'Reports', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() =>
                  setViewMode(key as 'entries' | 'analytics' | 'overview' | 'budgets' | 'reports')
                }
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {viewMode === 'overview' && <FinanceOverview entries={entries} budgets={budgets} />}

        {/* Entries Tab */}
        {viewMode === 'entries' && (
          <FinanceEntryList
            entries={entries}
            onEdit={handleEditEntry}
            onView={handleViewEntry}
            onCreate={() => setShowCreateForm(true)}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {/* Budgets Tab */}
        {viewMode === 'budgets' && (
          <BudgetProgress budgets={budgets} onCreateBudget={() => setShowCreateBudget(true)} />
        )}

        {/* Reports Tab */}
        {viewMode === 'reports' && (
          <FinanceReports
            onGenerateReport={handleGenerateReport}
            isGenerating={isGeneratingReport}
          />
        )}

        {/* Analytics Tab */}
        {viewMode === 'analytics' && <FinanceAnalyticsComponent analytics={analytics} />}

        {/* Create/Edit Entry Modal */}
        {(showCreateForm || editingEntry) && (
          <FinanceEntryModal
            entry={editingEntry}
            farms={currentFarm ? [{ id: currentFarm.id, name: currentFarm.name }] : []}
            onSave={editingEntry ? handleUpdateEntry : handleCreateEntry}
            onClose={() => {
              setShowCreateForm(false);
              setEditingEntry(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

export default FinancePage;
