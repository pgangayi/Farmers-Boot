/**
 * ============================================================================
 * STANDARDIZED ERROR HANDLING
 * ============================================================================
 * Centralized error handling patterns for Farmers-Boot application
 * ============================================================================
 */

// Error context types for better type safety
export interface ErrorContext {
  [key: string]: unknown;
}

export interface ApiErrorContext extends ErrorContext {
  response?: unknown;
  statusCode?: number;
  originalError?: unknown;
}

export interface ValidationErrorContext extends ErrorContext {
  field?: string;
  value?: unknown;
  format?: string;
}

export interface NetworkErrorContext extends ErrorContext {
  originalError?: unknown;
}

export interface AuthenticationErrorContext extends ErrorContext {
  originalError?: unknown;
}

export interface RecordNotFoundErrorContext extends ErrorContext {
  resource?: string;
  identifier?: string;
}

export interface DuplicateRecordErrorContext extends ErrorContext {
  resource?: string;
  field?: string;
  value?: unknown;
}

export interface InsufficientPermissionErrorContext extends ErrorContext {
  action?: string;
  resource?: string;
}

export interface ResourceLimitErrorContext extends ErrorContext {
  resource?: string;
  limit?: number;
  current?: number;
}

export interface FileErrorContext extends ErrorContext {
  filename?: string;
  size?: number;
  maxSize?: number;
  type?: string;
  allowedTypes?: string[];
}

// Base error class
export abstract class BaseError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly context?: ErrorContext
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Authentication errors
export class AuthenticationError extends BaseError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;

  constructor(message: string = 'Authentication failed', context?: AuthenticationErrorContext) {
    super(message, context);
  }
}

export class AuthorizationError extends BaseError {
  readonly code = 'AUTHZ_ERROR';
  readonly statusCode = 403;

  constructor(message: string = 'Access denied', context?: AuthenticationErrorContext) {
    super(message, context);
  }
}

export class SessionExpiredError extends BaseError {
  readonly code = 'SESSION_EXPIRED';
  readonly statusCode = 401;

  constructor(message: string = 'Session has expired', context?: AuthenticationErrorContext) {
    super(message, context);
  }
}

// Validation errors
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string = 'Validation failed',
    public readonly field?: string,
    public readonly value?: unknown,
    context?: ValidationErrorContext
  ) {
    super(message, { ...context, field, value });
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string, context?: ValidationErrorContext) {
    super(`Field '${field}' is required`, field, undefined, context);
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(field: string, format: string, value?: unknown, context?: ValidationErrorContext) {
    super(`Field '${field}' must be in ${format} format`, field, value, context);
  }
}

// Network and API errors
export class NetworkError extends BaseError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 0;

  constructor(message: string = 'Network error occurred', context?: NetworkErrorContext) {
    super(message, context);
  }
}

export class ApiError extends BaseError {
  code: string = 'API_ERROR';
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 500,
    public readonly response?: unknown,
    context?: ApiErrorContext
  ) {
    super(message, { ...context, response, statusCode });
    this.statusCode = statusCode;
  }
}

export class RateLimitError extends ApiError {
  override readonly code: string = 'RATE_LIMIT';
  override readonly statusCode = 429;

  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    context?: ApiErrorContext
  ) {
    super(message, 429, undefined, { ...context, retryAfter });
  }
}

// Database errors
export class DatabaseError extends BaseError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(message: string = 'Database operation failed', context?: ErrorContext) {
    super(message, context);
  }
}

export class RecordNotFoundError extends BaseError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string, context?: RecordNotFoundErrorContext) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, { ...context, resource, identifier });
  }
}

export class DuplicateRecordError extends BaseError {
  readonly code = 'DUPLICATE_RECORD';
  readonly statusCode = 409;

  constructor(
    resource: string,
    field: string,
    value: unknown,
    context?: DuplicateRecordErrorContext
  ) {
    super(`${resource} with ${field} '${value}' already exists`, {
      ...context,
      resource,
      field,
      value,
    });
  }
}

// Business logic errors
export class BusinessLogicError extends BaseError {
  readonly code = 'BUSINESS_LOGIC_ERROR';
  readonly statusCode = 422;

  constructor(message: string, context?: ErrorContext) {
    super(message, context);
  }
}

export class InsufficientPermissionError extends BusinessLogicError {
  constructor(action: string, resource: string, context?: InsufficientPermissionErrorContext) {
    super(`Insufficient permissions to ${action} ${resource}`, {
      ...context,
      action,
      resource,
    });
  }
}

export class ResourceLimitError extends BusinessLogicError {
  constructor(
    resource: string,
    limit: number,
    current: number,
    context?: ResourceLimitErrorContext
  ) {
    super(`${resource} limit exceeded (${current}/${limit})`, {
      ...context,
      resource,
      limit,
      current,
    });
  }
}

// File and storage errors
export class FileError extends BaseError {
  readonly code = 'FILE_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly filename?: string,
    context?: FileErrorContext
  ) {
    super(message, { ...context, filename });
  }
}

export class FileSizeError extends FileError {
  constructor(filename: string, size: number, maxSize: number, context?: FileErrorContext) {
    super(
      `File '${filename}' size (${size} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
      filename,
      { ...context, size, maxSize }
    );
  }
}

export class FileTypeError extends FileError {
  constructor(
    filename: string,
    type: string,
    allowedTypes: readonly string[],
    context?: FileErrorContext
  ) {
    super(
      `File '${filename}' type '${type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      filename,
      { ...context, type, allowedTypes: [...allowedTypes] as string[] }
    );
  }
}

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: BaseError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Add error listener for logging/analytics
  addErrorListener(listener: (error: BaseError) => void): void {
    this.errorListeners.push(listener);
  }

  // Remove error listener
  removeErrorListener(listener: (error: BaseError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  // Handle and log errors
  handle(error: unknown, context?: ErrorContext): BaseError {
    const standardizedError = this.standardizeError(error, context);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(standardizedError);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    return standardizedError;
  }

  // Convert unknown error to standardized format
  private standardizeError(error: unknown, context?: ErrorContext): BaseError {
    if (error instanceof BaseError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        return new NetworkError(error.message, {
          ...context,
          originalError: error,
        } as NetworkErrorContext);
      }

      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return new AuthenticationError(error.message, {
          ...context,
          originalError: error,
        } as AuthenticationErrorContext);
      }

      if (error.message.includes('Forbidden') || error.message.includes('403')) {
        return new AuthorizationError(error.message, {
          ...context,
          originalError: error,
        } as AuthenticationErrorContext);
      }

      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return new RecordNotFoundError('Resource', undefined, {
          ...context,
          originalError: error,
        } as RecordNotFoundErrorContext);
      }

      // Generic error
      return new BusinessLogicError('An unexpected error occurred', {
        ...context,
        originalError: error,
      } as ErrorContext);
    }

    if (typeof error === 'string') {
      return new BusinessLogicError(error, context);
    }

    // Unknown error type
    return new BusinessLogicError('An unexpected error occurred', {
      ...context,
      originalError: error,
    });
  }

  // Check if error is recoverable
  isRecoverable(error: BaseError): boolean {
    const recoverableCodes = ['NETWORK_ERROR', 'RATE_LIMIT', 'VALIDATION_ERROR'];

    return recoverableCodes.includes(error.code);
  }

  // Get user-friendly message
  getUserMessage(error: BaseError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection error. Please check your internet connection and try again.';

      case 'AUTH_ERROR':
        return 'Please sign in to continue.';

      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please sign in again.';

      case 'VALIDATION_ERROR':
        return error.message;

      case 'RATE_LIMIT':
        return 'Too many requests. Please wait a moment and try again.';

      case 'NOT_FOUND':
        return 'The requested resource was not found.';

      case 'DUPLICATE_RECORD':
        return 'This record already exists.';

      case 'FILE_ERROR':
        return 'There was an error with the file. Please try again.';

      case 'BUSINESS_LOGIC_ERROR':
        return error.message;

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

import React from 'react';

// Error boundary component for React
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: BaseError;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<string, never>>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<Record<string, never>>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorHandler = ErrorHandler.getInstance();
    const standardizedError = errorHandler.handle(error);

    return {
      hasError: true,
      error: standardizedError,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorHandler = ErrorHandler.getInstance();
    const standardizedError = errorHandler.handle(error, {
      componentStack: errorInfo.componentStack,
    });

    console.error('React Error Boundary caught an error:', standardizedError);
  }

  override render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      return React.createElement(
        'div',
        { className: 'error-boundary' },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', null, ErrorHandler.getInstance().getUserMessage(this.state.error)),
        React.createElement(
          'button',
          {
            onClick: () => this.setState({ hasError: false, error: undefined }),
          },
          'Try again'
        )
      );
    }

    return this.props.children;
  }
}

// Utility functions
export const createErrorHandler = () => ErrorHandler.getInstance();

export const handleError = (error: unknown, context?: ErrorContext) => {
  return ErrorHandler.getInstance().handle(error, context);
};

export const isRecoverableError = (error: BaseError) => {
  return ErrorHandler.getInstance().isRecoverable(error);
};

export const getUserErrorMessage = (error: BaseError) => {
  return ErrorHandler.getInstance().getUserMessage(error);
};

// Type guards
export const isAuthenticationError = (error: BaseError): error is AuthenticationError => {
  return error.code === 'AUTH_ERROR';
};

export const isValidationError = (error: BaseError): error is ValidationError => {
  return error.code === 'VALIDATION_ERROR';
};

export const isNetworkError = (error: BaseError): error is NetworkError => {
  return error.code === 'NETWORK_ERROR';
};

export default ErrorHandler;
