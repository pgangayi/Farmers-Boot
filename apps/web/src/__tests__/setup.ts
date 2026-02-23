/**
 * ============================================================================
 * VITEST TEST SETUP
 * ============================================================================
 * Test configuration and utilities for Farmers-Boot application
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { vi, expect, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { createElement } from 'react';

// Configure testing-library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        then: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      in: vi.fn(() => ({
        then: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: vi.fn(() => ({
        range: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      range: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  auth: {
    signInWithPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: null, error: null })),
    updateUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    refreshSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ data: null, error: null })),
    signInWithOtp: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
      download: vi.fn(() => Promise.resolve({ data: null, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })),
      remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
};

// Mock Supabase module (single mock to avoid duplication)
vi.mock('../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  getCurrentSession: vi.fn(() =>
    Promise.resolve({
      access_token: 'test-token',
      user: mockUser,
    })
  ),
  signIn: vi.fn(() => Promise.resolve({ data: null, error: null })),
  signUp: vi.fn(() => Promise.resolve({ data: null, error: null })),
  signOut: vi.fn(() => Promise.resolve({ error: null })),
  getCurrentUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  resetPassword: vi.fn(() => Promise.resolve({ data: null, error: null })),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}));

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:8000');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('VITE_APP_URL', 'http://localhost:3000');
vi.stubEnv('VITE_API_URL', 'http://localhost:8787');

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch for API calls with realistic responses
global.fetch = vi.fn();

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
};

// ============================================================================
// TEST DATA
// ============================================================================

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    role: 'farmer',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  email_confirmed_at: '2024-01-01T00:00:00Z',
};

export const mockFarm = {
  id: 'test-farm-id',
  name: 'Test Farm',
  description: 'Test farm description',
  location: 'Test Location',
  owner_id: 'test-user-id',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockField = {
  id: 'test-field-id',
  farm_id: 'test-farm-id',
  name: 'Test Field',
  area_hectares: 10.5,
  crop_type: 'wheat',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockCrop = {
  id: 'test-crop-id',
  farm_id: 'test-farm-id',
  field_id: 'test-field-id',
  name: 'Test Crop',
  variety: 'Test Variety',
  status: 'growing',
  planting_date: '2024-01-01',
  expected_harvest_date: '2024-06-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockLivestock = {
  id: 'test-livestock-id',
  farm_id: 'test-farm-id',
  tag_number: 'TAG001',
  name: 'Test Animal',
  type: 'cattle',
  breed: 'Angus',
  status: 'active',
  health_status: 'healthy',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockTask = {
  id: 'test-task-id',
  farm_id: 'test-farm-id',
  title: 'Test Task',
  description: 'Test task description',
  priority: 'medium',
  status: 'pending',
  due_date: '2024-02-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockInventoryItem = {
  id: 'test-inventory-id',
  farm_id: 'test-farm-id',
  name: 'Test Item',
  category: 'seed',
  quantity: 100,
  unit: 'kg',
  status: 'in_stock',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockFinanceRecord = {
  id: 'test-finance-id',
  farm_id: 'test-farm-id',
  type: 'expense',
  category: 'supplies',
  description: 'Test expense',
  amount: 100.0,
  date: '2024-01-15',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

const customMatchers = {
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toBeValidUuid(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
};

// Extend Vitest matchers
expect.extend(customMatchers);

// Extend Vitest matchers type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeWithinRange(floor: number, ceiling: number): T;
      toBeValidUuid(): T;
    }
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
