/**
 * ============================================================================
 * RATE LIMITING MIDDLEWARE
 * ============================================================================
 * Provides rate limiting for Supabase Edge Functions.
 * Uses sliding window algorithm with configurable limits.
 *
 * Storage Options (in order of preference):
 * 1. Supabase Database (default, free, works everywhere)
 * 2. In-memory fallback (for development/single instance)
 *
 * Note: For high-traffic production, you can optionally use:
 * - Upstash Redis (paid, but has free tier)
 * - Cloudflare Workers Rate Limiting (if deploying to CF)
 * ============================================================================
 */

import { corsHeaders } from './cors.js';
import { supabase } from './supabase-client.js';

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipIf?: (req: Request) => boolean; // Skip rate limiting condition
  message?: string; // Custom error message
}

// Default rate limit configurations per endpoint type
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // Password reset - very strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 requests per hour
  },
  // API endpoints - standard limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Search endpoints - moderate limits
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // Upload endpoints - lower limits
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  // AI endpoints - strict limits (expensive operations)
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
};

// ============================================================================
// IN-MEMORY FALLBACK STORE
// ============================================================================

// In-memory rate limit store (for development/single instance)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup function - called lazily to avoid memory leaks
function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Default key generator - uses IP address and user ID if available
 */
function defaultKeyGenerator(req: Request): string {
  // Get IP address from headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  // Get user ID from authorization header if present
  const authHeader = req.headers.get('authorization');
  const userId = authHeader ? `user:${authHeader.slice(0, 20)}` : '';

  return `${ip}:${userId}`;
}

/**
 * Rate limit response headers
 */
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

/**
 * Check rate limit using Supabase database (with in-memory fallback)
 * This is the FREE option - uses your existing Supabase database
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; headers: RateLimitHeaders }> {
  const now = new Date();
  const nowMs = now.getTime();
  const resetTime = nowMs + config.windowMs;
  const windowStart = new Date(nowMs - config.windowMs);

  try {
    // Try Supabase database first (free, persistent across instances)
    
    // Clean up old records (lazy cleanup)
    await supabase.from('rate_limits').delete().lt('created_at', windowStart.toISOString());

    // Count requests in the current window
    const { data: existingRequests, error: countError } = await supabase
      .from('rate_limits')
      .select('id')
      .eq('identifier', key)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      console.error('Rate limit DB error:', countError);
      // Fall through to in-memory fallback
    } else {
      const requestCount = existingRequests?.length || 0;
      const remaining = Math.max(0, config.maxRequests - requestCount);

      if (requestCount >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          headers: {
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
          },
        };
      }

      // Record this request
      await supabase.from('rate_limits').insert({
        identifier: key,
        created_at: now.toISOString(),
      });

      return {
        allowed: true,
        remaining: remaining - 1,
        resetTime,
        headers: {
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': String(remaining - 1),
          'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
        },
      };
    }
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fall through to in-memory fallback
  }

  // ============================================================================
  // IN-MEMORY FALLBACK (when database is unavailable)
  // ============================================================================
  
  // Periodic cleanup (lazy - only when checking rate limits)
  if (memoryStore.size > 1000) {
    cleanupMemoryStore();
  }

  const record = memoryStore.get(key);

  if (!record || nowMs > record.resetTime) {
    // New window
    memoryStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(config.maxRequests - 1),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    };
  }

  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
      },
    };
  }

  // Increment count
  record.count++;
  memoryStore.set(key, record);

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
    headers: {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(config.maxRequests - record.count),
      'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
    },
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig) {
  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    // Skip if condition is met
    if (config.skipIf?.(req)) {
      return next();
    }

    // Generate key
    const key = config.keyGenerator ? config.keyGenerator(req) : defaultKeyGenerator(req);

    // Check rate limit
    const result = await checkRateLimit(key, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: config.message || 'Rate limit exceeded. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...result.headers,
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    // Process request
    const response = await next();

    // Add rate limit headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(result.headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Create rate limiter for specific endpoint type
 */
export function createRateLimiter(type: keyof typeof RATE_LIMITS) {
  return withRateLimit(RATE_LIMITS[type]);
}

/**
 * Combined rate limiter with multiple limits
 */
export function withCombinedRateLimit(
  configs: Array<{ type: keyof typeof RATE_LIMITS; keySuffix?: string }>
) {
  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const baseKey = defaultKeyGenerator(req);

    for (const { type, keySuffix } of configs) {
      const config = RATE_LIMITS[type];
      const key = keySuffix ? `${baseKey}:${keySuffix}` : baseKey;
      const result = await checkRateLimit(key, config);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded for ${type} endpoint. Please try again later.`,
            retryAfter,
            limitType: type,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              ...result.headers,
              'Retry-After': String(retryAfter),
            },
          }
        );
      }
    }

    return next();
  };
}

/**
 * Health check for rate limiter
 */
export async function checkRateLimiterHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  storage: 'database' | 'memory';
  message: string;
}> {
  try {
    // Test database connection
    const { error } = await supabase.from('rate_limits').select('id').limit(1);
    
    if (!error) {
      return {
        status: 'healthy',
        storage: 'database',
        message: 'Rate limiter is using Supabase database (free, persistent)',
      };
    }
  } catch {
    // Database unavailable
  }

  return {
    status: 'degraded',
    storage: 'memory',
    message: 'Rate limiter is using in-memory fallback. Database unavailable.',
  };
}

/**
 * Ensure rate_limits table exists
 * Call this during application startup
 */
export async function ensureRateLimitTable(): Promise<void> {
  // The table should be created via migration
  // This is a runtime check that creates it if missing
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.rate_limits (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      identifier text NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rate_limits_identifier_idx ON public.rate_limits(identifier);
    CREATE INDEX IF NOT EXISTS rate_limits_created_at_idx ON public.rate_limits(created_at);
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql: createTableSQL });
  } catch (error) {
    console.warn('Could not create rate_limits table:', error);
  }
}
