/**
 * Finance Overview Component
 * ==========================
 * Displays summary cards and overview of financial status
 */

import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
} from 'lucide-react';
import { FinanceRecord, Budget, BudgetProgressItem, TransactionType } from './types';
import { BudgetProgress } from './BudgetProgress';

// Constants for transaction types to avoid duplication
const TRANSACTION_TYPE_INCOME = 'income';
const TRANSACTION_TYPE_EXPENSE = 'expense';

// Constants for color class names to avoid duplication
const COLOR_GREEN_600 = 'text-green-600';
const COLOR_RED_600 = 'text-red-600';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate summary from entries
const calculateSummary = (entries: FinanceRecord[]) => {
  const totalIncome = entries
    .filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_INCOME)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = entries
    .filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_EXPENSE)
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  // Calculate monthly average
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const recentEntries = entries.filter(
    e => new Date(e.transaction_date || e.date || Date.now()) >= sixMonthsAgo
  );
  const monthlyAvgIncome =
    recentEntries
      .filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_INCOME)
      .reduce((sum, e) => sum + e.amount, 0) / 6;
  const monthlyAvgExpenses =
    recentEntries
      .filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_EXPENSE)
      .reduce((sum, e) => sum + e.amount, 0) / 6;

  return { totalIncome, totalExpenses, netProfit, monthlyAvgIncome, monthlyAvgExpenses };
};

// Calculate budget progress
const calculateBudgetProgress = (budgets: Budget[]): BudgetProgressItem[] => {
  return budgets.map(budget => {
    const percentageUsed =
      budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0;
    const remaining = budget.allocated_amount - budget.spent_amount;

    return {
      category: budget.category,
      budgeted: budget.allocated_amount,
      spent: budget.spent_amount,
      remaining,
      percentage_used: percentageUsed,
      is_over_budget: budget.spent_amount > budget.allocated_amount,
    };
  });
};

interface FinanceOverviewProps {
  entries: FinanceRecord[];
  budgets: Budget[];
}

export function FinanceOverview({ entries, budgets }: FinanceOverviewProps) {
  const summary = useMemo(() => calculateSummary(entries), [entries]);
  const budgetProgress = useMemo(() => calculateBudgetProgress(budgets), [budgets]);

  // Calculate budget utilization
  const totalBudgeted = budgetProgress.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
  const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Determine text color based on net profit
  const netProfitColor = summary.netProfit >= 0 ? COLOR_GREEN_600 : COLOR_RED_600;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className={`text-2xl font-bold ${COLOR_GREEN_600} mt-1`}>
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className={`h-6 w-6 ${COLOR_GREEN_600}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            <span className={`${COLOR_GREEN_600} font-medium`}>
              {formatCurrency(summary.monthlyAvgIncome)}/mo
            </span>
            <span className="text-gray-500 ml-2">average</span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className={`text-2xl font-bold ${COLOR_RED_600} mt-1`}>
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className={`h-6 w-6 ${COLOR_RED_600}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            <span className={`${COLOR_RED_600} font-medium`}>
              {formatCurrency(summary.monthlyAvgExpenses)}/mo
            </span>
            <span className="text-gray-500 ml-2">average</span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${netProfitColor}`}>
                {formatCurrency(summary.netProfit)}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${summary.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
            >
              <DollarSign className={`h-6 w-6 ${netProfitColor}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${netProfitColor}`}>
              {summary.netProfit >= 0 ? 'Profitable' : 'Loss'}
            </span>
            <span className="text-gray-500 ml-2">{entries.length} transactions</span>
          </div>
        </div>

        {/* Budget Utilization Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Budget Used</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {budgetUtilization.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <PieChart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetUtilization > 100
                    ? 'bg-red-500'
                    : budgetUtilization > 80
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Progress Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h2>
        <BudgetProgress budgets={budgets} onCreateBudget={() => {}} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {entries
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.transaction_date || b.date || Date.now()).getTime() -
                  new Date(a.transaction_date || a.date || Date.now()).getTime()
              )
              .slice(0, 5)
              .map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{entry.description || '-'}</p>
                    <p className="text-xs text-gray-500">{entry.category}</p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      (entry.type || entry.entry_type) === TRANSACTION_TYPE_INCOME
                        ? COLOR_GREEN_600
                        : COLOR_RED_600
                    }`}
                  >
                    {(entry.type || entry.entry_type) === TRANSACTION_TYPE_INCOME ? '+' : '-'}
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              ))}
            {entries.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
            )}
          </div>
        </div>

        {/* Income by Category */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className={`h-4 w-4 mr-2 ${COLOR_GREEN_600}`} />
            Income by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(
              entries
                .filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_INCOME)
                .reduce(
                  (acc, e) => {
                    acc[e.category] = (acc[e.category] || 0) + e.amount;
                    return acc;
                  },
                  {} as Record<string, number>
                )
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <span className={`text-sm font-medium ${COLOR_GREEN_600}`}>
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            {entries.filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_INCOME).length ===
              0 && <p className="text-sm text-gray-500 text-center py-4">No income recorded</p>}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingDown className={`h-4 w-4 mr-2 ${COLOR_RED_600}`} />
            Expenses by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(
              entries
                .filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_EXPENSE)
                .reduce(
                  (acc, e) => {
                    acc[e.category] = (acc[e.category] || 0) + e.amount;
                    return acc;
                  },
                  {} as Record<string, number>
                )
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <span className={`text-sm font-medium ${COLOR_RED_600}`}>
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            {entries.filter(e => (e.type || e.entry_type) === TRANSACTION_TYPE_EXPENSE).length ===
              0 && <p className="text-sm text-gray-500 text-center py-4">No expenses recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
