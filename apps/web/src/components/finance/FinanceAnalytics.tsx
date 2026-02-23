/**
 * Finance Analytics Component
 * ===========================
 * Displays detailed financial analytics and charts
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { FinanceAnalytics as FinanceAnalyticsType, BudgetCategory } from './types';
import { Button } from '../ui/button';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage
const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

interface FinanceAnalyticsProps {
  analytics: FinanceAnalyticsType | null | undefined;
}

// Default analytics when none provided
const DEFAULT_ANALYTICS: FinanceAnalyticsType = {
  total_revenue: 0,
  total_expenses: 0,
  net_profit: 0,
  profit_margin: 0,
  revenue_growth_rate: 0,
  expense_growth_rate: 0,
  top_income_categories: [],
  top_expense_categories: [],
  monthly_comparison: [],
  cash_flow: [],
  budget_variance: [],
};

export function FinanceAnalytics({ analytics }: FinanceAnalyticsProps) {
  const data = useMemo(() => analytics || DEFAULT_ANALYTICS, [analytics]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    return {
      totalRevenue: data.total_revenue,
      totalExpenses: data.total_expenses,
      netProfit: data.net_profit,
      profitMargin: data.profit_margin,
      revenueGrowth: data.revenue_growth_rate,
      expenseGrowth: data.expense_growth_rate,
    };
  }, [data]);

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-500">Add transactions to see financial analytics and insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Financial Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          Detailed analysis of your farm's financial performance
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(summaryMetrics.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {summaryMetrics.revenueGrowth >= 0 ? (
              <>
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {formatPercentage(summaryMetrics.revenueGrowth)}
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600 font-medium">
                  {formatPercentage(summaryMetrics.revenueGrowth)}
                </span>
              </>
            )}
            <span className="text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(summaryMetrics.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {summaryMetrics.expenseGrowth >= 0 ? (
              <>
                <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600 font-medium">
                  {formatPercentage(summaryMetrics.expenseGrowth)}
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">
                  {formatPercentage(summaryMetrics.expenseGrowth)}
                </span>
              </>
            )}
            <span className="text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  summaryMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(summaryMetrics.netProfit)}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                summaryMetrics.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <DollarSign
                className={`h-6 w-6 ${
                  summaryMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              />
            </div>
          </div>
          <div className="mt-4">
            <span
              className={`text-sm font-medium ${
                summaryMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summaryMetrics.netProfit >= 0 ? 'Profit' : 'Loss'}
            </span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Profit Margin</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {summaryMetrics.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Percent className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  summaryMetrics.profitMargin > 20
                    ? 'bg-green-500'
                    : summaryMetrics.profitMargin > 10
                      ? 'bg-blue-500'
                      : summaryMetrics.profitMargin > 0
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(Math.abs(summaryMetrics.profitMargin), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Income Categories */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Top Income Sources
          </h3>
          <div className="space-y-4">
            {data.top_income_categories.slice(0, 5).map((item, index) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (item.amount / (data.top_income_categories[0]?.amount || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {data.top_income_categories.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No income data available</p>
            )}
          </div>
        </div>

        {/* Top Expense Categories */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
            Top Expense Categories
          </h3>
          <div className="space-y-4">
            {data.top_expense_categories.slice(0, 5).map((item, index) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-red-600">{formatCurrency(item.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (item.amount / (data.top_expense_categories[0]?.amount || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {data.top_expense_categories.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No expense data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget Variance */}
      {data.budget_variance.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-blue-600" />
            Budget Variance Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budgeted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.budget_variance.map(item => (
                  <tr key={item.category}>
                    <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {formatCurrency(item.budgeted)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(item.actual)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium text-right ${
                        item.variance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(item.variance))}{' '}
                      {item.variance >= 0 ? 'under' : 'over'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.variance_percentage > 0
                            ? 'bg-green-100 text-green-800'
                            : item.variance_percentage > -10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.variance_percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
