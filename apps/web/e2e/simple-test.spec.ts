import { test, expect } from '@playwright/test';

test.describe('Simple Tests', () => {
  test('should connect to localhost', async ({ page }) => {
    console.log('Attempting to connect to:', 'http://localhost:3000');

    try {
      const response = await page.goto('http://localhost:3000', { timeout: 5000 });
      console.log('Response status:', response?.status());
      console.log('Current URL after navigation:', page.url());

      // Take screenshot
      await page.screenshot({ path: 'test-results/simple-page.png' });

      // Get page content
      const title = await page.title();
      console.log('Page title:', title);

      const bodyText = await page.locator('body').textContent();
      console.log('Body text (first 200 chars):', bodyText?.substring(0, 200));

      // Check if we have any content
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  });
});
