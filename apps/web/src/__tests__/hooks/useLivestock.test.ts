// @ts-nocheck
/**
 * ============================================================================
 * USE LIVESTOCK HOOK TESTS
 * ============================================================================
 * Test suite for the useLivestock custom hook
 * ============================================================================
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useLivestock,
  useCreateLivestock,
  useUpdateLivestock,
  useDeleteLivestock,
} from '../../api/hooks/useLivestock';
import { mockFarm, TestWrapper } from '../setup';

// Mock the Supabase auth
vi.mock('../../lib/supabase', () => ({
  getCurrentSession: vi.fn(() =>
    Promise.resolve({
      access_token: 'test-token',
      user: { id: 'test-user-id' },
    })
  ),
}));

// Mock data
const mockLivestockData = [
  {
    id: 'livestock-1',
    farm_id: mockFarm.id,
    tag_number: 'TAG001',
    breed: 'Angus',
    gender: 'female',
    birth_date: '2023-01-15',
    weight: 450,
    status: 'healthy',
    location: 'Pasture A',
    notes: 'Healthy animal',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
  },
  {
    id: 'livestock-2',
    farm_id: mockFarm.id,
    tag_number: 'TAG002',
    breed: 'Hereford',
    gender: 'male',
    birth_date: '2023-02-20',
    weight: 380,
    status: 'healthy',
    location: 'Pasture B',
    notes: 'Growing well',
    created_at: '2023-02-20T00:00:00Z',
    updated_at: '2023-02-20T00:00:00Z',
  },
];

describe('useLivestock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('fetchLivestock', () => {
    it('should fetch livestock data successfully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLivestockData),
      } as Response);

      const { result } = renderHook(() => useLivestock(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockLivestockData);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Database error' }),
      } as Response);

      const { result } = renderHook(() => useLivestock(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should filter by farm ID', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLivestockData),
      } as Response);

      renderHook(() => useLivestock(mockFarm.id), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`farm_id=eq.${mockFarm.id}`),
          expect.any(Object)
        );
      });
    });
  });

  describe('useCreateLivestock', () => {
    it('should add new livestock successfully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const newLivestock = {
        tag_number: 'TAG003',
        breed: 'Charolais',
        gender: 'female',
        birth_date: '2023-03-10',
        weight: 420,
        status: 'healthy' as const,
        location: 'Pasture C',
        notes: 'New addition',
        farm_id: mockFarm.id,
      };

      const expectedResponse = { ...newLivestock, id: 'new-id' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedResponse),
      } as Response);

      const { result } = renderHook(() => useCreateLivestock(), { wrapper: TestWrapper });
      await result.current.mutateAsync(newLivestock);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle add errors', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Insert failed' }),
      } as Response);

      const { result } = renderHook(() => useCreateLivestock(), { wrapper: TestWrapper });
      const newLivestock = {
        tag_number: 'TAG004',
        breed: 'Simmental',
        gender: 'male',
        birth_date: '2023-04-01',
        weight: 400,
        status: 'healthy' as const,
        location: 'Pasture D',
        notes: 'Test animal',
        farm_id: mockFarm.id,
      };

      await expect(result.current.mutateAsync(newLivestock)).rejects.toThrow();
    });
  });

  describe('useUpdateLivestock', () => {
    it('should update livestock successfully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      const updateData = {
        weight: 460,
        status: 'healthy' as const,
        notes: 'Weight updated',
      };

      const expectedResponse = { ...updateData, id: 'livestock-1' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expectedResponse),
      } as Response);

      const { result } = renderHook(() => useUpdateLivestock(), { wrapper: TestWrapper });
      await result.current.mutateAsync({ id: 'livestock-1', data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle update errors', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Update failed' }),
      } as Response);

      const { result } = renderHook(() => useUpdateLivestock(), { wrapper: TestWrapper });
      const updateData = { weight: 470 };

      await expect(
        result.current.mutateAsync({ id: 'livestock-1', data: updateData })
      ).rejects.toThrow();
    });
  });

  describe('useDeleteLivestock', () => {
    it('should delete livestock successfully', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as Response);

      const { result } = renderHook(() => useDeleteLivestock(), { wrapper: TestWrapper });
      await result.current.mutateAsync('livestock-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle delete errors', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Delete failed' }),
      } as Response);

      const { result } = renderHook(() => useDeleteLivestock(), { wrapper: TestWrapper });
      await expect(result.current.mutateAsync('livestock-1')).rejects.toThrow();
    });
  });

  describe('loading states', () => {
    it('should be in loading state initially', () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useLivestock(), { wrapper: TestWrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual(undefined);
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after fetch completes', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLivestockData),
      } as Response);

      const { result } = renderHook(() => useLivestock(), { wrapper: TestWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockLivestockData);
    });
  });
});
