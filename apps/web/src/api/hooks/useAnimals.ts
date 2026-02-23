import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Livestock as Animal, CreateRequest, UpdateRequest } from '../types';

export function useAnimals(farm_id?: string) {
  return useQuery({
    queryKey: farm_id ? QUERY_KEYS.animals.byFarm(farm_id) : QUERY_KEYS.animals.all,
    queryFn: async () => {
      const endpoint = farm_id ? `livestock?farm_id=eq.${farm_id}` : 'livestock';
      return await apiClient.get<Animal[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

export function useAnimal(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.animals.detail(id),
    queryFn: async () => {
      return await apiClient.get<Animal>(`livestock?id=eq.${id}`);
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.animals,
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<Animal>) => {
      return await apiClient.post<Animal>('livestock', data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.all });
    },
  });
}

export function useUpdateAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Animal> }) => {
      return await apiClient.put<Animal>(`livestock?id=eq.${id}`, data as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.detail(variables.id) });
    },
  });
}

export function useDeleteAnimal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`livestock?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.all });
    },
  });
}

export function useBreeds() {
  return useQuery({
    queryKey: ['breeds'],
    queryFn: async () => [],
  });
}

export function useAddBreed() {
  return useMutation({ mutationFn: async (data: any) => data });
}
