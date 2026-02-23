import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { InventoryItem, CreateRequest, UpdateRequest } from '../types';

const INVENTORY_ENDPOINT = 'inventory';

export function useInventory(farm_id?: string) {
  return useQuery({
    queryKey: farm_id ? QUERY_KEYS.inventory.byFarm(farm_id) : QUERY_KEYS.inventory.all,
    queryFn: async () => {
      const endpoint = farm_id ? `${INVENTORY_ENDPOINT}?farm_id=eq.${farm_id}` : INVENTORY_ENDPOINT;
      return await apiClient.get<InventoryItem[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.detail(id),
    queryFn: async () => {
      return await apiClient.get<InventoryItem>(`${INVENTORY_ENDPOINT}?id=eq.${id}`, {
        single: true,
      });
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryLowStock(farm_id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.lowStock(),
    queryFn: async () => {
      const endpoint = farm_id
        ? `${INVENTORY_ENDPOINT}?farm_id=eq.${farm_id}&low_stock=eq.true`
        : `${INVENTORY_ENDPOINT}?low_stock=eq.true`;
      return await apiClient.get<InventoryItem[]>(endpoint);
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRequest<InventoryItem>) => {
      return await apiClient.post<InventoryItem>(INVENTORY_ENDPOINT, data as any, { single: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRequest<InventoryItem> }) => {
      return await apiClient.put<InventoryItem>(
        `${INVENTORY_ENDPOINT}?id=eq.${id}`,
        { ...data },
        { single: true }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.detail(variables.id) });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${INVENTORY_ENDPOINT}?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}
