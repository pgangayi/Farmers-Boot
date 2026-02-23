import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('should check page content and console errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    console.log('Navigating to http://localhost:5000');
    const response = await page.goto('http://localhost:5000', {
      timeout: 10000,
      waitUntil: 'networkidle',
    });

    console.log('Response status:', response?.status());
    console.log('Current URL:', page.url());

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    // Check console errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    }

    if (pageErrors.length > 0) {
      console.log('Page errors found:', pageErrors);
    }

    // Get page content
    const title = await page.title();
    console.log('Page title:', title);

    // Check for specific elements that should be in a React app
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Look for any content
    const bodyContent = await body.textContent();
    console.log('Body content length:', bodyContent?.length);
    console.log('Body content:', bodyContent?.substring(0, 500));

    // Check for common React root elements
    const reactRoot = page.locator('#root, [data-reactroot], [id*="root"], [class*="root"]');
    const hasReactRoot = await reactRoot.count();
    console.log('React root elements found:', hasReactRoot);

    // Check for any visible elements
    const visibleElements = await page.locator('*:visible').count();
    console.log('Visible elements count:', visibleElements);

    // Take screenshot for debugging
    await page.screenshot({
      path: 'test-results/debug-page.png',
      fullPage: true,
    });

    // Basic assertions
    expect(response?.status()).toBe(200);
    expect(title).toContain('Farmers');

    // Log results
    console.log('Test completed successfully');
  });
});
