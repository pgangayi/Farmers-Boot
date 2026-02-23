/**
 * ERROR BOUNDARY SYSTEM
 * =====================
 * Comprehensive error boundary components for different contexts
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  WifiOff,
  Server,
  Database,
  Bug,
  FileWarning,
} from 'lucide-react';
import * as Sentry from '@sentry/react';

// ============================================================================
// TYPES
// ============================================================================

export type ErrorType = 'network' | 'server' | 'database' | 'render' | 'chunk' | 'unknown';

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  recoverable: boolean;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
  isolate?: boolean; // If true, only this component tree is affected
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

function classifyError(error: Error): AppError {
  const message = error.message.toLowerCase();
  const appError = error as AppError;
  appError.timestamp = new Date();
  appError.recoverable = true;

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('timeout') ||
    message.includes('abort')
  ) {
    appError.type = 'network';
    appError.code = 'NETWORK_ERROR';
    return appError;
  }

  // Chunk load errors (lazy loading failures)
  if (
    message.includes('chunk') ||
    message.includes('loading css chunk') ||
    message.includes('loading module')
  ) {
    appError.type = 'chunk';
    appError.code = 'CHUNK_LOAD_ERROR';
    return appError;
  }

  // Server errors
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504')
  ) {
    appError.type = 'server';
    appError.code = 'SERVER_ERROR';
    appError.statusCode = parseInt(message.match(/\d{3}/)?.[0] || '500');
    return appError;
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('connection') ||
    message.includes('supabase')
  ) {
    appError.type = 'database';
    appError.code = 'DATABASE_ERROR';
    return appError;
  }

  // Default to render error
  appError.type = 'render';
  appError.code = 'RENDER_ERROR';
  return appError;
}

// ============================================================================
// ERROR UI COMPONENTS
// ============================================================================

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
}

function ErrorIcon({ type }: { type: ErrorType }) {
  const iconClass = 'h-16 w-16 mx-auto mb-4';

  switch (type) {
    case 'network':
      return <WifiOff className={`${iconClass} text-orange-500`} />;
    case 'server':
      return <Server className={`${iconClass} text-red-500`} />;
    case 'database':
      return <Database className={`${iconClass} text-purple-500`} />;
    case 'chunk':
      return <FileWarning className={`${iconClass} text-yellow-500`} />;
    default:
      return <AlertTriangle className={`${iconClass} text-red-500`} />;
  }
}

function ErrorTitle({ type }: { type: ErrorType }) {
  const titles: Record<ErrorType, string> = {
    network: 'Connection Problem',
    server: 'Server Error',
    database: 'Database Error',
    render: 'Something Went Wrong',
    chunk: 'Failed to Load Resource',
    unknown: 'Unexpected Error',
  };

  return <h2 className="text-2xl font-bold text-gray-900 mb-2">{titles[type]}</h2>;
}

function ErrorMessage({ type, message }: { type: ErrorType; message: string }) {
  const messages: Record<ErrorType, string> = {
    network:
      'Unable to connect to the server. Please check your internet connection and try again.',
    server:
      'Our servers are experiencing issues. Our team has been notified and is working on a fix.',
    database: 'There was a problem accessing the database. Please try again in a moment.',
    render: 'We encountered an unexpected error. Please try refreshing the page.',
    chunk: 'Failed to load a part of the application. This might be resolved by refreshing.',
    unknown: 'An unexpected error occurred. Please try again.',
  };

  return <p className="text-gray-600 mb-6">{import.meta.env.DEV ? message : messages[type]}</p>;
}

export function ErrorDisplay({
  error,
  onRetry,
  onGoHome,
  showDetails = import.meta.env.DEV,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-red-100">
          <ErrorIcon type={error.type} />
          <ErrorTitle type={error.type} />
          <ErrorMessage type={error.type} message={error.message} />

          {showDetails && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Error Details (Dev Only)</p>
              </div>
              <code className="text-xs text-red-600 break-all block">{error.message}</code>
              {error.code && <p className="text-xs text-gray-500 mt-1">Code: {error.code}</p>}
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="space-y-3">
            {onRetry && error.recoverable && (
              <button
                onClick={onRetry}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh Page
            </button>
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span>Go to Home</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = classifyError(error);
    return { hasError: true, error: appError };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = classifyError(error);
    appError.context = { componentStack: errorInfo.componentStack };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Send to Sentry in production
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    }

    // Call optional onError callback
    this.props.onError?.(appError, errorInfo);

    this.setState({ errorInfo });
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys && resetKeys) {
      // Reset error state if resetKeys changed
      this.reset();
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleRetry = (): void => {
    // For chunk errors, reload the page
    if (this.state.error?.type === 'chunk') {
      window.location.reload();
    } else {
      this.reset();
    }
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  override render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, isolate } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // For isolated boundaries, show a smaller error
      if (isolate) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium mb-2">Component Error</p>
            <button
              onClick={this.handleRetry}
              className="text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        );
      }

      return <ErrorDisplay error={error} onRetry={this.handleRetry} onGoHome={this.handleGoHome} />;
    }

    return children;
  }
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

/**
 * For data fetching components - shows retry option
 */
export function DataErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary isolate>{children}</ErrorBoundary>;
}

/**
 * For route-level error handling
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

/**
 * For form components - preserves form state on error
 */
export class FormErrorBoundary extends Component<
  { children: ReactNode; onFormError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  override state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error) {
    this.props.onFormError?.(error);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Form Error</span>
          </div>
          <p className="text-sm text-red-600 mb-3">
            {this.state.error.message || 'An error occurred while processing the form.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to programmatically trigger error boundary
 */
export function useErrorBoundary() {
  const [, setError] = React.useState<Error | null>(null);

  const showBoundary = React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);

  return { showBoundary };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
