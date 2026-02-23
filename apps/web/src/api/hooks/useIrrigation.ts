/**
 * IRRIGATION HOOKS
 * ==============
 * TanStack Query hooks for irrigation system and schedule management
 *
 * This module provides React Query hooks for managing irrigation data,
 * including systems, schedules, and maintenance records.
 * All database field names follow snake_case convention.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { CACHE_CONFIG } from '../constants';
import type { CreateRequest, UpdateRequest } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface IrrigationSystem {
  id: string;
  field_id: string;
  system_type: 'drip' | 'sprinkler' | 'flood' | 'center_pivot' | 'other';
  name: string;
  description?: string;
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  status: 'operational' | 'maintenance' | 'broken' | 'retired';
  water_source?: string;
  flow_rate_liters_per_hour?: number;
  coverage_area_hectares?: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface IrrigationSchedule {
  id: string;
  irrigation_system_id: string;
  schedule_name: string;
  start_date: string;
  end_date?: string;
  frequency_days?: number;
  duration_minutes?: number;
  water_amount_mm?: number;
  status: 'active' | 'inactive' | 'completed';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const IRRIGATION_QUERY_KEYS = {
  all: ['irrigation'] as const,
  systems: (field_id?: string) => ['irrigation', 'systems', field_id] as const,
  system: (id: string) => ['irrigation', 'system', id] as const,
  schedules: (system_id?: string) => ['irrigation', 'schedules', system_id] as const,
  schedule: (id: string) => ['irrigation', 'schedule', id] as const,
} as const;

// ============================================================================
// IRRIGATION SYSTEMS
// ============================================================================

/**
 * Fetch irrigation systems for a field or all systems
 */
export function useIrrigationSystems(field_id?: string) {
  return useQuery({
    queryKey: IRRIGATION_QUERY_KEYS.systems(field_id),
    queryFn: async (): Promise<IrrigationSystem[]> => {
      let endpoint = 'irrigation_systems?select=*';
      if (field_id) {
        endpoint += `&field_id=eq.${field_id}`;
      }
      endpoint += '&order=created_at.desc';

      const response = await apiClient.get<IrrigationSystem[]>(endpoint);
      return response || [];
    },
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Fetch a single irrigation system by ID
 */
export function useIrrigationSystem(id: string) {
  return useQuery({
    queryKey: IRRIGATION_QUERY_KEYS.system(id),
    queryFn: async (): Promise<IrrigationSystem | null> => {
      if (!id) return null;

      return await apiClient.get<IrrigationSystem>(`irrigation_systems?id=eq.${id}&select=*`, {
        single: true,
      });
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Create a new irrigation system
 */
export function useCreateIrrigationSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<IrrigationSystem>): Promise<IrrigationSystem> => {
      return await apiClient.post<IrrigationSystem>('irrigation_systems', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: IRRIGATION_QUERY_KEYS.all });
      if (variables.field_id) {
        queryClient.invalidateQueries({
          queryKey: IRRIGATION_QUERY_KEYS.systems(variables.field_id),
        });
      }
    },
  });
}

/**
 * Update an existing irrigation system
 */
export function useUpdateIrrigationSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequest<IrrigationSystem>;
    }): Promise<IrrigationSystem> => {
      return await apiClient.put<IrrigationSystem>(`irrigation_systems?id=eq.${id}`, data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: IRRIGATION_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: IRRIGATION_QUERY_KEYS.system(variables.id),
      });
    },
  });
}

/**
 * Delete an irrigation system
 */
export function useDeleteIrrigationSystem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`irrigation_systems?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IRRIGATION_QUERY_KEYS.all });
    },
  });
}

// ============================================================================
// IRRIGATION SCHEDULES
// ============================================================================

/**
 * Fetch irrigation schedules for a system or all schedules
 */
export function useIrrigationSchedules(system_id?: string) {
  return useQuery({
    queryKey: IRRIGATION_QUERY_KEYS.schedules(system_id),
    queryFn: async (): Promise<IrrigationSchedule[]> => {
      let endpoint = 'irrigation_schedules?select=*';
      if (system_id) {
        endpoint += `&irrigation_system_id=eq.${system_id}`;
      }
      endpoint += '&order=created_at.desc';

      const response = await apiClient.get<IrrigationSchedule[]>(endpoint);
      return response || [];
    },
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Create a new irrigation schedule
 */
export function useCreateIrrigationSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<IrrigationSchedule>): Promise<IrrigationSchedule> => {
      return await apiClient.post<IrrigationSchedule>('irrigation_schedules', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: IRRIGATION_QUERY_KEYS.all });
      if (variables.irrigation_system_id) {
        queryClient.invalidateQueries({
          queryKey: IRRIGATION_QUERY_KEYS.schedules(variables.irrigation_system_id),
        });
      }
    },
  });
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Export aliases for backward compatibility
export const useIrrigation = useIrrigationSystems;
