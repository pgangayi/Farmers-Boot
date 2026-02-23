import {
  test,
  expect,
  generateTestUser,
  generateTestFarm,
  generateTestCrop,
  generateTestAnimal,
  generateTestInventoryItem,
} from './setup/test-setup';

test.describe('Complete User Journey - Farmers Boot', () => {
  test('Complete farm setup and management workflow', async ({ page }) => {
    // Step 1: Landing Page Navigation
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome to Farmers Boot');

    // Verify key features are displayed
    await expect(page.locator('text=Farm Management')).toBeVisible();
    await expect(page.locator('text=Livestock Management')).toBeVisible();
    await expect(page.locator('text=Crop Management')).toBeVisible();

    // Step 2: User Registration
    await page.click('[data-testid="signup-link"]');
    await expect(page.locator('h1')).toContainText('Sign Up');

    const testUser = generateTestUser();
    await page.fill('[data-testid="signup-name"]', testUser.name);
    await page.fill('[data-testid="signup-email"]', testUser.email);
    await page.fill('[data-testid="signup-password"]', testUser.password);
    await page.fill('[data-testid="signup-confirm-password"]', testUser.password);

    await page.click('[data-testid="signup-submit-button"]');

    // Step 3: Email Verification (mock)
    await page.waitForURL('**/verify-email');
    await page.click('[data-testid="resend-verification"]');

    // Step 4: Login after verification
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit-button"]');

    // Step 5: Dashboard - Welcome State (No Farms)
    await expect(page.locator('h2')).toContainText('Welcome to Your Farm Dashboard');
    await expect(page.locator("text=You don't have any farms yet")).toBeVisible();

    // Step 6: Create First Farm
    await page.click('[data-testid="add-first-farm"]');
    await page.waitForURL('**/farms');

    await page.click('[data-testid="add-farm-button"]');
    await page.fill('[data-testid="farm-name"]', 'My Test Farm');
    await page.fill('[data-testid="farm-location"]', 'Test Farm Location, USA');
    await page.fill('[data-testid="farm-size"]', '100');
    await page.selectOption('[data-testid="farm-type"]', 'mixed');

    await page.click('[data-testid="save-farm-button"]');

    // Step 7: Dashboard with Farm Data
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('My Test Farm');

    // Step 8: Create Field
    await page.click('[data-testid="fields-tab"]');
    await page.click('[data-testid="add-field-button"]');

    await page.fill('[data-testid="field-name"]', 'North Field');
    await page.fill('[data-testid="field-size"]', '50');
    await page.fill('[data-testid="field-soil-type"]', 'Loamy');
    await page.click('[data-testid="save-field-button"]');

    // Step 9: Add Crop
    await page.click('[data-testid="crops-tab"]');
    await page.click('[data-testid="add-crop-button"]');

    const testCrop = generateTestCrop('field-1');
    await page.fill('[data-testid="crop-name"]', testCrop.name);
    await page.selectOption('[data-testid="crop-variety"]', testCrop.variety);
    await page.fill('[data-testid="planting-date"]', testCrop.planting_date);
    await page.fill('[data-testid="expected-harvest"]', testCrop.expected_harvest);
    await page.selectOption('[data-testid="field-select"]', 'North Field');

    await page.click('[data-testid="save-crop-button"]');

    // Step 10: Add Animal
    await page.click('[data-testid="animals-tab"]');
    await page.click('[data-testid="add-animal-button"]');

    const testAnimal = generateTestAnimal();
    await page.fill('[data-testid="animal-name"]', testAnimal.name);
    await page.selectOption('[data-testid="animal-species"]', testAnimal.species);
    await page.fill('[data-testid="animal-breed"]', testAnimal.breed);
    await page.fill('[data-testid="identification-tag"]', testAnimal.identification_tag);
    await page.fill('[data-testid="acquisition-date"]', testAnimal.acquisition_date);

    await page.click('[data-testid="save-animal-button"]');

    // Step 11: Add Inventory Item
    await page.click('[data-testid="inventory-tab"]');
    await page.click('[data-testid="add-inventory-button"]');

    const testInventory = generateTestInventoryItem();
    await page.fill('[data-testid="item-name"]', testInventory.name);
    await page.selectOption('[data-testid="item-category"]', testInventory.category);
    await page.fill('[data-testid="item-quantity"]', testInventory.quantity.toString());
    await page.selectOption('[data-testid="item-unit"]', testInventory.unit);
    await page.fill('[data-testid="cost-per-unit"]', testInventory.cost_per_unit.toString());
    await page.fill('[data-testid="reorder-level"]', testInventory.reorder_level.toString());

    await page.click('[data-testid="save-inventory-button"]');

    // Step 12: Create Task
    await page.click('[data-testid="tasks-tab"]');
    await page.click('[data-testid="add-task-button"]');

    await page.fill('[data-testid="task-title"]', 'Irrigate North Field');
    await page.selectOption('[data-testid="task-priority"]', 'medium');
    await page.fill(
      '[data-testid="task-due-date"]',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    await page.fill(
      '[data-testid="task-description"]',
      'Check irrigation system and water North Field for 2 hours'
    );

    await page.click('[data-testid="save-task-button"]');

    // Step 13: Add Financial Transaction
    await page.click('[data-testid="finance-tab"]');
    await page.click('[data-testid="add-transaction-button"]');

    await page.selectOption('[data-testid="transaction-type"]', 'expense');
    await page.fill('[data-testid="transaction-amount"]', '500.00');
    await page.fill('[data-testid="transaction-description"]', 'Purchase of fertilizer');
    await page.selectOption('[data-testid="transaction-category"]', 'supplies');
    await page.fill('[data-testid="transaction-date"]', new Date().toISOString().split('T')[0]);

    await page.click('[data-testid="save-transaction-button"]');

    // Step 14: Verify Dashboard Stats
    await page.click('[data-testid="overview-tab"]');

    // Verify crop stats
    await expect(page.locator('[data-testid="crop-stats"]')).toContainText('1');
    await expect(page.locator('[data-testid="active-crops"]')).toContainText('1');

    // Verify animal stats
    await expect(page.locator('[data-testid="animal-stats"]')).toContainText('1');
    await expect(page.locator('[data-testid="active-animals"]')).toContainText('1');

    // Verify inventory stats
    await expect(page.locator('[data-testid="inventory-stats"]')).toContainText('1');

    // Verify task stats
    await expect(page.locator('[data-testid="task-stats"]')).toContainText('1');

    // Verify financial overview
    await expect(page.locator('[data-testid="financial-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-expenses"]')).toContainText('500');

    // Step 15: Test Search Functionality
    await page.fill('[data-testid="global-search"]', testCrop.name);
    await page.press('[data-testid="global-search"]', 'Enter');

    // Should find the crop in search results
    await expect(page.locator('[data-testid="search-results"]')).toContainText(testCrop.name);

    // Step 16: Test Notifications
    await page.click('[data-testid="notifications-button"]');
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();

    // Step 17: Test Settings
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('[data-testid="settings-panel"]')).toBeVisible();

    // Test profile update
    await page.fill('[data-testid="profile-name"]', 'Updated Name');
    await page.click('[data-testid="save-profile-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated');

    // Step 18: Test Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to landing page
    await page.waitForURL('**/');
    await expect(page.locator('h1')).toContainText('Welcome to Farmers Boot');

    // Step 19: Verify Login Persistence
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit-button"]');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('My Test Farm');
    await expect(page.locator('[data-testid="crop-stats"]')).toContainText('1');
  });

  test('Mobile responsive complete workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Complete workflow on mobile
    await page.goto('/');

    // Test mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

    // Test mobile signup
    await page.click('[data-testid="mobile-signup"]');
    await expect(page.locator('h1')).toContainText('Sign Up');

    const testUser = generateTestUser();
    await page.fill('[data-testid="signup-name"]', testUser.name);
    await page.fill('[data-testid="signup-email"]', testUser.email);
    await page.fill('[data-testid="signup-password"]', testUser.password);
    await page.fill('[data-testid="signup-confirm-password"]', testUser.password);

    await page.click('[data-testid="signup-submit-button"]');

    // Login on mobile
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit-button"]');

    // Test mobile dashboard
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-stats-grid"]')).toBeVisible();

    // Test mobile tab navigation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-tabs"]')).toBeVisible();

    // Navigate through mobile tabs
    await page.click('[data-testid="mobile-crops-tab"]');
    await expect(page.locator('[data-testid="mobile-crops-view"]')).toBeVisible();

    await page.click('[data-testid="mobile-animals-tab"]');
    await expect(page.locator('[data-testid="mobile-animals-view"]')).toBeVisible();

    await page.click('[data-testid="mobile-tasks-tab"]');
    await expect(page.locator('[data-testid="mobile-tasks-view"]')).toBeVisible();
  });

  test('Offline functionality test', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    // Test that the app works offline
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome to Farmers Boot');

    // Login with cached credentials
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit-button"]');

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Test offline data access
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('Working offline');

    // Restore connection
    await context.setOffline(false);

    // Should sync automatically
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-complete"]')).toContainText('Sync complete');
  });

  test('Accessibility compliance test', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Test ARIA labels
    await expect(page.locator('[aria-label="Get Started"]')).toBeVisible();
    await expect(page.locator('[aria-label="Sign In"]')).toBeVisible();

    // Test screen reader compatibility
    const landmarks = await page.locator('[role], [aria-label], [aria-labelledby]').count();
    expect(landmarks).toBeGreaterThan(0);

    // Test color contrast (basic check)
    await page.goto('/login');
    const loginButton = page.locator('[data-testid="login-submit-button"]');
    await expect(loginButton).toHaveCSS('background-color', /rgb\(\d+, \d+, \d+\)/);

    // Test focus management
    await page.focus('[data-testid="login-email"]');
    await expect(page.locator('[data-testid="login-email"]')).toBeFocused();

    // Test skip links
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('Performance and load test', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(3000);

    // Test large data handling
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit-button"]');

    // Simulate large dataset
    await page.evaluate(() => {
      // Mock large dataset
      window.mockLargeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 100,
      }));
    });

    // Test scrolling performance
    await page.evaluate(() => {
      const start = performance.now();
      window.scrollTo(0, document.body.scrollHeight);
      const end = performance.now();
      return end - start;
    });

    // Test memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Memory usage should be reasonable
    expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
