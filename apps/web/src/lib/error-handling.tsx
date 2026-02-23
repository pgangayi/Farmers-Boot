/**
 * ============================================================================
 * ERROR HANDLING UTILITIES
 * ============================================================================
 * Standardized error handling patterns for Farmers Boot
 * ============================================================================
 */

// Error classes
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[] = [], context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string, context?: Record<string, unknown>) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    context?: Record<string, unknown>
  ) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true, context);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, true, context);
  }
}

// Error type guard
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Error handler for API responses
export function handleApiError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  context?: Record<string, unknown>;
} {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      context: { originalError: error.name },
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    context: { originalError: String(error) },
  };
}

// Validation utilities
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'uuid' | 'email' | 'date' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: unknown) => string | undefined;
}

export function validateField(
  value: unknown,
  rule: ValidationRule,
  fieldName: string = rule.field
): string[] {
  const errors: string[] = [];

  // Required validation
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // Skip other validations if field is optional and empty
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return errors;
  }

  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${fieldName} must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`);
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${fieldName} must be a valid email`);
        }
        break;
      case 'uuid':
        if (
          typeof value !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
        ) {
          errors.push(`${fieldName} must be a valid UUID`);
        }
        break;
      case 'date':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          errors.push(`${fieldName} must be a valid date`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors.push(`${fieldName} must be an object`);
        }
        break;
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be at most ${rule.maxLength} characters long`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rule.enum.join(', ')}`);
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${fieldName} must be at most ${rule.max}`);
    }
  }

  // Array validations
  if (Array.isArray(value)) {
    if (rule.minLength !== undefined && value.length < rule.minLength) {
      errors.push(`${fieldName} must have at least ${rule.minLength} items`);
    }
    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      errors.push(`${fieldName} must have at most ${rule.maxLength} items`);
    }
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}

export function validate(data: Record<string, unknown>, rules: ValidationRule[]): string[] {
  const allErrors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];
    const errors = validateField(value, rule);
    allErrors.push(...errors);
  }

  return allErrors;
}

// Error boundary for React
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  constructor(
    props: React.PropsWithChildren<{
      fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo }>;
      onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    }>
  ) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} errorInfo={this.state.errorInfo} />;
      }

      return (
        <div style={{ padding: '20px', border: '1px solid #ff6b6b', borderRadius: '4px' }}>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error details</summary>
            <p>{this.state.error.toString()}</p>
            <p>{this.state.errorInfo.componentStack}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async error wrapper
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        console.error('Async error:', error);
      }
      throw error;
    }
  }) as T;
}

// Retry utility
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    shouldRetry = (error: unknown, attempt: number) => attempt < maxAttempts,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      if (attempt < maxAttempts) {
        const waitTime =
          backoff === 'exponential' ? delay * Math.pow(2, attempt - 1) : delay * attempt;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Export all error classes and utilities
export {
  AppError as Error,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  NetworkError,
};
