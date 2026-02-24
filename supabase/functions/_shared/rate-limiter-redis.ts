/**
 * ============================================================================
 * DISTRIBUTED RATE LIMITING MIDDLEWARE
 * ============================================================================
 * Provides distributed rate limiting for Supabase Edge Functions.
 * Uses Upstash Redis for serverless-compatible rate limiting.
 *
 * This replaces the in-memory rate limiter for production use.
 * ============================================================================
 */

import { corsHeaders } from './cors.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Upstash Redis REST API configuration
interface RedisConfig {
  url: string;
  token: string;
}

// Get Redis configuration from environment
function getRedisConfig(): RedisConfig {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!url || !token) {
    console.warn('Upstash Redis credentials not configured. Rate limiting will be degraded.');
  }

  return { url: url || '', token: token || '' };
}

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipIf?: (req: Request) => boolean; // Skip rate limiting condition
  message?: string; // Custom error message
  useRedis?: boolean; // Whether to use Redis (default: true in production)
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
// UPSTASH REDIS CLIENT
// ============================================================================

/**
 * Simple Upstash Redis REST client for Edge Functions
 */
class UpstashRedis {
  private url: string;
  private token: string;
  private available: boolean;

  constructor(config: RedisConfig) {
    this.url = config.url;
    this.token = config.token;
    this.available = !!(config.url && config.token);
  }

  /**
   * Execute a Redis command
   */
  async execute(command: string[]): Promise<unknown> {
    if (!this.available) {
      return null;
    }

    try {
      const response = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([command]),
      });

      if (!response.ok) {
        console.error('Redis error:', response.status, await response.text());
        return null;
      }

      const [result] = await response.json();
      return result?.result ?? null;
    } catch (error) {
      console.error('Redis connection error:', error);
      return null;
    }
  }

  /**
   * Increment counter with TTL (sliding window)
   * Returns the new count and TTL
   */
  async incrWithTtl(key: string, ttlMs: number): Promise<{ count: number; ttl: number } | null> {
    if (!this.available) {
      return null;
    }

    try {
      // Use Lua script for atomic increment with TTL
      const script = `
        local current = redis.call('INCR', KEYS[1])
        if current == 1 then
          redis.call('PEXPIRE', KEYS[1], ARGV[1])
        end
        local ttl = redis.call('PTTL', KEYS[1])
        return {current, ttl}
      `;

      const response = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([['EVAL', script, '1', key, String(ttlMs)]]),
      });

      if (!response.ok) {
        return null;
      }

      const [result] = await response.json();
      const [count, ttl] = result?.result ?? [0, 0];
      return { count: count as number, ttl: ttl as number };
    } catch (error) {
      console.error('Redis incr error:', error);
      return null;
    }
  }

  /**
   * Get current count for a key
   */
  async get(key: string): Promise<number> {
    const result = await this.execute(['GET', key]);
    return result ? parseInt(result as string, 10) : 0;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.available;
  }
}

// Singleton Redis client
let redisClient: UpstashRedis | null = null;

function getRedisClient(): UpstashRedis {
  if (!redisClient) {
    redisClient = new UpstashRedis(getRedisConfig());
  }
  return redisClient;
}

// ============================================================================
// IN-MEMORY FALLBACK
// ============================================================================

// In-memory rate limit store (fallback when Redis is unavailable)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

// ============================================================================
// KEY GENERATION
// ============================================================================

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

  return `ratelimit:${ip}:${userId}`;
}

// ============================================================================
// RATE LIMIT CHECK
// ============================================================================

/**
 * Rate limit response headers
 */
interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

/**
 * Check rate limit using Redis (with in-memory fallback)
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; headers: RateLimitHeaders }> {
  const redis = getRedisClient();
  const now = Date.now();
  const resetTime = now + config.windowMs;

  // Try Redis first
  if (redis.isAvailable()) {
    const result = await redis.incrWithTtl(key, config.windowMs);

    if (result) {
      const { count, ttl } = result;
      const allowed = count <= config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - count);
      const actualResetTime = now + ttl;

      return {
        allowed,
        remaining,
        resetTime: actualResetTime,
        headers: {
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(Math.ceil(actualResetTime / 1000)),
        },
      };
    }
  }

  // Fallback to in-memory store
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
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

// ============================================================================
// MIDDLEWARE
// ============================================================================

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
export async function withCombinedRateLimit(
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

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Check if rate limiter is properly configured
 */
export async function checkRateLimiterHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: boolean;
  message: string;
}> {
  const redis = getRedisClient();

  if (redis.isAvailable()) {
    // Try a simple operation
    try {
      const testKey = 'health:check';
      const result = await redis.incrWithTtl(testKey, 1000);

      if (result) {
        return {
          status: 'healthy',
          redis: true,
          message: 'Rate limiter is operating normally with Redis backend',
        };
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
  }

  // Redis not available, using in-memory fallback
  return {
    status: 'degraded',
    redis: false,
    message: 'Rate limiter is using in-memory fallback. Configure Upstash Redis for production.',
  };
}
