/**
 * CROP ROTATIONS HOOKS
 * =====================
 * TanStack Query hooks for crop rotation management
 *
 * This module provides React Query hooks for managing crop rotation plans
 * and their detailed implementation schedules.
 * All database field names follow snake_case convention.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { CACHE_CONFIG } from '../constants';
import type { CreateRequest, UpdateRequest } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface CropRotation {
  id: string;
  field_id: string;
  rotation_name: string;
  description?: string;
  start_year: number;
  duration_years: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface CropRotationDetail {
  id: string;
  rotation_id: string;
  sequence_order: number;
  crop_id: string;
  planting_date?: string;
  harvest_date?: string;
  area_hectares?: number;
  notes?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ROTATION_QUERY_KEYS = {
  all: ['rotations'] as const,
  list: (field_id?: string) => ['rotations', 'list', field_id] as const,
  detail: (id: string) => ['rotations', 'detail', id] as const,
  details: (rotation_id: string) => ['rotations', 'details', rotation_id] as const,
} as const;

// ============================================================================
// CROP ROTATIONS
// ============================================================================

/**
 * Fetch crop rotations for a field or all rotations
 */
export function useCropRotations(field_id?: string) {
  return useQuery({
    queryKey: ROTATION_QUERY_KEYS.list(field_id),
    queryFn: async (): Promise<CropRotation[]> => {
      let endpoint = 'crop_rotations?select=*';
      if (field_id) {
        endpoint += `&field_id=eq.${field_id}`;
      }
      endpoint += '&order=created_at.desc';

      const response = await apiClient.get<CropRotation[]>(endpoint);
      return response || [];
    },
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Fetch a single crop rotation by ID
 */
export function useCropRotation(id: string) {
  return useQuery({
    queryKey: ROTATION_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<CropRotation | null> => {
      if (!id) return null;

      return await apiClient.get<CropRotation>(`crop_rotations?id=eq.${id}&select=*`, {
        single: true,
      });
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Create a new crop rotation
 */
export function useCreateCropRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<CropRotation>): Promise<CropRotation> => {
      return await apiClient.post<CropRotation>('crop_rotations', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ROTATION_QUERY_KEYS.all });
      if (variables.field_id) {
        queryClient.invalidateQueries({
          queryKey: ROTATION_QUERY_KEYS.list(variables.field_id),
        });
      }
    },
  });
}

/**
 * Update an existing crop rotation
 */
export function useUpdateCropRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequest<CropRotation>;
    }): Promise<CropRotation> => {
      return await apiClient.put<CropRotation>(`crop_rotations?id=eq.${id}`, data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ROTATION_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: ROTATION_QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a crop rotation
 */
export function useDeleteCropRotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`crop_rotations?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROTATION_QUERY_KEYS.all });
    },
  });
}

// ============================================================================
// CROP ROTATION DETAILS
// ============================================================================

/**
 * Fetch crop rotation details for a rotation
 */
export function useCropRotationDetails(rotation_id: string) {
  return useQuery({
    queryKey: ROTATION_QUERY_KEYS.details(rotation_id),
    queryFn: async (): Promise<CropRotationDetail[]> => {
      if (!rotation_id) return [];

      const response = await apiClient.get<CropRotationDetail[]>(
        `crop_rotation_details?rotation_id=eq.${rotation_id}&select=*,crops(name,variety)&order=sequence_order.asc`
      );
      return response || [];
    },
    enabled: !!rotation_id,
    staleTime: CACHE_CONFIG.staleTime.default,
  });
}

/**
 * Create a new crop rotation detail
 */
export function useCreateCropRotationDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<CropRotationDetail>): Promise<CropRotationDetail> => {
      return await apiClient.post<CropRotationDetail>('crop_rotation_details', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ROTATION_QUERY_KEYS.all });
      if (variables.rotation_id) {
        queryClient.invalidateQueries({
          queryKey: ROTATION_QUERY_KEYS.details(variables.rotation_id),
        });
      }
    },
  });
}

/**
 * Update an existing crop rotation detail
 */
export function useUpdateCropRotationDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequest<CropRotationDetail>;
    }): Promise<CropRotationDetail> => {
      return await apiClient.put<CropRotationDetail>(`crop_rotation_details?id=eq.${id}`, data, {
        single: true,
      });
    },
    onSuccess: (_, _variables) => {
      queryClient.invalidateQueries({ queryKey: ROTATION_QUERY_KEYS.all });
      // Need to get rotation_id from the updated record to invalidate specific cache
      queryClient.invalidateQueries({ queryKey: ['rotations', 'details'] });
    },
  });
}

/**
 * Delete a crop rotation detail
 */
export function useDeleteCropRotationDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`crop_rotation_details?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROTATION_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['rotations', 'details'] });
    },
  });
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Export aliases for backward compatibility
export const useRotations = useCropRotations;
export const useCreateRotation = useCreateCropRotation;
export const useDeleteRotation = useDeleteCropRotation;
