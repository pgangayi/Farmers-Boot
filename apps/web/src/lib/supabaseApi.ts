/**
 * HTTP API Client for Backend Communication
 * Provides methods for making REST API calls to the backend
 * Enhanced with proper error handling and context preservation
 */

import { getCurrentSession } from './supabase';

// Get API URL from environment
import { requiredEnv } from '../utils/env';

const API_URL = requiredEnv('VITE_API_URL');

// Reusable error message constant
const REQUEST_FAILED_MESSAGE = 'Request failed';
const PGRST_OBJECT_ACCEPT = 'application/vnd.pgrst.object+json';

/**
 * Custom API Error class with context preservation
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;
  public readonly details: unknown;
  public readonly timestamp: string;

  constructor(message: string, statusCode: number, endpoint: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a network error
   */
  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  /**
   * Check if error is an authentication error
   */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * Check if error is a not found error
   */
  get isNotFoundError(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if error is a validation error
   */
  get isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  /**
   * Check if error is a server error
   */
  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    if (this.isNetworkError) {
      return 'Network error. Please check your connection.';
    }
    if (this.isAuthError) {
      return 'You are not authorized to perform this action.';
    }
    if (this.isNotFoundError) {
      return 'The requested resource was not found.';
    }
    if (this.isValidationError) {
      return 'Please check your input and try again.';
    }
    if (this.isServerError) {
      return 'Server error. Please try again later.';
    }
    return this.message || 'An unexpected error occurred.';
  }
}

/**
 * Parse error response from API
 */
async function parseErrorResponse(response: Response, endpoint: string): Promise<ApiError> {
  let details: unknown = null;
  let message = REQUEST_FAILED_MESSAGE;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      details = errorData;

      // Extract message from various error formats
      if (typeof errorData === 'object' && errorData !== null) {
        const errorObj = errorData as Record<string, unknown>;
        message =
          (errorObj.message as string) ||
          (errorObj.error as string) ||
          (errorObj.detail as string) ||
          (errorObj.msg as string) ||
          REQUEST_FAILED_MESSAGE;
      }
    } else {
      const textError = await response.text();
      if (textError) {
        details = textError;
        message = textError.substring(0, 200); // Limit message length
      }
    }
  } catch {
    // Failed to parse error response, use default message
    details = null;
  }

  return new ApiError(message, response.status, endpoint, details);
}

/**
 * Get auth headers for requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getCurrentSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  let url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const paramString = searchParams.toString();
    if (paramString) {
      url += (url.includes('?') ? '&' : '?') + paramString;
    }
  }

  return url;
}

/**
 * HTTP API Client for backend communication
 */
export const apiClient = {
  /**
   * Perform GET request
   */
  async get<T>(
    endpoint: string,
    options: { single?: boolean; params?: Record<string, unknown> } = {}
  ): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = buildUrl(endpoint, options.params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authHeaders as Record<string, string>),
    };

    if (options.single) {
      headers['Accept'] = PGRST_OBJECT_ACCEPT;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, endpoint);
    }

    return response.json();
  },

  /**
   * Perform POST request
   */
  async post<T>(endpoint: string, data?: unknown, options: { single?: boolean } = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authHeaders as Record<string, string>),
    };

    if (options.single) {
      headers['Prefer'] = 'return=representation';
      headers['Accept'] = PGRST_OBJECT_ACCEPT;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, endpoint);
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  },

  /**
   * Perform PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options: { single?: boolean } = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authHeaders as Record<string, string>),
    };

    if (options.single) {
      headers['Prefer'] = 'return=representation';
      headers['Accept'] = PGRST_OBJECT_ACCEPT;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, endpoint);
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  },

  /**
   * Perform PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, options: { single?: boolean } = {}): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authHeaders as Record<string, string>),
    };

    if (options.single) {
      headers['Prefer'] = 'return=representation';
      headers['Accept'] = PGRST_OBJECT_ACCEPT;
    }

    const response = await fetch(`${API_URL}${url}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, endpoint);
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  },

  /**
   * Perform DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const authHeaders = await getAuthHeaders();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authHeaders as Record<string, string>),
    };

    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw await parseErrorResponse(response, endpoint);
    }

    // Handle empty response
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  },
};

/**
 * Helper function to safely make API calls with error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { data: null, error };
    }
    // Wrap unknown errors
    const apiError = new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      0,
      'unknown',
      error
    );
    return { data: null, error: apiError };
  }
}
