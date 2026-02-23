/**
 * ============================================================================
 * RATE LIMITING
 * ============================================================================
 * Rate limiting implementation using Supabase database
 * ============================================================================
 */

import { supabase } from './supabase-client.ts';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// Default rate limits
export const defaultRateLimits: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 auth requests per minute
  upload: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
  search: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 searches per minute
  webhook: { maxRequests: 1000, windowMs: 60 * 1000 }, // 1000 webhooks per minute
};

// Rate limit using Supabase database
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultRateLimits.default
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Clean up old records
    await supabase.from('rate_limits').delete().lt('created_at', windowStart.toISOString());

    // Count requests in the current window
    const { data: existingRequests, error: countError } = await supabase
      .from('rate_limits')
      .select('id')
      .eq('identifier', identifier)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      console.error('Error counting rate limit requests:', countError);
      // On error, allow the request
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now.getTime() + config.windowMs),
      };
    }

    const requestCount = existingRequests?.length || 0;
    const remaining = Math.max(0, config.maxRequests - requestCount);
    const resetAt = new Date(now.getTime() + config.windowMs);

    if (requestCount >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Record this request
    await supabase.from('rate_limits').insert({
      identifier,
      created_at: now.toISOString(),
    });

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

// Get identifier from request
export function getRateLimitIdentifier(req: Request): string {
  // Try to get user ID from auth header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT (simplified)
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.sub) {
        return `user:${payload.sub}`;
      }
    } catch {
      // Invalid token, fall back to IP
    }
  }

  // Fall back to IP address
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    'unknown';
  return `ip:${ip}`;
}

// Rate limit middleware
export async function rateLimitMiddleware(
  req: Request,
  config?: RateLimitConfig
): Promise<{ allowed: boolean; response?: Response }> {
  const identifier = getRateLimitIdentifier(req);
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    const response = new Response(
      JSON.stringify({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config?.maxRequests.toString() || '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
        },
      }
    );
    return { allowed: false, response };
  }

  return { allowed: true };
}

// Create rate limit table if it doesn't exist
export async function ensureRateLimitTable(): Promise<void> {
  const { error } = await supabase.rpc('create_rate_limit_table_if_not_exists');
  if (error) {
    console.error('Error creating rate limit table:', error);
  }
}
