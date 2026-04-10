import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../../lib/supabase';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { InventoryItem } from '../types';

export function useInventory(farm_id?: string) {
  return useQuery({
    queryKey: farm_id ? QUERY_KEYS.inventory.byFarm(farm_id) : QUERY_KEYS.inventory.all,
    queryFn: async () => {
      return await supabaseApi.get<InventoryItem>('inventory_items', { eq: farm_id ? { farm_id } : undefined });
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.detail(id),
    queryFn: async () => {
      return await supabaseApi.getById<InventoryItem>('inventory_items', id);
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

// TODO: Implement low stock filtering using Supabase query
export function useInventoryLowStock(farm_id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.lowStock(),
    queryFn: async () => {
      const items = await supabaseApi.get<InventoryItem>('inventory_items', { eq: farm_id ? { farm_id } : undefined });
      // Filter client-side for now
      return items.filter(item => item.min_quantity !== undefined && item.quantity <= item.min_quantity);
    },
    staleTime: CACHE_CONFIG.staleTime.inventory,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      return await supabaseApi.create<InventoryItem>('inventory_items', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) => {
      return await supabaseApi.update<InventoryItem>('inventory_items', id, data);
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
      await supabaseApi.delete('inventory_items', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
    },
  });
}
