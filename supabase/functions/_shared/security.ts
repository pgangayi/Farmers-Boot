/**
 * ============================================================================
 * SECURITY UTILITIES
 * ============================================================================
 * Provides security utilities for Supabase Edge Functions.
 * Includes CSRF protection, security headers, input sanitization.
 * ============================================================================
 */

import { corsHeaders } from './cors.ts';

// Security headers to add to all responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Content Security Policy
export const CSP_DIRECTIVES = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data: https:",
  'font-src': "'self'",
  'connect-src': "'self' https://api.mapbox.com https://*.openstreetmap.org',
  'frame-ancestors': "'none'",
};

/**
 * Generate Content Security Policy header value
 */
export function generateCSP(directives: Record<string, string> = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // Add CSP
  newHeaders.set('Content-Security-Policy', generateCSP());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * CSRF Token validation
 */
export function validateCSRFToken(req: Request): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }
  
  // Get tokens from headers
  const csrfToken = req.headers.get('X-CSRF-Token');
  const cookieToken = extractCSRFCookie(req.headers.get('Cookie'));
  
  // Both tokens must be present and match
  if (!csrfToken || !cookieToken) {
    return false;
  }
  
  return csrfToken === cookieToken;
}

/**
 * Extract CSRF token from cookie
 */
function extractCSRFCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  
  return null;
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item) : 
          typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item
        );
      } else {
        sanitized[key] = sanitizeObject(value as Record<string, unknown>);
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate JWT token format (basic check)
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Check if each part is valid base64
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => base64Regex.test(part));
}

/**
 * Extract user ID from JWT without verification (for logging only)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    if (!isValidJWTFormat(token)) return null;
    
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);
    
    return parsed.sub || null;
  } catch {
    return null;
  }
}

/**
 * Security middleware wrapper
 */
export function withSecurity(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    // Validate CSRF for mutating requests
    if (!validateCSRFToken(req)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'CSRF token validation failed',
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Process request
    const response = await handler(req);
    
    // Add security headers
    return addSecurityHeaders(response);
  };
}

/**
 * Request logging for security audit
 */
export interface SecurityLogEntry {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  userId?: string;
  statusCode: number;
  duration: number;
}

export function logSecurityEvent(entry: SecurityLogEntry): void {
  console.log(JSON.stringify({
    type: 'security_audit',
    ...entry,
  }));
}

/**
 * Create security log entry from request
 */
export function createSecurityLogEntry(
  req: Request,
  statusCode: number,
  duration: number,
  userId?: string
): SecurityLogEntry {
  const url = new URL(req.url);
  
  return {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: url.pathname,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        req.headers.get('x-real-ip') || 
        'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    userId,
    statusCode,
    duration,
  };
}

/**
 * Check for suspicious patterns in request
 */
export function detectSuspiciousPatterns(req: Request): string[] {
  const warnings: string[] = [];
  const url = new URL(req.url);
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--)|(\/\*)|(\*\/)/,
    /(\bOR\b|\bAND\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  ];
  
  const queryString = url.search + (req.headers.get('content-type')?.includes('json') ? '' : '');
  for (const pattern of sqlPatterns) {
    if (pattern.test(queryString)) {
      warnings.push('Potential SQL injection pattern detected');
      break;
    }
  }
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(queryString)) {
      warnings.push('Potential XSS pattern detected');
      break;
    }
  }
  
  // Check for path traversal
  if (/\.\.[\/\\]/.test(url.pathname)) {
    warnings.push('Path traversal attempt detected');
  }
  
  return warnings;
}
