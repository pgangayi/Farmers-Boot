/**
 * INFORMATION HOOK
 * ================
 * React hook for accessing the information system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib';
import type {
  UseInformationReturn,
  InfoTopic,
  InfoTopicContext,
  InfoSearchResult,
  GetTopicByContextParams,
  SearchTopicsParams,
  RecordViewParams,
  SubmitFeedbackParams,
  InformationConfig,
  CacheEntry,
} from '../types/information';

// Default configuration
const DEFAULT_CONFIG: InformationConfig = {
  enableAnalytics: true,
  enableFeedback: true,
  enableOfflineCache: true,
  cacheExpiry: 24, // 24 hours
  maxCacheSize: 50, // 50 MB
  defaultModalSize: 'md',
  enableRelatedTopics: true,
  enableSearchSuggestions: true,
  maxSearchResults: 20,
};

// Query keys
const INFO_QUERY_KEYS = {
  topicByContext: (params: GetTopicByContextParams) =>
    ['info', 'topic-by-context', params] as const,
  topicById: (id: string) => ['info', 'topic', id] as const,
  search: (params: SearchTopicsParams) => ['info', 'search', params] as const,
  featured: (limit?: number) => ['info', 'featured', limit] as const,
  byCategory: (categoryId: string) => ['info', 'category', categoryId] as const,
  popular: () => ['info', 'popular'] as const,
  recent: () => ['info', 'recent'] as const,
} as const;

export function useInformation(config: Partial<InformationConfig> = {}) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [popularTopics, setPopularTopics] = useState<InfoTopic[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<InfoTopic[]>([]);

  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const sessionIdRef = useRef<string>(generateSessionId());

  // Generate session ID for tracking
  function generateSessionId(): string {
    const existing = sessionStorage.getItem('info_session_id');
    if (existing) return existing;

    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('info_session_id', newId);
    return newId;
  }

  // Cache management
  const getCachedTopic = useCallback((topicId: string): InfoTopic | null => {
    if (!configRef.current.enableOfflineCache) return null;

    const cached = cacheRef.current.get(topicId);
    if (!cached) return null;

    // Check if cache is expired
    if (new Date(cached.expiresAt) < new Date()) {
      cacheRef.current.delete(topicId);
      return null;
    }

    // Update access count
    cached.accessCount++;
    return cached.topic;
  }, []);

  const setCachedTopic = useCallback((topic: InfoTopic): void => {
    if (!configRef.current.enableOfflineCache) return;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + configRef.current.cacheExpiry);

    const entry: CacheEntry = {
      topicId: topic.id,
      topic,
      cachedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      accessCount: 1,
    };

    cacheRef.current.set(topic.id, entry);

    // Clean up old cache entries if needed
    cleanupCache();
  }, []);

  const cleanupCache = useCallback((): void => {
    const now = new Date();
    const cache = cacheRef.current;

    // Remove expired entries
    for (const [id, entry] of cache.entries()) {
      if (new Date(entry.expiresAt) < now) {
        cache.delete(id);
      }
    }

    // Remove least recently used if over size limit
    const entries = Array.from(cache.entries());
    if (entries.length > configRef.current.maxCacheSize) {
      entries
        .sort((a, b) => a[1].accessCount - b[1].accessCount)
        .slice(0, entries.length - configRef.current.maxCacheSize)
        .forEach(([id]) => cache.delete(id));
    }
  }, []);

  // API calls
  const getTopicByContext = useCallback(
    async (params: GetTopicByContextParams): Promise<InfoTopic | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cacheKey = `context_${params.pagePath}_${params.contextKey}`;
        const cached = getCachedTopic(cacheKey);
        if (cached) return cached;

        const response = await apiClient.get<InfoTopicContext[]>(
          `info_topic_contexts?page_path=eq.${params.pagePath}&context_key=eq.${params.contextKey}&is_active=eq.true`
        );

        if (response && response.length > 0) {
          const context = response[0] as InfoTopicContext & {
            topic?: InfoTopic;
            topic_id?: string;
          };
          let topic: InfoTopic | null | undefined = context.topic;

          // If topic is not included, fetch it separately
          if (!topic && context.topic_id) {
            const fetchedTopic = await getTopicById(context.topic_id);
            topic = fetchedTopic;
          }

          if (topic) {
            setCachedTopic(topic);
            return topic;
          }
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch topic';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [getCachedTopic, setCachedTopic]
  );

  const getTopicById = useCallback(
    async (topicId: string): Promise<InfoTopic | null> => {
      try {
        // Check cache first
        const cached = getCachedTopic(topicId);
        if (cached) return cached;

        const response = await apiClient.get<InfoTopic>(`info_topics/${topicId}`, {
          params: {
            is_active: `eq.${true}`,
          },
        });

        if (response) {
          setCachedTopic(response as any);
          return response as any;
        }

        return null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch topic';
        setError(errorMessage);
        throw err;
      }
    },
    [getCachedTopic, setCachedTopic]
  );

  const searchTopics = useCallback(
    async (params: SearchTopicsParams): Promise<InfoSearchResult[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.post<InfoSearchResult[]>('info_topics/search', {
          query: params.query,
          filters: params.filters,
          limit: params.limit || configRef.current.maxSearchResults,
          offset: 0,
        });

        return response || [];
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getFeaturedTopics = useCallback(async (limit = 10): Promise<InfoTopic[]> => {
    try {
      const response = await apiClient.get<InfoTopic[]>('info_topics', {
        params: {
          is_featured: `eq.${true}`,
          is_active: `eq.${true}`,
          limit,
          order: 'view_count.desc',
        },
      });

      return response || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch featured topics';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getTopicsByCategory = useCallback(async (categoryId: string): Promise<InfoTopic[]> => {
    try {
      const response = await apiClient.get<InfoTopic[]>('info_topics', {
        params: {
          category_id: `eq.${categoryId}`,
          is_active: `eq.${true}`,
          order: 'title.asc',
        },
      });

      return response || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch topics by category';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Analytics mutations
  const recordViewMutation = useMutation({
    mutationFn: async (params: RecordViewParams) => {
      if (!configRef.current.enableAnalytics) return;

      await apiClient.post('info_topic_views', {
        topic_id: params.topicId,
        page_path: params.pagePath,
        context_key: params.contextKey,
        session_id: sessionIdRef.current,
      });

      // Update local analytics
      setRecentlyViewed(prev => {
        return [params.topicId as any, ...prev.filter((id: any) => id !== params.topicId)].slice(
          0,
          10
        );
      });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (params: SubmitFeedbackParams) => {
      if (!configRef.current.enableFeedback) return;

      await apiClient.post('info_topic_feedback', {
        topic_id: params.topicId,
        rating: params.rating,
        helpful: params.helpful,
        comment: params.comment,
      });
    },
  });

  // Wrapper functions
  const recordView = useCallback(
    async (params: RecordViewParams): Promise<void> => {
      try {
        await recordViewMutation.mutateAsync(params);
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    },
    [recordViewMutation]
  );

  const submitFeedback = useCallback(
    async (params: SubmitFeedbackParams): Promise<void> => {
      try {
        await submitFeedbackMutation.mutateAsync(params);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      }
    },
    [submitFeedbackMutation]
  );

  // Load popular and recent topics
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        // Load popular topics
        const popularResponse = await apiClient.get<InfoTopic[]>('info_topics/popular');
        if (popularResponse) {
          setPopularTopics(popularResponse as any);
        }

        // Load recently viewed from localStorage
        const recentIds = JSON.parse(localStorage.getItem('info_recently_viewed') || '[]');
        if (recentIds.length > 0) {
          const recentTopics = await Promise.all(recentIds.map((id: string) => getTopicById(id)));
          setRecentlyViewed(recentTopics.filter(Boolean) as InfoTopic[]);
        }
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      }
    };

    loadAnalyticsData();
  }, [getTopicById]);

  // Save recently viewed to localStorage
  useEffect(() => {
    if (recentlyViewed.length > 0) {
      localStorage.setItem(
        'info_recently_viewed',
        JSON.stringify(recentlyViewed.map(topic => topic.id))
      );
    }
  }, [recentlyViewed]);

  // Global event listener for modal requests
  useEffect(() => {
    const handleModalRequest = (event: CustomEvent) => {
      const { contextKey, pagePath, componentName } = event.detail;
      getTopicByContext({ contextKey, pagePath, componentName });
    };

    window.addEventListener('openInfoModal', handleModalRequest as EventListener);
    return () => {
      window.removeEventListener('openInfoModal', handleModalRequest as EventListener);
    };
  }, [getTopicByContext]);

  return {
    // Topic queries
    getTopicByContext,
    searchTopics,
    getTopicById,
    getFeaturedTopics,
    getTopicsByCategory,

    // Actions
    recordView,
    submitFeedback,

    // State
    isLoading,
    error,
    popularTopics,
    recentlyViewed,
  };
}

// Export types for external use
export type { InformationConfig, CacheEntry, InfoSearchResult };

// Export the hook as default
export default useInformation;
