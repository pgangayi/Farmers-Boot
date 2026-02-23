import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import * as errorHandling from '../utils/errorHandling';

// Mock the error handling utilities
vi.mock('../utils/errorHandling', () => ({
  AppError: {
    fromUnknownError: vi.fn((error: Error) => ({
      message: error.message,
      code: 'TEST_ERROR',
      stack: error.stack,
    })),
  },
  errorHandler: {
    logError: vi.fn(),
  },
}));

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('should render children when there is no error', () => {
    const TestComponent = () => <div>Test Content</div>;

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('should render fallback UI when there is an error', () => {
    const ThrowComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Try Again')).toBeDefined();
    expect(screen.getByText('Refresh Page')).toBeDefined();
  });

  it('should render custom fallback when provided', () => {
    const ThrowComponent = () => {
      throw new Error('Test error');
    };
    const CustomFallback = () => <div>Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeDefined();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('should display error details in development mode', () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = true;

    const ThrowComponent = () => {
      throw new Error('Development test error');
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Development test error')).toBeDefined();
    expect(screen.getByText('Error Details (Development only):')).toBeDefined();

    // Restore original environment
    (import.meta.env as any).DEV = originalEnv;
  });

  it('should not display error details in production mode', () => {
    const originalEnv = import.meta.env.DEV;
    (import.meta.env as any).DEV = false;

    const ThrowComponent = () => {
      throw new Error('Production test error');
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Production test error')).toBeNull();
    expect(screen.queryByText('Error Details (Development only):')).toBeNull();

    // Restore original environment
    (import.meta.env as any).DEV = originalEnv;
  });

  it('should call onError callback when provided', () => {
    const onError = vi.fn();
    const ThrowComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
        code: 'TEST_ERROR',
      }),
      expect.any(Object)
    );
  });

  it('should reset error state when retry button is clicked', () => {
    // Using a ref to control throw behavior across renders
    let shouldThrow = true;
    const ConditionalComponent = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Retry Success</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalComponent />
      </ErrorBoundary>
    );

    // Initially shows error state
    expect(screen.getByText('Something went wrong')).toBeDefined();

    // Disable throwing before clicking retry
    shouldThrow = false;

    // Click retry button - this resets the error state and re-renders
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // Should now show the successful component
    expect(screen.getByText('Retry Success')).toBeDefined();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('should handle different types of errors', () => {
    const StringThrowComponent = () => {
      throw 'String error';
    };

    const ObjectThrowComponent = () => {
      throw { message: 'Object error' };
    };

    // Test string error - should catch and display error boundary
    expect(() => {
      render(
        <ErrorBoundary>
          <StringThrowComponent />
        </ErrorBoundary>
      );
    }).not.toThrow();

    // Test object error - should catch and display error boundary
    expect(() => {
      render(
        <ErrorBoundary>
          <ObjectThrowComponent />
        </ErrorBoundary>
      );
    }).not.toThrow();
  });

  it('should log error using errorHandler', () => {
    const ThrowComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowComponent />
      </ErrorBoundary>
    );

    expect(errorHandling.errorHandler.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
      }),
      'ErrorBoundary'
    );
  });
});
