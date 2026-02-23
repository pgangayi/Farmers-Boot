/**
 * ============================================================================
 * TEST SETUP AND UTILITIES
 * ============================================================================
 * Basic testing infrastructure for Farmers-Boot application
 * ============================================================================
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { vi } from 'vitest';

// ============================================================================
// TEST PROVIDERS
// ============================================================================

// Create a test query client
export const createTestQueryClient = () => {
  return new QueryClient({
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
};

// Test wrapper component
interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export const TestWrapper = ({ children, queryClient }: TestWrapperProps) => {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// ============================================================================
// MOCKS AND FIXTURES
// ============================================================================

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'farmer' as const,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock farm data
export const mockFarm = {
  id: 'test-farm-id',
  name: 'Test Farm',
  description: 'A test farm for testing',
  owner_id: 'test-user-id',
  area_hectares: 100,
  soil_type: 'loam',
  climate_zone: 'temperate',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock field data
export const mockField = {
  id: 'test-field-id',
  farm_id: 'test-farm-id',
  name: 'Test Field',
  area_hectares: 10,
  soil_type: 'loam',
  soil_ph: 6.5,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock crop data
export const mockCrop = {
  id: 'test-crop-id',
  name: 'Test Crop',
  variety: 'Test Variety',
  growing_season_days: 120,
  expected_yield_kg_per_hectare: 5000,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock task data
export const mockTask = {
  id: 'test-task-id',
  farm_id: 'test-farm-id',
  title: 'Test Task',
  description: 'A test task for testing',
  category: 'planting' as const,
  priority: 'medium' as const,
  status: 'pending' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

// Render with providers
export const renderWithProviders = (
  ui: ReactNode,
  { queryClient }: { queryClient?: QueryClient } = {}
) => {
  const testQueryClient = queryClient || createTestQueryClient();

  return render(ui, {
    wrapper: ({ children }) => <TestWrapper queryClient={testQueryClient}>{children}</TestWrapper>,
  });
};

// Wait for loading to finish
export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
};

// Mock API responses
export const createMockApiResponse = <T,>(data: T) => ({
  data,
  error: null,
  status: 200,
});

export const createMockErrorResponse = (message: string, status: number = 500) => ({
  data: null,
  error: message,
  status,
});

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

// Custom matcher to check if element is loading
export const toBeLoading = (received: HTMLElement) => {
  const pass =
    received.textContent === 'Loading...' ||
    received.getAttribute('aria-busy') === 'true' ||
    received.getAttribute('data-loading') === 'true';

  return {
    message: () => `expected element ${pass ? 'not ' : ''}to be loading`,
    pass,
  };
};

// Custom matcher to check if element has correct accessibility attributes
export const toBeAccessible = (received: HTMLElement) => {
  const hasLabel =
    received.getAttribute('aria-label') ||
    received.getAttribute('aria-labelledby') ||
    received.textContent?.trim();

  const pass = Boolean(hasLabel);

  return {
    message: () => `expected element ${pass ? 'not ' : ''}to be accessible`,
    pass,
  };
};

// ============================================================================
// MOCK FUNCTIONS
// ============================================================================

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  limit: vi.fn(() => mockSupabaseClient),
  range: vi.fn(() => mockSupabaseClient),
  gte: vi.fn(() => mockSupabaseClient),
  lte: vi.fn(() => mockSupabaseClient),
  in: vi.fn(() => mockSupabaseClient),
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
      createSignedUrl: vi.fn(),
    })),
  },
};

// Mock fetch for API calls
export const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================================================================
// TEST CONSTANTS
// ============================================================================

export const TEST_IDS = {
  loadingSpinner: 'loading-spinner',
  errorBoundary: 'error-boundary',
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',
  form: 'test-form',
  input: 'test-input',
  select: 'test-select',
  textarea: 'test-textarea',
};

export const TEST_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  farms: '/farms',
  fields: '/fields',
  crops: '/crops',
  tasks: '/tasks',
  livestock: '/livestock',
  inventory: '/inventory',
  finance: '/finance',
};

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

// Setup function for tests
export const setupTest = () => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Setup default mock responses
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200,
  });

  return {
    mockUser,
    mockFarm,
    mockField,
    mockCrop,
    mockTask,
    mockSupabaseClient,
    mockFetch,
  };
};

// Cleanup function for tests
export const cleanupTest = () => {
  vi.restoreAllMocks();
};

// ============================================================================
// EXAMPLE TESTS
// ============================================================================

// Example test structure
export const exampleTest = async () => {
  setupTest();

  // Your test code here

  cleanupTest();
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Providers
  TestWrapper,
  createTestQueryClient,
  renderWithProviders,

  // Mocks
  mockUser,
  mockFarm,
  mockField,
  mockCrop,
  mockTask,
  mockSupabaseClient,
  mockFetch,

  // Utilities
  createMockApiResponse,
  createMockErrorResponse,
  waitForLoadingToFinish,

  // Setup
  setupTest,
  cleanupTest,

  // Constants
  TEST_IDS,
  TEST_ROUTES,
};
