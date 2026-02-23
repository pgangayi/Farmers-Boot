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

// Basic test export
export const test = base;
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
