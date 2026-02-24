/**
 * Finance Types
 * ============
 * Type definitions for finance-related data structures
 */

// Re-export types from api/types for consistency
export type { FinanceRecord, FinanceEntry, FinanceSummary } from '../../api/types';

// Transaction types
export type TransactionType = 'income' | 'expense';

export type FinanceStatus = 'pending' | 'completed' | 'cancelled';

// Budget categories
export type BudgetCategory =
  | 'seeds'
  | 'fertilizer'
  | 'equipment'
  | 'labor'
  | 'irrigation'
  | 'pesticides'
  | 'transport'
  | 'storage'
  | 'marketing'
  | 'utilities'
  | 'insurance'
  | 'other_income'
  | 'crop_sales'
  | 'livestock_sales'
  | 'subsidies'
  | 'other_expense';

// Form data for creating/updating finance records
export interface FinanceFormData {
  farm_id?: string;
  transaction_type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  transaction_date?: string;
  reference_number?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

// Budget interface
export interface Budget {
  id: string;
  farm_id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  period_start: string;
  period_end: string;
  is_annual: boolean;
  created_at?: string;
  updated_at?: string;
}

// Budget form data
export interface BudgetFormData {
  farm_id?: string;
  category: string;
  allocated_amount: number;
  period_start: string;
  period_end: string;
  is_annual?: boolean;
}

// Finance analytics data
export interface FinanceAnalytics {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  revenue_growth_rate: number;
  expense_growth_rate: number;
  top_income_categories: Array<{ category: string; amount: number }>;
  top_expense_categories: Array<{ category: string; amount: number }>;
  monthly_comparison: Array<{
    month: string;
    current_year: number;
    previous_year: number;
  }>;
  cash_flow: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
  budget_variance: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variance_percentage: number;
  }>;
}

// Report generation parameters
export interface ReportParams {
  farm_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  report_period: string;
  start_date?: string;
  end_date?: string;
  include_charts?: boolean;
  include_breakdown?: boolean;
}

// Budget progress display
export interface BudgetProgressItem {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  is_over_budget: boolean;
}

// Filter options for finance lists
export interface FinanceFilters {
  transaction_type?: TransactionType;
  category?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

// Sort options
export interface FinanceSort {
  field: 'transaction_date' | 'amount' | 'category' | 'created_at';
  direction: 'asc' | 'desc';
}

// Pagination
export interface FinancePagination {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}
