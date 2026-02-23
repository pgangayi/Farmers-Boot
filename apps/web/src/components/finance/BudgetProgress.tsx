/**
 * Budget Progress Component
 * ========================
 * Displays budget allocation and spending progress
 */

import React from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Budget, BudgetProgressItem } from './types';
import { Button } from '../ui/button';

// Constants for color class names to avoid duplication
const COLOR_GRAY_500 = 'text-gray-500';

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate progress from budgets
const calculateProgress = (budget: Budget): BudgetProgressItem => {
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
};

interface BudgetProgressProps {
  budgets: Budget[];
  onCreateBudget: () => void;
}

export function BudgetProgress({ budgets, onCreateBudget }: BudgetProgressProps) {
  const progressItems = budgets.map(calculateProgress);
  const totalBudgeted = progressItems.reduce((sum, p) => sum + p.budgeted, 0);
  const totalSpent = progressItems.reduce((sum, p) => sum + p.spent, 0);
  const overBudgetCount = progressItems.filter(p => p.is_over_budget).length;

  if (budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Plus className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets created</h3>
        <p className="text-gray-500 mb-4">Create your first budget to track spending by category</p>
        <Button onClick={onCreateBudget} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-6">
          <div>
            <p className={`text-sm ${COLOR_GRAY_500}`}>Total Budgeted</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className={`text-sm ${COLOR_GRAY_500}`}>Total Spent</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className={`text-sm ${COLOR_GRAY_500}`}>Remaining</p>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {overBudgetCount > 0 && (
            <div className="flex items-center text-amber-600">
              <AlertCircle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">{overBudgetCount} over budget</span>
            </div>
          )}
          <Button onClick={onCreateBudget} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Budget
          </Button>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {progressItems.map(item => (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item.category.replace('_', ' ')}
                </span>
                {item.is_over_budget && <AlertCircle className="h-4 w-4 text-red-500" />}
                {!item.is_over_budget && item.percentage_used >= 100 && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className={COLOR_GRAY_500}>
                  {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                </span>
                <span
                  className={`font-medium ${
                    item.is_over_budget
                      ? 'text-red-600'
                      : item.percentage_used > 80
                        ? 'text-amber-600'
                        : 'text-gray-700'
                  }`}
                >
                  {item.percentage_used.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  item.is_over_budget
                    ? 'bg-red-500'
                    : item.percentage_used > 100
                      ? 'bg-red-500'
                      : item.percentage_used > 80
                        ? 'bg-amber-500'
                        : item.percentage_used > 50
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(item.percentage_used, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Budget Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {progressItems.map(item => (
          <div
            key={item.category}
            className={`p-4 rounded-lg border ${
              item.is_over_budget ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <p className={`text-xs ${COLOR_GRAY_500} uppercase tracking-wide mb-1`}>
              {item.category.replace('_', ' ')}
            </p>
            <p
              className={`text-lg font-semibold ${
                item.is_over_budget ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {item.percentage_used.toFixed(0)}%
            </p>
            <p className={`text-xs ${COLOR_GRAY_500} mt-1`}>
              {formatCurrency(item.remaining)} left
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
