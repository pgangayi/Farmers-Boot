import { test, expect } from './setup/test-setup-simple';

test.describe('Basic Application Tests', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/');

    // Check if we can see the login page or are redirected
    const url = page.url();
    console.log('Current URL:', url);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/login-page.png' });

    // Look for common login elements
    const loginForm = page.locator('form').first();
    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[placeholder*="email"]')
      .first();
    const passwordInput = page
      .locator('input[type="password"], input[name="password"], input[placeholder*="password"]')
      .first();

    // Check if any login-related elements are visible
    const hasLoginForm = await loginForm.isVisible().catch(() => false);
    const hasEmailInput = await emailInput.isVisible().catch(() => false);
    const hasPasswordInput = await passwordInput.isVisible().catch(() => false);

    console.log('Has login form:', hasLoginForm);
    console.log('Has email input:', hasEmailInput);
    console.log('Has password input:', hasPasswordInput);

    // At least one of these should be present
    expect(hasLoginForm || hasEmailInput || hasPasswordInput).toBeTruthy();
  });

  test('should show page content', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if page has any content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/page-content.png' });
  });
});
