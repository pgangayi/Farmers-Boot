import React from 'react';
import { Loader2, AlertTriangle, RefreshCw, WifiOff, Database, Cloud, Server } from 'lucide-react';
import { Button } from '../ui/button';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

interface LoadingStateProps {
  loading: boolean;
  error?: any;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  retry?: () => void;
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary`} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

export function LoadingState({ loading, error, children, fallback, retry }: LoadingStateProps) {
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-600 font-medium mb-1">Error loading content</p>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message || 'Something went wrong. Please try again.'}
        </p>
        {retry && (
          <Button onClick={retry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export function LoadingCard({ title, description, icon, action }: LoadingCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon || <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />}
      <h3 className="text-lg font-medium mb-2">{title || 'Loading...'}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {description || 'Please wait while we load your content.'}
      </p>
      {action}
    </div>
  );
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Loading Application</h2>
        <p className="text-muted-foreground">Please wait while we prepare your workspace...</p>
      </div>
    </div>
  );
}

export function DataLoading({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center gap-3">
        <Database className="h-5 w-5 text-blue-500 animate-pulse" />
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

export function NetworkError({ retry }: { retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <WifiOff className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-medium mb-1">Network Error</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Unable to connect to the server. Please check your internet connection.
      </p>
      {retry && (
        <Button onClick={retry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function ServerError({ retry }: { retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Server className="h-8 w-8 text-red-500 mb-2" />
      <h3 className="text-lg font-medium mb-1">Server Error</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Something went wrong on our end. Our team has been notified.
      </p>
      {retry && (
        <Button onClick={retry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon || <Cloud className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
}

export function LoadingErrorContent({
  loading,
  error,
  children,
  retry,
}: {
  loading: boolean;
  error: any;
  children: React.ReactNode;
  retry?: () => void;
}) {
  if (loading) {
    return <LoadingSpinner text="Loading content..." />;
  }

  if (error) {
    const errorType = error?.type || 'default';

    switch (errorType) {
      case 'network':
        return <NetworkError retry={retry} />;
      case 'server':
        return <ServerError retry={retry} />;
      default:
        return (
          <div className="text-center p-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium mb-1">Error loading content</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Something went wrong. Please try again.'}
            </p>
            {retry && (
              <Button onClick={retry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Try Again
              </Button>
            )}
          </div>
        );
    }
  }

  return <>{children}</>;
}

// Loading variants for different contexts
export const LoadingVariants = {
  // For data tables and lists
  Table: () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),

  // For cards and grids
  Card: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5" />
          </div>
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  ),

  // For forms
  Form: () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3" />
    </div>
  ),
};
