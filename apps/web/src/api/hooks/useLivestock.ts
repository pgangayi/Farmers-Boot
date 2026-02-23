/**
 * LIVESTOCK HOOKS
 * ==============
 * TanStack Query hooks for livestock operations
 *
 * This module provides React Query hooks for managing livestock data,
 * including CRUD operations, health records, breeding, and production.
 * All database field names follow snake_case convention.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { CACHE_CONFIG } from '../constants';
import type {
  Livestock,
  AnimalHealth,
  ProductionRecord,
  BreedingRecord,
  CreateRequest,
  UpdateRequest,
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const LIVESTOCK_QUERY_KEYS = {
  all: ['livestock'] as const,
  list: (farm_id?: string, page?: number, limit?: number) =>
    ['livestock', 'list', farm_id, page, limit] as const,
  detail: (id: string) => ['livestock', 'detail', id] as const,
  health: (animal_id: string) => ['livestock', 'health', animal_id] as const,
  production: (animal_id: string) => ['livestock', 'production', animal_id] as const,
  breeding: (animal_id: string) => ['livestock', 'breeding', animal_id] as const,
  breeds: (species?: string) => ['livestock', 'breeds', species] as const,
  stats: (farm_id?: string) => ['livestock', 'stats', farm_id] as const,
} as const;

// ============================================================================
// LIVESTOCK CRUD OPERATIONS
// ============================================================================

/**
 * Fetch all livestock for a farm
 */
export function useLivestock(farm_id?: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.list(farm_id, page, limit),
    queryFn: async (): Promise<Livestock[]> => {
      // Optimized query with specific columns and pagination
      const selectFields =
        'id,type,tag_number,name,gender,birth_date,weight_kg,status,purchase_date,farm_id,created_at,profiles(full_name)';
      const endpoint = farm_id
        ? `livestock?farm_id=eq.${farm_id}&select=${selectFields}&order=created_at.desc&limit=${limit}&offset=${offset}`
        : `livestock?select=${selectFields}&order=created_at.desc&limit=${limit}&offset=${offset}`;

      const response = await apiClient.get<Livestock[]>(endpoint);
      return response || [];
    },
    staleTime: CACHE_CONFIG.staleTime.animals,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

/**
 * Fetch a single livestock animal by ID
 */
export function useLivestockAnimal(id: string) {
  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.detail(id),
    queryFn: async (): Promise<Livestock | null> => {
      if (!id) return null;

      return await apiClient.get<Livestock>(`livestock?id=eq.${id}&select=*,profiles(full_name)`, {
        single: true,
      });
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

/**
 * Create a new livestock animal
 */
export function useCreateLivestock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<Livestock>): Promise<Livestock> => {
      return await apiClient.post<Livestock>('livestock', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: LIVESTOCK_QUERY_KEYS.all });
      if (variables.farm_id) {
        queryClient.invalidateQueries({
          queryKey: LIVESTOCK_QUERY_KEYS.list(variables.farm_id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: LIVESTOCK_QUERY_KEYS.stats(variables.farm_id),
      });
    },
  });
}

/**
 * Update an existing livestock animal
 */
export function useUpdateLivestock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequest<Livestock>;
    }): Promise<Livestock> => {
      return await apiClient.put<Livestock>(`livestock?id=eq.${id}`, data, { single: true });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: LIVESTOCK_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: LIVESTOCK_QUERY_KEYS.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: LIVESTOCK_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Delete a livestock animal
 */
export function useDeleteLivestock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`livestock?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIVESTOCK_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LIVESTOCK_QUERY_KEYS.stats() });
    },
  });
}

// ============================================================================
// BREED MANAGEMENT
// ============================================================================

/**
 * Fetch all breeds, optionally filtered by species
 */
export function useBreeds(species?: string) {
  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.breeds(species),
    queryFn: async (): Promise<any[]> => {
      let endpoint = 'lookup_breeds?select=*';
      if (species) {
        endpoint += `&species=eq.${species}`;
      }

      const response = await apiClient.get<any[]>(endpoint);
      return response || [];
    },
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

/**
 * Add a new breed to the lookup table
 */
export function useCreateBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      species: string;
      characteristics?: string;
    }): Promise<any> => {
      return await apiClient.post<any>('lookup_breeds', data, {
        single: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['livestock', 'breeds'] });
    },
  });
}

// ============================================================================
// HEALTH RECORDS
// ============================================================================

/**
 * Fetch health records for an animal
 */
export function useAnimalHealthRecords(animal_id: string) {
  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.health(animal_id),
    queryFn: async (): Promise<AnimalHealth[]> => {
      if (!animal_id) return [];

      const response = await apiClient.get<AnimalHealth[]>(
        `livestock_health?livestock_id=eq.${animal_id}&order=check_date.desc`
      );
      return response || [];
    },
    enabled: !!animal_id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

/**
 * Create a new health record
 */
export function useCreateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<AnimalHealth>): Promise<AnimalHealth> => {
      return await apiClient.post<AnimalHealth>('livestock_health', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      if ((variables as any).livestock_id) {
        queryClient.invalidateQueries({
          queryKey: LIVESTOCK_QUERY_KEYS.health((variables as any).livestock_id),
        });
      }
    },
  });
}

/**
 * Update a health record
 */
export function useUpdateHealthRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRequest<AnimalHealth>;
    }): Promise<AnimalHealth> => {
      return await apiClient.put<AnimalHealth>(`livestock_health?id=eq.${id}`, data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      // Need to get the livestock_id from the updated record
      queryClient.invalidateQueries({ queryKey: ['livestock', 'health'] });
    },
  });
}

// ============================================================================
// PRODUCTION RECORDS
// ============================================================================

/**
 * Fetch production records for an animal
 */
export function useAnimalProductionRecords(animal_id: string) {
  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.production(animal_id),
    queryFn: async (): Promise<ProductionRecord[]> => {
      if (!animal_id) return [];

      const response = await apiClient.get<ProductionRecord[]>(
        `livestock_production?livestock_id=eq.${animal_id}&order=production_date.desc`
      );
      return response || [];
    },
    enabled: !!animal_id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

/**
 * Create a new production record
 */
export function useCreateProductionRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<ProductionRecord>): Promise<ProductionRecord> => {
      return await apiClient.post<ProductionRecord>('livestock_production', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      if ((variables as any).livestock_id || (variables as any).animal_id) {
        queryClient.invalidateQueries({
          queryKey: LIVESTOCK_QUERY_KEYS.production(
            (variables as any).livestock_id || (variables as any).animal_id
          ),
        });
      }
    },
  });
}

// ============================================================================
// BREEDING RECORDS
// ============================================================================

/**
 * Fetch breeding records for an animal
 */
export function useAnimalBreedingRecords(animal_id: string) {
  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.breeding(animal_id),
    queryFn: async (): Promise<BreedingRecord[]> => {
      if (!animal_id) return [];

      const response = await apiClient.get<BreedingRecord[]>(
        `livestock_breeding?livestock_id=eq.${animal_id}&order=breeding_date.desc`
      );
      return response || [];
    },
    enabled: !!animal_id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

/**
 * Create a new breeding record
 */
export function useCreateBreedingRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRequest<BreedingRecord>): Promise<BreedingRecord> => {
      return await apiClient.post<BreedingRecord>('livestock_breeding', data, {
        single: true,
      });
    },
    onSuccess: (_, variables) => {
      if ((variables as any).livestock_id || (variables as any).animal_id) {
        queryClient.invalidateQueries({
          queryKey: LIVESTOCK_QUERY_KEYS.breeding(
            (variables as any).livestock_id || (variables as any).animal_id
          ),
        });
      }
    },
  });
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

/**
 * Fetch livestock statistics for a farm
 */
export function useLivestockStats(farm_id?: string) {
  return useQuery({
    queryKey: LIVESTOCK_QUERY_KEYS.stats(farm_id),
    queryFn: async (): Promise<{
      total: number;
      by_species: Record<string, number>;
      by_status: Record<string, number>;
      average_age: number;
    }> => {
      if (!farm_id) {
        return {
          total: 0,
          by_species: {},
          by_status: {},
          average_age: 0,
        };
      }

      // This would ideally be a database function or RPC call
      const livestock = await apiClient.get<Livestock[]>(`livestock?farm_id=eq.${farm_id}`);

      return {
        total: livestock.length,
        by_species: livestock.reduce(
          (acc, animal) => {
            acc[animal.species] = (acc[animal.species] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        by_status: livestock.reduce(
          (acc, animal) => {
            acc[animal.status || 'unknown'] = (acc[animal.status || 'unknown'] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        average_age: 0, // Would need birth_date calculation
      };
    },
    enabled: !!farm_id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Export aliases for backward compatibility
export const useAnimals = useLivestock;
export const useAnimal = useLivestockAnimal;
export const useCreateAnimal = useCreateLivestock;
export const useUpdateAnimal = useUpdateLivestock;
export const useDeleteAnimal = useDeleteLivestock;
export const useAddBreed = useCreateBreed;
