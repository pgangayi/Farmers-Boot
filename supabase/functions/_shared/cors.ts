/**
 * ============================================================================
 * CORS HEADERS
 * ============================================================================
 * Provides CORS headers for Supabase Edge Functions
 * ============================================================================
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
};

export function getCorsHeaders(origin?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
  };

  // In production, you should validate the origin against a whitelist
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  headers['Access-Control-Allow-Headers'] =
    'authorization, x-client-info, apikey, content-type, x-request-id';

  return headers;
}
