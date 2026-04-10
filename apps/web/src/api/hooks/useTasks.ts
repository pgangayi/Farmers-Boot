/**
 * TASK HOOKS
 * ==========
 * TanStack Query hooks for task operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../../lib/supabase';
import { QUERY_KEYS, CACHE_CONFIG } from '../constants';
import type { Task } from '../types';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch all tasks, optionally filtered
 */
export function useTasks(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.list(filters),
    queryFn: async () => {
      return await supabaseApi.get<Task>('tasks', { eq: filters });
    },
    staleTime: CACHE_CONFIG.staleTime.tasks,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tasks.detail(id),
    queryFn: async () => {
      return await supabaseApi.getById<Task>('tasks', id);
    },
    enabled: !!id,
    staleTime: CACHE_CONFIG.staleTime.tasks,
    gcTime: CACHE_CONFIG.gcTime.default,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      return await supabaseApi.create<Task>('tasks', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      return await supabaseApi.update<Task>('tasks', id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.detail(variables.id) });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await supabaseApi.delete('tasks', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useStartTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, startTime }: { taskId: string; startTime: string }) => {
      return await supabaseApi.create('tasks_time_logs', {
        task_id: taskId,
        start_time: startTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}

export function useStopTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ logId, endTime }: { logId: string; endTime: string }) => {
      return await supabaseApi.update('tasks_time_logs', logId, {
        end_time: endTime,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks.all });
    },
  });
}
