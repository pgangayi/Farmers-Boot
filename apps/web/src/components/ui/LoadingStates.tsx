import React from 'react';

interface LoadingStatesProps {
  isLoading?: boolean;
  error?: string | Error | null;
  children: React.ReactNode;
  loadingText?: string;
}

function getErrorMessage(error: string | Error | null | undefined): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return String(error);
}

export function LoadingStates({
  isLoading,
  error,
  children,
  loadingText = 'Loading...',
}: LoadingStatesProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">{loadingText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{getErrorMessage(error)}</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function LoadingErrorContent({
  isLoading,
  error,
  children,
  loadingText = 'Loading...',
  loadingMessage,
  errorTitle,
  errorMessage,
  onRetry,
}: LoadingStatesProps & {
  onRetry?: () => void;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ReactNode;
}) {
  const displayLoadingText = loadingMessage || loadingText;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-600">{displayLoadingText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        {errorTitle && <h3 className="text-red-700 font-semibold mb-1">{errorTitle}</h3>}
        <p className="text-red-600 mb-2">{errorMessage || getErrorMessage(error)}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-600`} />
  );
}
