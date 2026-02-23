/**
 * ============================================================================
 * INFORMATION EDGE FUNCTION
 * ============================================================================
 * Handles all information system requests
 */

import { supabase, getUserFromAuth, getUserFarmIds } from '../_shared/supabase-client.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  errorHandler,
  createSuccessResponse,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../_shared/error-handler.ts';
import { validate } from '../_shared/validation.ts';
import { logger } from '../_shared/logger.ts';

export async function handleInformationRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace('/information', '');
  const method = req.method;
  const requestId = crypto.randomUUID();

  logger.setRequestId(requestId);
  logger.info(`Information request: ${method} ${path}`);

  try {
    if (path === '/topics' && method === 'GET') {
      return await handleGetTopics(req, url, requestId);
    } else if (path === '/topics/search' && method === 'POST') {
      return await handleSearchTopics(req, requestId);
    } else if (path.startsWith('/topics/') && method === 'GET') {
      const topicId = path.split('/')[2];
      return await handleGetTopic(topicId, req, requestId);
    } else if (path === '/topics/featured' && method === 'GET') {
      return await handleGetFeaturedTopics(req, url, requestId);
    } else if (path === '/topics/popular' && method === 'GET') {
      return await handleGetPopularTopics(req, requestId);
    } else if (path === '/contexts' && method === 'GET') {
      return await handleGetContexts(req, url, requestId);
    } else if (path === '/views' && method === 'POST') {
      return await handleRecordView(req, requestId);
    } else if (path === '/feedback' && method === 'POST') {
      return await handleSubmitFeedback(req, requestId);
    } else if (path === '/categories' && method === 'GET') {
      return await handleGetCategories(req, requestId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'Information endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return errorHandler(error, req);
  }
}

// ============================================================================
// TOPIC MANAGEMENT
// ============================================================================

async function handleGetTopics(req: Request, url: URL, requestId: string): Promise<Response> {
  logger.info('Getting topics', { requestId });

  const { data: topics, error } = await supabase
    .from('info_topics')
    .select(`
      *,
      category:info_categories(name, icon, color)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching topics', { error, requestId });
    throw new Error('Failed to fetch topics');
  }

  return createSuccessResponse(topics || [], requestId);
}

async function handleGetTopic(topicId: string, req: Request, requestId: string): Promise<Response> {
  logger.info('Getting topic', { topicId, requestId });

  const { data: topic, error } = await supabase
    .from('info_topics')
    .select(`
      *,
      category:info_categories(name, icon, color)
    `)
    .eq('id', topicId)
    .eq('is_active', true)
    .single();

  if (error || !topic) {
    logger.error('Topic not found', { topicId, error, requestId });
    throw new NotFoundError('Topic not found');
  }

  // Increment view count
  await supabase.rpc('increment_topic_views', { topic_id: topicId });

  return createSuccessResponse(topic, requestId);
}

async function handleSearchTopics(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();
  const { query, filters = {}, limit = 20, offset = 0 } = body;

  logger.info('Searching topics', { query, filters, limit, offset, requestId });

  // Validate input
  const validation = validate(body, {
    query: { type: 'string', required: true, minLength: 2 },
    limit: { type: 'number', min: 1, max: 100 },
    offset: { type: 'number', min: 0 },
  });

  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }

  // Build search query
  let dbQuery = supabase
    .from('info_topics')
    .select(`
      *,
      category:info_categories(name, icon, color)
    `)
    .eq('is_active', true);

  // Apply filters
  if (filters.category) {
    dbQuery = dbQuery.eq('category_id', filters.category);
  }

  if (filters.difficulty) {
    dbQuery = dbQuery.eq('difficulty_level', filters.difficulty);
  }

  if (filters.featured) {
    dbQuery = dbQuery.eq('is_featured', true);
  }

  // Apply text search
  if (query) {
    dbQuery = dbQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{%${query}%}`
    );
  }

  // Apply pagination and ordering
  const { data: topics, error, count } = await dbQuery
    .order('view_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Error searching topics', { error, requestId });
    throw new Error('Search failed');
  }

  const searchResults = topics?.map(topic => ({
    topic,
    relevance_score: calculateRelevanceScore(topic, query),
    matched_content: extractMatchedContent(topic, query),
  })) || [];

  return createSuccessResponse({
    results: searchResults,
    total: count || 0,
    limit,
    offset,
  }, requestId);
}

async function handleGetFeaturedTopics(req: Request, url: URL, requestId: string): Promise<Response> {
  const limit = parseInt(url.searchParams.get('limit') || '10');

  logger.info('Getting featured topics', { limit, requestId });

  const { data: topics, error } = await supabase
    .from('info_topics')
    .select(`
      *,
      category:info_categories(name, icon, color)
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching featured topics', { error, requestId });
    throw new Error('Failed to fetch featured topics');
  }

  return createSuccessResponse(topics || [], requestId);
}

async function handleGetPopularTopics(req: Request, requestId: string): Promise<Response> {
  logger.info('Getting popular topics', { requestId });

  const { data: topics, error } = await supabase
    .from('info_topics')
    .select(`
      *,
      category:info_categories(name, icon, color)
    `)
    .eq('is_active', true)
    .order('view_count', { ascending: false })
    .limit(10);

  if (error) {
    logger.error('Error fetching popular topics', { error, requestId });
    throw new Error('Failed to fetch popular topics');
  }

  return createSuccessResponse(topics || [], requestId);
}

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

async function handleGetContexts(req: Request, url: URL, requestId: string): Promise<Response> {
  const pagePath = url.searchParams.get('page_path');
  const contextKey = url.searchParams.get('context_key');
  const componentName = url.searchParams.get('component_name');

  logger.info('Getting contexts', { pagePath, contextKey, componentName, requestId });

  let dbQuery = supabase
    .from('info_topic_contexts')
    .select(`
      *,
      topic:info_topics(
        id,
        title,
        slug,
        summary,
        category:info_categories(name, icon, color)
      )
    `)
    .eq('is_active', true);

  if (pagePath) {
    dbQuery = dbQuery.eq('page_path', `eq.${pagePath}`);
  }

  if (contextKey) {
    dbQuery = dbQuery.eq('context_key', `eq.${contextKey}`);
  }

  if (componentName) {
    dbQuery = dbQuery.eq('component_name', `eq.${componentName}`);
  }

  const { data: contexts, error } = await dbQuery;

  if (error) {
    logger.error('Error fetching contexts', { error, requestId });
    throw new Error('Failed to fetch contexts');
  }

  return createSuccessResponse(contexts || [], requestId);
}

// ============================================================================
// ANALYTICS
// ============================================================================

async function handleRecordView(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();
  const { topic_id, page_path, context_key, session_id } = body;

  logger.info('Recording view', { topic_id, page_path, context_key, requestId });

  // Validate input
  const validation = validate(body, {
    topic_id: { type: 'string', required: true },
    page_path: { type: 'string' },
    context_key: { type: 'string' },
    session_id: { type: 'string' },
  });

  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }

  const { data: view, error } = await supabase
    .from('info_topic_views')
    .insert({
      topic_id,
      page_path,
      context_key,
      session_id,
      viewed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error recording view', { error, requestId });
    throw new Error('Failed to record view');
  }

  return createSuccessResponse(view, requestId);
}

async function handleSubmitFeedback(req: Request, requestId: string): Promise<Response> {
  const body = await req.json();
  const { topic_id, rating, helpful, comment } = body;

  logger.info('Submitting feedback', { topic_id, rating, helpful, requestId });

  // Validate input
  const validation = validate(body, {
    topic_id: { type: 'string', required: true },
    rating: { type: 'number', min: 1, max: 5 },
    helpful: { type: 'boolean' },
    comment: { type: 'string', maxLength: 1000 },
  });

  if (!validation.isValid) {
    throw new ValidationError(validation.errors);
  }

  const { data: feedback, error } = await supabase
    .from('info_topic_feedback')
    .insert({
      topic_id,
      rating,
      helpful,
      comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error submitting feedback', { error, requestId });
    throw new Error('Failed to submit feedback');
  }

  return createSuccessResponse(feedback, requestId);
}

// ============================================================================
// CATEGORIES
// ============================================================================

async function handleGetCategories(req: Request, requestId: string): Promise<Response> {
  logger.info('Getting categories', { requestId });

  const { data: categories, error } = await supabase
    .from('info_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    logger.error('Error fetching categories', { error, requestId });
    throw new Error('Failed to fetch categories');
  }

  return createSuccessResponse(categories || [], requestId);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateRelevanceScore(topic: any, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Title matches get highest score
  if (topic.title?.toLowerCase().includes(queryLower)) {
    score += 10;
  }

  // Description matches get medium score
  if (topic.description?.toLowerCase().includes(queryLower)) {
    score += 5;
  }

  // Tag matches get good score
  if (topic.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
    score += 7;
  }

  // Content matches get lower score
  if (topic.content?.toLowerCase().includes(queryLower)) {
    score += 3;
  }

  // Boost featured topics
  if (topic.is_featured) {
    score += 2;
  }

  // Boost popular topics
  if (topic.view_count > 100) {
    score += 1;
  }

  return score;
}

function extractMatchedContent(topic: any, query: string): string {
  const queryLower = query.toLowerCase();
  
  // Return the first matching field as a preview
  if (topic.title?.toLowerCase().includes(queryLower)) {
    return topic.title;
  }
  
  if (topic.description?.toLowerCase().includes(queryLower)) {
    return topic.description.substring(0, 150) + '...';
  }
  
  if (topic.summary?.toLowerCase().includes(queryLower)) {
    return topic.summary;
  }
  
  return topic.title || '';
}
