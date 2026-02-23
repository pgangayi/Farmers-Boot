/**
 * PEST AND DISEASE HOOKS
 * ========================
 * TanStack Query hooks for pest and disease management
 *
 * This module provides React Query hooks for managing pest and disease records,
 * including detection, treatment, and monitoring.
 * All database field names follow snake_case convention.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { CACHE_CONFIG } from '../constants';
import type { CreateRequest, UpdateRequest } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface PestDiseaseRecord {
  id: string;
  field_id?: string;
  crop_id?: string;
  livestock_id?: string;
  record_type: 'pest' | 'disease';
  name: string;
  scientific_name?: string;
  severity: 'low' | 'medium' | 'high' | 'severe';
  affected_area_hectares?: number;
  detection_date: string;
  treatment_method?: string;
  treatment_date?: string;
  treatment_cost?: number;
  status: 'active' | 'treated' | 'resolved' | 'monitoring';
  notes?: string;
  reported_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const PEST_DISEASE_QUERY_KEYS = {
  all: ['pest_disease'] as const,
  list: (filters?: Record<string, unknown>) => ['pest_disease', 'list', filters] as const,
  detail: (id: string) => ['pest_disease', 'detail', id] as const,
  byField: (field_id: string) => ['pest_disease', 'field', field_id] as const,
  byCrop: (crop_id: string) => ['pest_disease', 'crop', crop_id] as const,
  byLivestock: (livestock_id: string) => ['pest_disease', 'livestock', livestock_id] as const,
} as const;

// ============================================================================
// PEST AND DISEASE RECORDS
// ============================================================================

/**
 * Fetch pest and disease records with optional filtering
 */
export function usePestDiseaseRecords(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: PEST_DISEASE_QUERY_KEYS.list(filters),
    queryFn: async (): Promise<PestDiseaseRecord[]> => {
      let endpoint = 'pest_disease_records?select=*';

      // Add filters if provided
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            params.append(key, stringValue);
          }
        });
        if (params.toString()) {
          endpoint += `&${params.toString()}`;
        }
      }

      endpoint += '&order=detection_date.desc';

      const response = await apiClient.get<PestDiseaseRecord[]>(endpoint);
      return response || [];
    },
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Fetch pest and disease records for a specific field
 */
export function usePestDiseaseByField(field_id: string) {
  return useQuery({
    queryKey: PEST_DISEASE_QUERY_KEYS.byField(field_id),
    queryFn: async (): Promise<PestDiseaseRecord[]> => {
      if (!field_id) return [];

      const response = await apiClient.get<PestDiseaseRecord[]>(
        `pest_disease_records?field_id=eq.${field_id}&order=detection_date.desc`
      );
      return response || [];
    },
    enabled: !!field_id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Fetch pest and disease records for a specific crop
 */
export function usePestDiseaseByCrop(crop_id: string) {
  return useQuery({
    queryKey: PEST_DISEASE_QUERY_KEYS.byCrop(crop_id),
    queryFn: async (): Promise<PestDiseaseRecord[]> => {
      if (!crop_id) return [];

      const response = await apiClient.get<PestDiseaseRecord[]>(
        `pest_disease_records?crop_id=eq.${crop_id}&order=detection_date.desc`
      );
      return response || [];
    },
    enabled: !!crop_id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Fetch pest and disease records for specific livestock
 */
export function usePestDiseaseByLivestock(livestock_id: string) {
  return useQuery({
    queryKey: PEST_DISEASE_QUERY_KEYS.byLivestock(livestock_id),
    queryFn: async (): Promise<PestDiseaseRecord[]> => {
      if (!livestock_id) return [];

      const response = await apiClient.get<PestDiseaseRecord[]>(
        `pest_disease_records?livestock_id=eq.${livestock_id}&order=detection_date.desc`
      );
      return response || [];
    },
    enabled: !!livestock_id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Fetch a single pest and disease record by ID
 */
export function usePestDiseaseRecord(id: string) {
  return useQuery({
    queryKey: PEST_DISEASE_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<PestDiseaseRecord | null> => {
      if (!id) return null;

      return await apiClient.get<PestDiseaseRecord>(`pest_disease_records?id=eq.${id}&select=*`, {
        single: true,
      });
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Create a new pest and disease record
 */
export function useCreatePestDiseaseRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<PestDiseaseRecord>): Promise<PestDiseaseRecord> => {
      return await apiClient.post<PestDiseaseRecord>('pest_disease_records', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PEST_DISEASE_QUERY_KEYS.all });

      // Invalidate specific queries based on relationships
      if (variables.field_id) {
        queryClient.invalidateQueries({
          queryKey: PEST_DISEASE_QUERY_KEYS.byField(variables.field_id),
        });
      }
      if (variables.crop_id) {
        queryClient.invalidateQueries({
          queryKey: PEST_DISEASE_QUERY_KEYS.byCrop(variables.crop_id),
        });
      }
      if (variables.livestock_id) {
        queryClient.invalidateQueries({
          queryKey: PEST_DISEASE_QUERY_KEYS.byLivestock(variables.livestock_id),
        });
      }
    },
  });
}

/**
 * Update an existing pest and disease record
 */
export function useUpdatePestDiseaseRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequest<PestDiseaseRecord>;
    }): Promise<PestDiseaseRecord> => {
      return await apiClient.put<PestDiseaseRecord>(`pest_disease_records?id=eq.${id}`, data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PEST_DISEASE_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: PEST_DISEASE_QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a pest and disease record
 */
export function useDeletePestDiseaseRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`pest_disease_records?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEST_DISEASE_QUERY_KEYS.all });
    },
  });
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Export aliases for backward compatibility
export const usePestDisease = usePestDiseaseRecords;
export const useCreatePestDisease = useCreatePestDiseaseRecord;
export const useDeletePestDisease = useDeletePestDiseaseRecord;
