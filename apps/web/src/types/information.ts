/**
 * INFORMATION SYSTEM TYPES
 * =====================
 * TypeScript definitions for the contextual information system
 */

// ============================================================================
// BASE ENTITIES
// ============================================================================

export interface InfoCategory {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface InfoTopic {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  content: string; // Rich text content (Markdown/HTML)
  summary: string; // Brief summary for quick view
  tags: string[]; // Array of tags for search
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  reading_time_minutes: number;
  image_url?: string;
  video_url?: string;
  external_links: Array<{ title: string; url: string }>;
  related_topics: string[]; // Array of related topic IDs
  view_count: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
  // Joined fields
  category?: InfoCategory;
}

export interface InfoTopicContext {
  id: string;
  topic_id: string;
  page_path: string; // e.g., '/livestock', '/crops'
  component_name?: string; // e.g., 'LivestockList', 'CropOverview'
  context_key: string; // e.g., 'goat_breeds', 'vaccines'
  context_label: string; // User-friendly label for the info button
  trigger_type: 'icon' | 'link' | 'auto';
  position: Position; // Position relative to element
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  // Joined fields
  topic?: InfoTopic;
}

export interface InfoTopicView {
  id: string;
  topic_id: string;
  user_id?: string;
  page_path?: string;
  context_key?: string;
  viewed_at: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
}

export interface InfoTopicFeedback {
  id: string;
  topic_id: string;
  user_id?: string;
  rating?: number; // 1-5 stars
  helpful?: boolean;
  comment?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface Position {
  x: 'left' | 'right' | 'center';
  y: 'top' | 'bottom' | 'center';
}

export interface InfoIconProps {
  contextKey: string; // Unique identifier for context
  pagePath: string; // Current page path
  componentName?: string; // Current component
  position?: Position; // Icon position relative to element
  size?: 'sm' | 'md' | 'lg'; // Icon size
  className?: string; // Additional CSS classes
  tooltip?: string; // Custom tooltip text
}

export interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: InfoTopic | null;
  relatedTopics: InfoTopic[];
  onTopicChange: (topic: InfoTopic) => void;
  onRateTopic?: (topicId: string, rating: number, comment?: string) => void;
}

export interface SearchFilters {
  category?: string;
  difficulty?: string;
  tags?: string[];
  featured?: boolean;
}

export interface InfoSearchResult {
  topic: InfoTopic;
  relevance_score: number;
  matched_content: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GetTopicByContextParams {
  contextKey: string;
  pagePath: string;
  componentName?: string;
}

export interface SearchTopicsParams {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface RecordViewParams {
  topicId: string;
  contextKey?: string;
  pagePath?: string;
  sessionId?: string;
}

export interface SubmitFeedbackParams {
  topicId: string;
  rating?: number;
  helpful?: boolean;
  comment?: string;
}

export interface InformationResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseInformationReturn {
  // Topic queries
  getTopicByContext: (params: GetTopicByContextParams) => Promise<InfoTopic | null>;
  searchTopics: (params: SearchTopicsParams) => Promise<InfoSearchResult[]>;
  getTopicById: (topicId: string) => Promise<InfoTopic | null>;
  getFeaturedTopics: (limit?: number) => Promise<InfoTopic[]>;
  getTopicsByCategory: (categoryId: string) => Promise<InfoTopic[]>;

  // Actions
  recordView: (params: RecordViewParams) => Promise<void>;
  submitFeedback: (params: SubmitFeedbackParams) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;

  // Analytics
  popularTopics: InfoTopic[];
  recentlyViewed: InfoTopic[];
}

// ============================================================================
// COMPONENT STATE TYPES
// ============================================================================

export interface InfoModalState {
  isOpen: boolean;
  topic: InfoTopic | null;
  relatedTopics: InfoTopic[];
  isLoading: boolean;
  error: string | null;
}

export interface InfoIconState {
  isAvailable: boolean;
  isLoading: boolean;
  hasViewed: boolean;
  tooltip: string;
}

// ============================================================================
// CONTENT FORMATS
// ============================================================================

export interface ContentSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'image' | 'video' | 'table' | 'callout';
  content: string | unknown;
  attributes?: Record<string, unknown>;
}

export interface TableOfContents {
  id: string;
  title: string;
  level: number; // 1-6 for h1-h6
  anchor: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface InfoAnalytics {
  totalViews: number;
  uniqueViewers: number;
  averageRating: number;
  feedbackCount: number;
  topTopics: Array<{
    topic: InfoTopic;
    views: number;
    rating: number;
  }>;
  categoryBreakdown: Array<{
    category: InfoCategory;
    views: number;
    topics: number;
  }>;
}

export interface UserEngagementMetrics {
  topicsViewed: number;
  timeSpent: number; // in minutes
  feedbackSubmitted: number;
  searchQueries: number;
  favoriteTopics: string[];
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface InformationConfig {
  enableAnalytics: boolean;
  enableFeedback: boolean;
  enableOfflineCache: boolean;
  cacheExpiry: number; // in hours
  maxCacheSize: number; // in MB
  defaultModalSize: 'sm' | 'md' | 'lg' | 'xl';
  enableRelatedTopics: boolean;
  enableSearchSuggestions: boolean;
  maxSearchResults: number;
}

export interface CacheEntry {
  topicId: string;
  topic: InfoTopic;
  cachedAt: string;
  expiresAt: string;
  accessCount: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface InformationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type InformationErrorCode =
  | 'TOPIC_NOT_FOUND'
  | 'CONTEXT_NOT_FOUND'
  | 'SEARCH_FAILED'
  | 'FEEDBACK_FAILED'
  | 'NETWORK_ERROR'
  | 'CACHE_ERROR'
  | 'PERMISSION_DENIED';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type InfoTopicStatus = 'loading' | 'available' | 'unavailable' | 'error';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type RatingStars = 1 | 2 | 3 | 4 | 5;

export interface ContextualHelp {
  key: string;
  title: string;
  content: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  relatedTopics: string[];
}
