import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Test data fixtures
export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'farmer' | 'admin' | 'worker';
}

export interface TestFarm {
  name: string;
  location: string;
  size: number;
  type: 'crop' | 'livestock' | 'mixed';
}

export interface TestCrop {
  name: string;
  variety: string;
  planting_date: string;
  expected_harvest: string;
  field_id: string;
}

export interface TestAnimal {
  name: string;
  species: string;
  breed: string;
  identification_tag: string;
  acquisition_date: string;
}

export interface TestInventoryItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  reorder_level: number;
}

// Custom test fixture with authenticated user
export const test = base.extend({
  // Define testUser fixture
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: 'test.farmer@farmersboot.com',
      password: 'TestPassword123!',
      name: 'Test Farmer',
      role: 'farmer',
    };
    await use(user);
  },

  // Define testFarm fixture
  testFarm: async ({}, use) => {
    const farm: TestFarm = {
      name: 'Test Farm',
      location: 'Test Location, USA',
      size: 100,
      type: 'mixed',
    };
    await use(farm);
  },

  // Define authenticatedPage fixture
  authenticatedPage: async ({ page, testUser }, use) => {
    // Login the test user
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit-button"]');

    // Wait for successful login - redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify we're logged in
    await expect(page.locator('h1')).toContainText('Select Farm');

    await use(page);
  },

  // Define adminPage fixture
  adminPage: async ({ browser }, use) => {
    const adminUser: TestUser = {
      email: 'admin@farmersboot.com',
      password: 'AdminPassword123!',
      name: 'Admin User',
      role: 'admin',
    };

    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit-button"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';

// Helper functions for test data generation
export function generateTestUser(role: TestUser['role'] = 'farmer'): TestUser {
  const timestamp = Date.now();
  return {
    email: `test.${role}.${timestamp}@farmersboot.com`,
    password: 'TestPassword123!',
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    role,
  };
}

export function generateTestFarm(): TestFarm {
  const timestamp = Date.now();
  return {
    name: `Test Farm ${timestamp}`,
    location: `Test Location ${timestamp}, USA`,
    size: Math.floor(Math.random() * 500) + 50,
    type: ['crop', 'livestock', 'mixed'][Math.floor(Math.random() * 3)] as TestFarm['type'],
  };
}

export function generateTestCrop(_fieldId: string): TestCrop {
  const timestamp = Date.now();
  return {
    name: `Test Crop ${timestamp}`,
    variety: 'Test Variety',
    planting_date: new Date().toISOString().split('T')[0],
    expected_harvest: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    field_id: _fieldId,
  };
}

export function generateTestAnimal(): TestAnimal {
  const timestamp = Date.now();
  return {
    name: `Test Animal ${timestamp}`,
    species: 'Cattle',
    breed: 'Angus',
    identification_tag: `TAG${timestamp}`,
    acquisition_date: new Date().toISOString().split('T')[0],
  };
}

export function generateTestInventoryItem(): TestInventoryItem {
  const timestamp = Date.now();
  return {
    name: `Test Item ${timestamp}`,
    category: 'Feed',
    quantity: 100,
    unit: 'kg',
    cost_per_unit: 2.5,
    reorder_level: 20,
  };
}

// Common test utilities
export async function waitForPageLoad(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function takeScreenshotOnFailure(page: Page, testName: string): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${testName}-failure.png`,
    fullPage: true,
  });
}

export async function fillForm(page: Page, formData: Record<string, string>): Promise<void> {
  for (const [selector, value] of Object.entries(formData)) {
    await page.fill(selector, value);
  }
}

export async function verifyElementVisible(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}

export async function verifyElementText(page: Page, selector: string, text: string): Promise<void> {
  await expect(page.locator(selector)).toContainText(text);
}

export async function clickAndWait(
  page: Page,
  selector: string,
  waitForSelector?: string
): Promise<void> {
  await page.click(selector);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 5000 });
  }
}

// Mobile viewport helper
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 375, height: 667 });
}

// Tablet viewport helper
export async function setTabletViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 768, height: 1024 });
}

// Desktop viewport helper
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
}
