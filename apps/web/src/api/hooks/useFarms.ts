import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../../lib/supabase';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Farm } from '../types';

export function useFarms(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.farms.list(filters),
    queryFn: async () => {
      return await supabaseApi.get<Farm>('farms', { eq: filters });
    },
    staleTime: CACHE_CONFIG.staleTime.farms,
  });
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.farms.detail(id),
    queryFn: async () => {
      return await supabaseApi.getById<Farm>('farms', id);
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.farms,
  });
}

export function useFarmWithSelection() {
  const { data: farms = [], isLoading, error } = useFarms();

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
    mutationFn: async (data: Omit<Farm, 'id' | 'created_at' | 'updated_at'>) => {
      return await supabaseApi.create<Farm>('farms', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Farm> }) => {
      return await supabaseApi.update<Farm>('farms', id, data);
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
      await supabaseApi.delete('farms', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.farms.all });
    },
  });
}
