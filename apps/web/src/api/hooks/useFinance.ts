/**
 * Finance Hooks
 * ============
 * React Query hooks for finance data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import { apiClient } from '../../lib';
import { ENDPOINTS } from '../config';
import {
  FinanceRecord,
  FinanceFormData,
  Budget,
  BudgetFormData,
  FinanceSummary,
  FinanceAnalytics,
} from '../../components/finance/types';

// Helper to build query string from filters
const buildQueryString = (filters?: Record<string, any>): string => {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : '';
};

/**
 * Fetch finance records for a farm
 */
export function useFinance(filters?: { farm_id?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.list(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      return await apiClient.get<FinanceRecord[]>(`${ENDPOINTS.finance.list}${queryString}`);
    },
    enabled: !!filters?.farm_id,
  });
}

/**
 * Fetch a single finance record by ID
 */
export function useFinanceRecord(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.detail(id),
    queryFn: async () => {
      return await apiClient.get<FinanceRecord | null>(
        `${ENDPOINTS.finance.list}?id=eq.${id}&limit=1`,
        { single: true }
      );
    },
    enabled: !!id,
  });
}

/**
 * Fetch finance summary for a farm
 */
export function useFinanceSummary(filters?: { farm_id?: string; period?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.summary(filters),
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      return await apiClient.get<FinanceSummary>(`${ENDPOINTS.finance.list}/summary${queryString}`);
    },
    enabled: !!filters?.farm_id,
  });
}

/**
 * Fetch budgets for a farm
 */
export function useBudgets(farmId?: string) {
  return useQuery({
    queryKey: ['budgets', farmId],
    queryFn: async () => {
      const queryString = farmId ? `?farm_id=eq.${farmId}` : '';
      return await apiClient.get<Budget[]>(`/finance/budgets${queryString}`);
    },
    enabled: !!farmId,
  });
}

/**
 * Fetch a single budget by ID
 */
export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', 'detail', id],
    queryFn: async () => {
      return await apiClient.get<Budget | null>(`/finance/budgets?id=eq.${id}&limit=1`, {
        single: true,
      });
    },
    enabled: !!id,
  });
}

/**
 * Fetch finance analytics for a farm
 */
export function useFinanceAnalytics(farmId?: string, period: string = '12months') {
  return useQuery({
    queryKey: ['finance', 'analytics', farmId, period],
    queryFn: async () => {
      const queryString = farmId ? `?farm_id=${farmId}&period=${period}` : '';
      return await apiClient.get<FinanceAnalytics>(`${ENDPOINTS.finance.stats}${queryString}`);
    },
    enabled: !!farmId,
  });
}

/**
 * Create a new finance record
 */
export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FinanceFormData) => {
      return await apiClient.post<FinanceRecord>(ENDPOINTS.finance.create, data);
    },
    onSuccess: () => {
      // Invalidate all finance-related queries
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.all });
    },
  });
}

/**
 * Update an existing finance record
 */
export function useUpdateFinanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FinanceFormData> }) => {
      return await apiClient.put<FinanceRecord>(`${ENDPOINTS.finance.update}?id=eq.${id}`, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate all finance-related queries
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.detail(variables.id) });
    },
  });
}

/**
 * Delete a finance record
 */
export function useDeleteFinanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`${ENDPOINTS.finance.delete(id)}`);
    },
    onSuccess: () => {
      // Invalidate all finance-related queries
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.finance.all });
    },
  });
}

/**
 * Create a new budget
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BudgetFormData) => {
      return await apiClient.post<Budget>('/finance/budgets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Update an existing budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BudgetFormData> }) => {
      return await apiClient.put<Budget>(`/finance/budgets?id=eq.${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Delete a budget
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete<{ success: boolean }>(`/finance/budgets?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Generate a finance report
 */
export function useGenerateFinanceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { farm_id: string; report_type: string; report_period: string }) => {
      return await apiClient.post<Blob>(ENDPOINTS.finance.report, params);
    },
    onSuccess: () => {
      // Optionally invalidate finance queries after report generation
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}
