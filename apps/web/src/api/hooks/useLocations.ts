import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import type { Location, CreateRequest, UpdateRequest } from '../types';

export function useLocations(farmId?: string | number) {
  return useQuery({
    queryKey: ['locations', farmId],
    queryFn: async () => {
      const params = farmId ? `?farm_id=eq.${farmId}` : '';
      return await apiClient.get<Location[]>(`locations${params}`);
    },
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: async () => {
      return await apiClient.get<Location>(`locations?id=eq.${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<Location>) => {
      return await apiClient.post<Location>('locations', data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<Location> }) => {
      return await apiClient.put<Location>(`locations?id=eq.${id}`, data as any);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['locations', variables.id] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`locations?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
