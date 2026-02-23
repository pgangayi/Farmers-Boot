/**
 * API CONSTANTS
 * =============
 * Shared constants for the API layer
 */

export const QUERY_KEYS = {
  farms: {
    all: ['farms'] as const,
    list: (filters?: Record<string, any>) => ['farms', 'list', filters] as const,
    detail: (id: string) => ['farms', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (filters?: Record<string, any>) => ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  crops: {
    all: ['crops'] as const,
    list: (filters?: Record<string, any>) => ['crops', 'list', filters] as const,
    detail: (id: string) => ['crops', 'detail', id] as const,
    byFarm: (farmId: string) => ['crops', 'farm', farmId] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    list: (filters?: Record<string, any>) => ['inventory', 'list', filters] as const,
    detail: (id: string) => ['inventory', 'detail', id] as const,
    byFarm: (farmId: string) => ['inventory', 'farm', farmId] as const,
    lowStock: (farmId?: string) => ['inventory', 'low-stock', farmId] as const,
  },
  animals: {
    all: ['animals'] as const,
    list: (filters?: Record<string, any>) => ['animals', 'list', filters] as const,
    detail: (id: string) => ['animals', 'detail', id] as const,
    byFarm: (farmId: string) => ['animals', 'farm', farmId] as const,
  },
  finance: {
    all: ['finance'] as const,
    summary: (filters?: Record<string, any>) => ['finance', 'summary', filters] as const,
    list: (filters?: Record<string, any>) => ['finance', 'list', filters] as const,
    detail: (id: string) => ['finance', 'detail', id] as const,
  },
};

export const CACHE_CONFIG = {
  staleTime: {
    farms: 5 * 60 * 1000,
    tasks: 1 * 60 * 1000,
    crops: 10 * 60 * 1000,
    inventory: 5 * 60 * 1000,
    animals: 5 * 60 * 1000,
    finance: 5 * 60 * 1000,
    default: 5 * 60 * 1000,
  },
  gcTime: {
    default: 30 * 60 * 1000,
  },
};

export const API_ENDPOINTS = {
  tasks: {
    list: 'tasks',
    create: 'tasks',
    detail: (id: string) => `tasks?id=eq.${id}`,
    update: (id: string) => `tasks?id=eq.${id}`,
    delete: (id: string) => `tasks?id=eq.${id}`,
  },
};
