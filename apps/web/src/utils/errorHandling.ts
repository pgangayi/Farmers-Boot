/**
 * Error Handling Utilities
 * Standardized error handling patterns and utilities
 */

import React from 'react';
import * as Sentry from '@sentry/react';
import type { ApiErrorResponse } from '../api/types';

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'network'
  | 'database'
  | 'business'
  | 'system'
  | 'user';

export interface ErrorContext {
  userId?: string;
  farmId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly userFriendly: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details?: unknown,
    severity: ErrorSeverity = 'medium',
    category: ErrorCategory = 'system',
    context?: ErrorContext,
    retryable: boolean = false,
    userFriendly: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.severity = severity;
    this.category = category;
    this.context = context;
    this.retryable = retryable;
    this.userFriendly = userFriendly;
  }

  static fromApiError(apiError: ApiErrorResponse): AppError {
    return new AppError(
      apiError.message,
      apiError.error,
      apiError.status_code,
      apiError.details,
      'medium',
      'system',
      undefined,
      false,
      true
    );
  }

  static fromUnknownError(
    error: unknown,
    defaultMessage: string = 'An unexpected error occurred'
  ): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(
        error.message,
        'RUNTIME_ERROR',
        500,
        { originalError: error },
        'medium',
        'system',
        undefined,
        false,
        false
      );
    }

    return new AppError(
      defaultMessage,
      'UNKNOWN_ERROR',
      500,
      { originalError: error },
      'medium',
      'system',
      undefined,
      false,
      true
    );
  }

  // Specific error type creators
  static validation(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'VALIDATION_ERROR',
      400,
      undefined,
      'low',
      'validation',
      context,
      false,
      true
    );
  }

  static authentication(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'AUTHENTICATION_ERROR',
      401,
      undefined,
      'medium',
      'authentication',
      context,
      false,
      true
    );
  }

  static authorization(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'AUTHORIZATION_ERROR',
      403,
      undefined,
      'medium',
      'authorization',
      context,
      false,
      true
    );
  }

  static network(message: string, retryable = true, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'NETWORK_ERROR',
      0,
      undefined,
      'medium',
      'network',
      context,
      retryable,
      true
    );
  }

  static database(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'DATABASE_ERROR',
      500,
      undefined,
      'high',
      'database',
      context,
      false,
      false
    );
  }

  static business(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'BUSINESS_ERROR',
      422,
      undefined,
      'medium',
      'business',
      context,
      false,
      true
    );
  }

  static notFound(resource: string, id?: string, context?: ErrorContext): AppError {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new AppError(
      message,
      'NOT_FOUND',
      404,
      undefined,
      'low',
      'database',
      context,
      false,
      true
    );
  }

  static conflict(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      'CONFLICT',
      409,
      undefined,
      'medium',
      'database',
      context,
      false,
      true
    );
  }

  static serverUnavailable(context?: ErrorContext): AppError {
    return new AppError(
      'Server temporarily unavailable',
      'SERVER_UNAVAILABLE',
      503,
      undefined,
      'high',
      'system',
      context,
      true,
      true
    );
  }
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export interface ErrorHandler {
  handleError: (error: unknown, context?: string) => void;
  logError: (error: unknown, context?: string) => void;
  reportError: (error: unknown, context?: string) => void;
}

export class DefaultErrorHandler implements ErrorHandler {
  handleError(error: unknown, context?: string): void {
    const appError = AppError.fromUnknownError(error);
    this.logError(appError, context);

    // In development, throw to trigger error boundaries
    if (import.meta.env.DEV) {
      throw appError;
    }

    // In production, report to error tracking service
    this.reportError(appError, context);
  }

  logError(error: unknown, context?: string): void {
    const appError = error instanceof AppError ? error : AppError.fromUnknownError(error);
    const logMessage = context ? `[${context}] ${appError.message}` : appError.message;

    console.error(logMessage, {
      code: appError.code,
      statusCode: appError.statusCode,
      details: appError.details,
      stack: appError.stack,
      timestamp: appError.timestamp,
    });
  }

  reportError(error: unknown, context?: string): void {
    const appError = error instanceof AppError ? error : AppError.fromUnknownError(error);

    if (import.meta.env.PROD) {
      Sentry.captureException(appError, {
        extra: {
          context,
          code: appError.code,
          statusCode: appError.statusCode,
          details: appError.details,
        },
      });
    } else {
      console.error('Error reported (Dev):', {
        message: appError.message,
        code: appError.code,
        context,
        timestamp: appError.timestamp,
      });
    }
  }
}

// Global error handler instance
export const errorHandler = new DefaultErrorHandler();

// ============================================================================
// ASYNC ERROR HANDLING
// ============================================================================

export interface AsyncResult<T> {
  data: T | null;
  error: AppError | null;
  isLoading: boolean;
}

export function createAsyncResult<T>(
  data: T | null = null,
  error: AppError | null = null,
  isLoading: boolean = false
): AsyncResult<T> {
  return { data, error, isLoading };
}

export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<AsyncResult<T>> {
  try {
    const data = await operation();
    return createAsyncResult(data);
  } catch (error) {
    const appError = AppError.fromUnknownError(error);
    errorHandler.handleError(appError, context);
    return createAsyncResult<T>(null, appError);
  }
}

// ============================================================================
// REACT ERROR BOUNDARY HOOKS
// ============================================================================

export interface ErrorBoundaryHookResult {
  error: AppError | null;
  resetError: () => void;
  captureError: (error: unknown) => void;
}

export function useErrorBoundary(): ErrorBoundaryHookResult {
  const [error, setError] = React.useState<AppError | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: unknown) => {
    const appError = AppError.fromUnknownError(error);
    setError(appError);
    errorHandler.handleError(appError);
  }, []);

  return { error, resetError, captureError };
}

// ============================================================================
// API ERROR HANDLING
// ============================================================================

export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'message' in error &&
    'status_code' in error
  );
}

export function handleApiError(error: unknown, context?: string): AppError {
  if (isApiError(error)) {
    const appError = AppError.fromApiError(error);
    errorHandler.handleError(appError, context);
    return appError;
  }

  return AppError.fromUnknownError(error);
}

// ============================================================================
// VALIDATION ERROR HANDLING
// ============================================================================

export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field });
    this.name = 'ValidationError';
    this.field = field;
  }
}

export function createValidationError(message: string, field?: string): ValidationError {
  return new ValidationError(message, field);
}

// ============================================================================
// NETWORK ERROR HANDLING
// ============================================================================

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function getErrorCode(error: unknown): string {
  if (error instanceof AppError) {
    return error.code;
  }

  return 'UNKNOWN_ERROR';
}

export function shouldRetry(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof AppError && error.statusCode >= 500);
}
