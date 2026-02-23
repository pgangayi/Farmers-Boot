import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Farm } from '../types';
import type { CreateRequest, UpdateRequest } from '../types';

export function useFarms(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.farms.list(filters),
    queryFn: async () => {
      return await apiClient.get<Farm[]>('farms');
    },
    staleTime: CACHE_CONFIG.staleTime.farms,
  });
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.farms.detail(id),
    queryFn: async () => {
      return await apiClient.get<Farm>(`farms?id=eq.${id}`, { single: true });
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.farms,
  });
}

export function useFarmWithSelection() {
  const { data: farms = [], isLoading, error } = useFarms();

  // Simple implementation - returns first farm as selected
  // Pages can override this with their own selection logic
  const currentFarm = farms.length > 0 ? farms[0] : null;

  return {
    farms,
    currentFarm,
    isLoading,
    error,
  };
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<Farm>) => {
      return await apiClient.post<Farm>('farms', data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Farm> }) => {
      return await apiClient.put<Farm>(`farms?id=eq.${id}`, data as any, { single: true });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.detail(variables.id) });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`farms?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
    },
  });
}
