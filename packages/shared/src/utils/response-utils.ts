// ============================================================================
// SHARED RESPONSE UTILITIES
// ============================================================================
// This module provides common response utility functions for the Farmers-Boot
// monorepo. Following Turbo monorepo principles, shared code is placed in
// packages/shared to be used by both apps/api and apps/web.
//
// Date: 2026-02-10
// ============================================================================

/**
 * Create a success response with standardized format
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns Response object
 */
export const createSuccessResponse = (data: any, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create an error response with standardized format
 * @param error - Error message or object
 * @param status - HTTP status code (default: 400)
 * @returns Response object
 */
export const createErrorResponse = (
  error: string | { error: string },
  status: number = 400
): Response => {
  const errorMessage = typeof error === 'string' ? error : error.error;
  return new Response(JSON.stringify({ error: errorMessage }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create an unauthorized response
 * @param message - Error message (default: 'Unauthorized')
 * @returns Response object
 */
export const createUnauthorizedResponse = (message: string = 'Unauthorized'): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a forbidden response
 * @param message - Error message (default: 'Forbidden')
 * @returns Response object
 */
export const createForbiddenResponse = (message: string = 'Forbidden'): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a not found response
 * @param message - Error message (default: 'Not found')
 * @returns Response object
 */
export const createNotFoundResponse = (message: string = 'Not found'): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a conflict response
 * @param message - Error message (default: 'Conflict')
 * @returns Response object
 */
export const createConflictResponse = (message: string = 'Conflict'): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status: 409,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a rate limit exceeded response
 * @param retryAfter - Seconds to wait before retrying (default: 60)
 * @returns Response object
 */
export const createRateLimitResponse = (retryAfter: number = 60): Response => {
  return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': retryAfter.toString(),
    },
  });
};

/**
 * Create an internal server error response
 * @param message - Error message (default: 'Internal server error')
 * @returns Response object
 */
export const createInternalErrorResponse = (
  message: string = 'Internal server error'
): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a method not allowed response
 * @param message - Error message (default: 'Method not allowed')
 * @returns Response object
 */
export const createMethodNotAllowedResponse = (
  message: string = 'Method not allowed'
): Response => {
  return new Response(JSON.stringify({ error: message }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a paginated response
 * @param data - Array of items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Response object
 */
export const createPaginatedResponse = (
  data: any[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit);
  return createSuccessResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
};

/**
 * Response builder class for fluent API
 */
export class ResponseBuilder {
  private status: number = 200;
  private data: any = null;
  private error: string | null = null;
  private headers: Record<string, string> = {};

  /**
   * Set the status code
   */
  setStatus(status: number): this {
    this.status = status;
    return this;
  }

  /**
   * Set the response data
   */
  setData(data: any): this {
    this.data = data;
    return this;
  }

  /**
   * Set the error message
   */
  setError(error: string): this {
    this.error = error;
    return this;
  }

  /**
   * Add a header
   */
  addHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  /**
   * Build the response
   */
  build(): Response {
    const body = this.error ? { error: this.error } : this.data;
    return new Response(JSON.stringify(body), {
      status: this.status,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
    });
  }

  /**
   * Create a success response
   */
  static success(data: any, status: number = 200): Response {
    return createSuccessResponse(data, status);
  }

  /**
   * Create an error response
   */
  static error(error: string, status: number = 400): Response {
    return createErrorResponse(error, status);
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(message: string = 'Unauthorized'): Response {
    return createUnauthorizedResponse(message);
  }

  /**
   * Create a not found response
   */
  static notFound(message: string = 'Not found'): Response {
    return createNotFoundResponse(message);
  }
}

// Export all utilities
export default {
  createSuccessResponse,
  createErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createNotFoundResponse,
  createConflictResponse,
  createRateLimitResponse,
  createInternalErrorResponse,
  createMethodNotAllowedResponse,
  createPaginatedResponse,
  ResponseBuilder,
};
