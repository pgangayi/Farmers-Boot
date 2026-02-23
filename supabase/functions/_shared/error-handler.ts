/**
 * ============================================================================
 * ERROR HANDLER
 * ============================================================================
 * Centralized error handling for Supabase Edge Functions
 * ============================================================================
 */

import { corsHeaders } from './cors.ts';

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  requestId?: string;
  timestamp: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(429, message);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, details);
    this.name = 'InternalServerError';
  }
}

export function errorHandler(error: unknown, req?: Request): Response {
  console.error('Error occurred:', error);

  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorDetails: any = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorMessage = error.message;
    errorDetails = error.details;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const requestId = req?.headers.get('x-request-id') || crypto.randomUUID();
  const errorResponse: ErrorResponse = {
    error: getErrorType(statusCode),
    message: errorMessage,
    details: errorDetails,
    requestId,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

function getErrorType(statusCode: number): string {
  const errorTypes: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return errorTypes[statusCode] || 'Error';
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  headers: HeadersInit = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): Response {
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return createSuccessResponse({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  });
}
