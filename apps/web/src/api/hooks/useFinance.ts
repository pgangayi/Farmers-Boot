/**
 * Finance Hooks
 * ============
 * React Query hooks for finance data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import { supabaseApi } from '../../lib/supabase';
import {
  FinanceRecord,
  FinanceFormData,
  Budget,
  BudgetFormData,
  FinanceSummary,
  FinanceAnalytics,
} from '../../components/finance/types';

// Direct Supabase table access - no URL building needed

/**
 * Fetch finance records for a farm
 */
export function useFinance(filters?: { farm_id?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.finance.list(filters),
    queryFn: async () => {
      return await supabaseApi.get<FinanceRecord>('finance_records', { eq: filters });
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
      return await supabaseApi.getById<FinanceRecord>('finance_records', id);
    },
    enabled: !!id,
  });
}

/**
 * Fetch finance summary for a farm
 */
// TODO: Implement finance summary using Supabase RPC or aggregation
export function useFinanceSummary(_filters?: { farm_id?: string; period?: string }) {
  return useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: async () => {
      // Placeholder - implement aggregation query
      return {} as FinanceSummary;
    },
    enabled: false, // Disable until implemented
  });
}

/**
 * Fetch budgets for a farm
 */
export function useBudgets(farmId?: string) {
  return useQuery({
    queryKey: ['budgets', farmId],
    queryFn: async () => {
      return await supabaseApi.get<Budget>('budgets', { eq: farmId ? { farm_id: farmId } : undefined });
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
      return await supabaseApi.getById<Budget>('budgets', id);
    },
    enabled: !!id,
  });
}

/**
 * Fetch finance analytics for a farm
 */
// TODO: Implement finance analytics using Supabase RPC or aggregation
export function useFinanceAnalytics(_farmId?: string, _period: string = '12months') {
  return useQuery({
    queryKey: ['finance', 'analytics'],
    queryFn: async () => {
      // Placeholder - implement aggregation query
      return {} as FinanceAnalytics;
    },
    enabled: false, // Disable until implemented
  });
}

/**
 * Create a new finance record
 */
export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FinanceFormData) => {
      return await supabaseApi.create<FinanceRecord>('finance_records', data as Partial<FinanceRecord>);
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
      return await supabaseApi.update<FinanceRecord>('finance_records', id, data as Partial<FinanceRecord>);
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
      await supabaseApi.delete('finance_records', id);
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
      return await supabaseApi.create<Budget>('budgets', data);
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
      return await supabaseApi.update<Budget>('budgets', id, data);
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
      await supabaseApi.delete('budgets', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Generate a finance report
 */
// TODO: Implement finance report generation using Supabase RPC or Edge Function
export function useGenerateFinanceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_params: { farm_id: string; report_type: string; report_period: string }) => {
      // Placeholder - implement using Supabase RPC or Edge Function
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      // Optionally invalidate finance queries after report generation
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}
