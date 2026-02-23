/**
 * Information Hooks
 * =================
 * React Query hooks for information/educational content management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import { apiClient } from '../../lib';
import { ENDPOINTS } from '../config';
import type {
  InfoTopic,
  InfoCategory,
  InfoTopicContext,
  InfoTopicFeedback,
  GetTopicByContextParams,
  SearchTopicsParams,
  RecordViewParams,
  SubmitFeedbackParams,
  InfoSearchResult,
} from '../../types/information';

/**
 * Fetch all information categories
 */
export function useInfoCategories() {
  return useQuery({
    queryKey: ['information', 'categories'],
    queryFn: async () => {
      return await apiClient.get<InfoCategory[]>('/information/categories');
    },
  });
}

/**
 * Fetch a single category by ID
 */
export function useInfoCategory(id: string | undefined) {
  return useQuery({
    queryKey: ['information', 'category', id],
    queryFn: async () => {
      if (!id) return null;
      return await apiClient.get<InfoCategory>(`/information/categories/${id}`);
    },
    enabled: !!id,
  });
}

/**
 * Fetch all topics (with optional category filter)
 */
export function useInfoTopics(categoryId?: string) {
  return useQuery({
    queryKey: ['information', 'topics', categoryId],
    queryFn: async () => {
      const url = categoryId
        ? `/information/topics?category_id=${categoryId}`
        : '/information/topics';
      return await apiClient.get<InfoTopic[]>(url);
    },
  });
}

/**
 * Fetch a single topic by ID
 */
export function useInfoTopic(id: string | undefined) {
  return useQuery({
    queryKey: ['information', 'topic', id],
    queryFn: async () => {
      if (!id) return null;
      return await apiClient.get<InfoTopic>(`/information/topics/${id}`);
    },
    enabled: !!id,
  });
}

/**
 * Fetch topic by context (page path, component, context key)
 */
export function useInfoTopicByContext(params: GetTopicByContextParams | undefined) {
  return useQuery({
    queryKey: ['information', 'context', params],
    queryFn: async () => {
      if (!params) return null;
      const queryString = new URLSearchParams({
        context_key: params.contextKey,
        page_path: params.pagePath,
        ...(params.componentName && { component_name: params.componentName }),
      }).toString();
      return await apiClient.get<InfoTopic>(`/information/topics/by-context?${queryString}`);
    },
    enabled: !!params,
  });
}

/**
 * Search information topics
 */
export function useInfoSearch(params: SearchTopicsParams | undefined) {
  return useQuery({
    queryKey: ['information', 'search', params],
    queryFn: async () => {
      if (!params?.query) return [];
      const searchParams = new URLSearchParams({
        query: params.query,
        ...(params.filters?.category && { category: params.filters.category }),
        ...(params.filters?.difficulty && { difficulty: params.filters.difficulty }),
        ...(params.filters?.featured !== undefined && {
          featured: String(params.filters.featured),
        }),
        ...(params.limit && { limit: String(params.limit) }),
        ...(params.offset && { offset: String(params.offset) }),
      }).toString();
      return await apiClient.get<InfoSearchResult[]>(`/information/topics/search?${searchParams}`);
    },
    enabled: !!params?.query,
  });
}

/**
 * Fetch featured topics
 */
export function useFeaturedTopics(limit: number = 5) {
  return useQuery({
    queryKey: ['information', 'featured', limit],
    queryFn: async () => {
      return await apiClient.get<InfoTopic[]>(`/information/topics/featured?limit=${limit}`);
    },
  });
}

/**
 * Fetch popular topics
 */
export function usePopularTopics(limit: number = 10) {
  return useQuery({
    queryKey: ['information', 'popular', limit],
    queryFn: async () => {
      return await apiClient.get<InfoTopic[]>(`/information/topics/popular?limit=${limit}`);
    },
  });
}

/**
 * Fetch related topics for a given topic
 */
export function useRelatedTopics(topicId: string | undefined) {
  return useQuery({
    queryKey: ['information', 'related', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      return await apiClient.get<InfoTopic[]>(`/information/topics/${topicId}/related`);
    },
    enabled: !!topicId,
  });
}

/**
 * Record a topic view
 */
export function useRecordTopicView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RecordViewParams) => {
      return await apiClient.post('/information/views', {
        topic_id: params.topicId,
        context_key: params.contextKey,
        page_path: params.pagePath,
        session_id: params.sessionId,
      });
    },
    onSuccess: () => {
      // Invalidate popular topics to refresh view counts
      queryClient.invalidateQueries({ queryKey: ['information', 'popular'] });
    },
  });
}

/**
 * Submit feedback for a topic
 */
export function useSubmitTopicFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitFeedbackParams) => {
      return await apiClient.post<InfoTopicFeedback>('/information/feedback', {
        topic_id: params.topicId,
        rating: params.rating,
        helpful: params.helpful,
        comment: params.comment,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate the topic to refresh rating data
      queryClient.invalidateQueries({ queryKey: ['information', 'topic', variables.topicId] });
    },
  });
}

/**
 * Create a new topic (admin only)
 */
export function useCreateInfoTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<InfoTopic>) => {
      return await apiClient.post<InfoTopic>('/information/topics', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information', 'topics'] });
    },
  });
}

/**
 * Update a topic (admin only)
 */
export function useUpdateInfoTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InfoTopic> }) => {
      return await apiClient.put<InfoTopic>(`/information/topics/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['information', 'topic', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['information', 'topics'] });
    },
  });
}

/**
 * Delete a topic (admin only)
 */
export function useDeleteInfoTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.delete(`/information/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information', 'topics'] });
    },
  });
}
