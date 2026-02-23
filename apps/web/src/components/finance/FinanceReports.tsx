/**
 * Finance Reports Component
 * =========================
 * Displays report generation options and history
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { apiClient } from '@/lib';

interface FinanceReportsProps {
  onGenerateReport: (reportType: string) => void;
  isGenerating: boolean;
  farmId?: string;
}

type ReportType = 'monthly' | 'quarterly' | 'annual' | 'custom';

interface ReportOption {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ReportHistoryItem {
  id: string;
  type: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  downloadUrl?: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: 'monthly',
    label: 'Monthly Report',
    description: 'Detailed breakdown of income and expenses for the current month',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    type: 'quarterly',
    label: 'Quarterly Report',
    description: 'Comprehensive overview of financial performance over 3 months',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    type: 'annual',
    label: 'Annual Report',
    description: 'Full year financial summary with year-over-year comparisons',
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    type: 'custom',
    label: 'Custom Report',
    description: 'Generate a report with custom date range and categories',
    icon: <PieChart className="h-5 w-5" />,
  },
];

export function FinanceReports({ onGenerateReport, isGenerating, farmId }: FinanceReportsProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // Fetch report history from API
  const {
    data: reportHistory,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<ReportHistoryItem[]>({
    queryKey: ['finance-reports-history', farmId],
    queryFn: async () => {
      const params = farmId ? `?farm_id=${farmId}` : '';
      return await apiClient.get<ReportHistoryItem[]>(`/finance/reports/history${params}`);
    },
  });

  const handleGenerate = () => {
    if (selectedType) {
      onGenerateReport(selectedType);
    }
  };

  const handleDownload = async (report: ReportHistoryItem) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      // Fetch download URL from API
      try {
        const result = await apiClient.get<{ url: string }>(
          `/finance/reports/${report.id}/download`
        );
        if (result.url) {
          window.open(result.url, '_blank');
        }
      } catch (error) {
        console.error('Failed to download report:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Reports</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generate and download detailed financial reports
          </p>
        </div>
      </div>

      {/* Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_OPTIONS.map(option => (
          <div
            key={option.type}
            className={`bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
              selectedType === option.type
                ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedType(option.type)}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`p-2 rounded-lg ${
                  selectedType === option.type
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{option.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedType === option.type ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}
              >
                {selectedType === option.type && <CheckCircle className="h-3 w-3 text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Date Range (shown when custom is selected) */}
      {selectedType === 'custom' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Custom Date Range</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={e => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Start date"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={e => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="End date"
              />
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex items-center justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => setSelectedType(null)}
          disabled={!selectedType || isGenerating}
        >
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={!selectedType || isGenerating}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-400" />
            Recent Reports
          </h3>
          <Button variant="ghost" size="sm" onClick={() => refetchHistory()}>
            Refresh
          </Button>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : historyError ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-gray-500">Error loading report history</p>
            <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
              Retry
            </Button>
          </div>
        ) : !reportHistory || reportHistory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No reports generated yet</p>
        ) : (
          <div className="space-y-3">
            {reportHistory.map(report => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.type}</p>
                    <p className="text-xs text-gray-500">{report.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {report.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {report.status === 'pending' && (
                    <span className="text-xs text-yellow-600 flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Processing
                    </span>
                  )}
                  {report.status === 'failed' && (
                    <span className="text-xs text-red-600">Failed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
