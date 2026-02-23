import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for comprehensive E2E testing
 * Optimized for 100% coverage across all user flows
 */

export default defineConfig({
  testDir: './e2e',

  // Run tests in files in parallel for maximum efficiency
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only for flaky tests
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for resource management
  workers: process.env.CI ? 1 : undefined,

  // Comprehensive reporting for coverage analysis
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'], // For detailed test output
    ['list'], // For test inventory
  ],

  // Enhanced test configuration for comprehensive coverage
  use: {
    // Base URL for all tests
    baseURL: process.env.PW_BASE_URL || 'http://localhost:5000',

    // Collect trace when retrying the failed test for debugging
    trace: 'retain-on-failure',

    // Take screenshot on failure for visual debugging
    screenshot: 'only-on-failure',

    // Record video on failure for comprehensive debugging
    video: 'retain-on-failure',

    // Ignore HTTPS errors in development environment
    ignoreHTTPSErrors: true,

    // Extended timeouts for comprehensive testing
    actionTimeout: 15000,
    navigationTimeout: 20000,

    // Enhanced viewport configuration for responsive testing
    viewport: { width: 1280, height: 720 },

    // Enhanced user agent for better browser compatibility
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Farmers-Boot-E2E/1.0.0',

    // Enhanced locale and timezone for consistent testing
    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Enhanced color scheme for consistent visual testing
    colorScheme: 'light',

    // Reduced motion for accessibility testing
    reducedMotion: 'reduce',
  },

  // Comprehensive browser and device coverage
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enhanced Chrome configuration
        contextOptions: {
          permissions: ['camera', 'microphone', 'geolocation'],
          geolocation: { latitude: 40.7128, longitude: -74.006 },
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox-specific configuration
        contextOptions: {
          permissions: ['camera', 'microphone', 'geolocation'],
          geolocation: { latitude: 40.7128, longitude: -74.006 },
        },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        // Safari-specific configuration
        contextOptions: {
          permissions: ['camera', 'microphone', 'geolocation'],
          geolocation: { latitude: 40.7128, longitude: -74.006 },
        },
      },
    },

    // Mobile devices for responsive testing
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Mobile-specific configuration
        contextOptions: {
          permissions: ['camera', 'microphone', 'geolocation'],
          geolocation: { latitude: 40.7128, longitude: -74.006 },
          // Mobile viewport
          viewport: { width: 393, height: 851 },
        },
      },
      testMatch: '**/mobile-*.spec.ts',
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        // Mobile Safari configuration
        contextOptions: {
          permissions: ['camera', 'microphone', 'geolocation'],
          geolocation: { latitude: 40.7128, longitude: -74.006 },
          viewport: { width: 390, height: 844 },
        },
      },
      testMatch: '**/mobile-*.spec.ts',
    },

    // Tablet devices for tablet testing
    {
      name: 'iPad',
      use: {
        ...devices['iPad Pro'],
        // Tablet configuration
        contextOptions: {
          permissions: ['camera', 'microphone', 'geolocation'],
          geolocation: { latitude: 40.7128, longitude: -74.006 },
          viewport: { width: 1024, height: 1366 },
        },
      },
      testMatch: '**/tablet-*.spec.ts',
    },

    // High-DPI displays for visual testing
    {
      name: 'High DPI',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
      },
      testMatch: '**/visual-*.spec.ts',
    },

    // Dark mode testing
    {
      name: 'Dark Mode',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      },
      testMatch: '**/dark-mode-*.spec.ts',
    },

    // Accessibility testing
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        reducedMotion: 'reduce',
        forcedColors: 'active',
      },
      testMatch: '**/accessibility-*.spec.ts',
    },
  ],

  // Global test configuration
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  // Test timeout configuration
  timeout: 60000,

  // Expect timeout configuration
  expect: {
    timeout: 10000,
  },

  // Output directory configuration
  outputDir: 'test-results',

  // Web server configuration for local development
  webServer: {
    command: 'cd .. && npm run start:e2e',
    port: 5000,
    reuseExistingServer: !process.env.CI,
    timeout: 2 * 60 * 1000, // 2 minutes
  },

  // Metadata configuration for test organization
  metadata: {
    'test-environment': process.env.NODE_ENV || 'development',
    'test-type': 'e2e',
    'coverage-target': '100%',
    'browser-coverage': ['chromium', 'firefox', 'webkit'],
    'device-coverage': ['desktop', 'mobile', 'tablet'],
  },

  // Enhanced grep configuration for selective test execution
  grep: {
    // Enable grep for selective test execution
    invert: false,
    // Case-insensitive search by default
    grepInvert: false,
  },

  // Maximum test failures for CI
  maxFailures: process.env.CI ? 10 : 50,

  // Update snapshots automatically in development
  updateSnapshots: !process.env.CI,

  // Global setup for test data
  globalSetup: [
    './e2e/setup/test-data-setup.ts',
    './e2e/setup/database-setup.ts',
    './e2e/setup/mock-server-setup.ts',
  ],

  // Global teardown for cleanup
  globalTeardown: [
    './e2e/teardown/test-data-cleanup.ts',
    './e2e/teardown/database-cleanup.ts',
    './e2e/teardown/mock-server-cleanup.ts',
  ],
});
