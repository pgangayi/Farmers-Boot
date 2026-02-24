/**
 * ============================================================================
 * API CLIENT TESTS
 * ============================================================================
 * Tests for the HTTP API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError, safeApiCall } from '../lib/supabaseApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock getCurrentSession
vi.mock('../lib/supabase', () => ({
  getCurrentSession: vi.fn(() => Promise.resolve({ access_token: 'test-token' })),
}));

describe('ApiError', () => {
  it('should create an ApiError with all properties', () => {
    const error = new ApiError('Test error', 404, '/test', { detail: 'Not found' });

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(404);
    expect(error.endpoint).toBe('/test');
    expect(error.details).toEqual({ detail: 'Not found' });
    expect(error.name).toBe('ApiError');
  });

  it('should correctly identify network errors', () => {
    const error = new ApiError('Network failed', 0, '/test');
    expect(error.isNetworkError).toBe(true);
  });

  it('should correctly identify auth errors', () => {
    const error401 = new ApiError('Unauthorized', 401, '/test');
    const error403 = new ApiError('Forbidden', 403, '/test');

    expect(error401.isAuthError).toBe(true);
    expect(error403.isAuthError).toBe(true);
  });

  it('should correctly identify not found errors', () => {
    const error = new ApiError('Not found', 404, '/test');
    expect(error.isNotFoundError).toBe(true);
  });

  it('should correctly identify validation errors', () => {
    const error400 = new ApiError('Bad request', 400, '/test');
    const error422 = new ApiError('Unprocessable', 422, '/test');

    expect(error400.isValidationError).toBe(true);
    expect(error422.isValidationError).toBe(true);
  });

  it('should correctly identify server errors', () => {
    const error500 = new ApiError('Server error', 500, '/test');
    const error503 = new ApiError('Service unavailable', 503, '/test');

    expect(error500.isServerError).toBe(true);
    expect(error503.isServerError).toBe(true);
  });

  it('should return user-friendly messages', () => {
    const networkError = new ApiError('Network failed', 0, '/test');
    expect(networkError.getUserMessage()).toBe('Network error. Please check your connection.');

    const authError = new ApiError('Unauthorized', 401, '/test');
    expect(authError.getUserMessage()).toBe('You are not authorized to perform this action.');

    const notFoundError = new ApiError('Not found', 404, '/test');
    expect(notFoundError.getUserMessage()).toBe('The requested resource was not found.');

    const serverError = new ApiError('Server error', 500, '/test');
    expect(serverError.getUserMessage()).toBe('Server error. Please try again later.');
  });
});

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.get('/test');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include auth header when session exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.get('/test');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe('Bearer test-token');
    });

    it('should handle query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.get('/test', { params: { page: 1, limit: 10 } });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });

    it('should throw ApiError on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    });
  });

  describe('POST requests', () => {
    it('should make a successful POST request with data', async () => {
      const mockData = { id: 1, name: 'Created' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.post('/test', { name: 'Test' });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      const result = await apiClient.post('/test');

      expect(result).toEqual({});
    });
  });

  describe('PUT requests', () => {
    it('should make a successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.put('/test/1', { name: 'Updated' });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('PATCH requests', () => {
    it('should make a successful PATCH request', async () => {
      const mockData = { id: 1, name: 'Patched' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.patch('/test/1', { name: 'Patched' });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make a successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.delete('/test/1');

      expect(result).toEqual({});
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});

describe('safeApiCall', () => {
  it('should return data on successful call', async () => {
    const mockData = { id: 1, name: 'Test' };

    const result = await safeApiCall(() => Promise.resolve(mockData));

    expect(result).toEqual({ data: mockData, error: null });
  });

  it('should return error on failed call', async () => {
    const error = new ApiError('Test error', 500, '/test');

    const result = await safeApiCall(() => Promise.reject(error));

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(ApiError);
    expect(result.error?.message).toBe('Test error');
  });

  it('should wrap non-ApiError errors', async () => {
    const result = await safeApiCall(() => Promise.reject(new Error('Unknown error')));

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(ApiError);
    expect(result.error?.statusCode).toBe(0);
  });
});
