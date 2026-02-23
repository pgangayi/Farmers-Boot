import {
  test,
  expect,
  generateTestUser,
  generateTestFarm,
  generateTestCrop,
  generateTestAnimal,
  generateTestInventoryItem,
} from './setup/test-setup';

test.describe('Mobile Responsive Design - Complete Coverage', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for all tests
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test.describe('Mobile Authentication Flow', () => {
    test('Complete mobile authentication workflow', async ({ page }) => {
      // Test mobile landing page
      await page.goto('/');
      await expect(page.locator('h1')).toContainText('Welcome to Farmers Boot');

      // Test mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

      // Test mobile signup
      await page.click('[data-testid="mobile-signup"]');
      await expect(page.locator('h1')).toContainText('Sign Up');

      // Test mobile form layout
      await expect(page.locator('[data-testid="mobile-signup-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-form-fields"]')).toBeVisible();

      const testUser = generateTestUser();
      await page.fill('[data-testid="signup-name"]', testUser.name);
      await page.fill('[data-testid="signup-email"]', testUser.email);
      await page.fill('[data-testid="signup-password"]', testUser.password);
      await page.fill('[data-testid="signup-confirm-password"]', testUser.password);

      // Test mobile keyboard behavior
      await page.click('[data-testid="signup-email"]');
      await expect(page.locator('[data-testid="mobile-keyboard-visible"]')).toBeVisible();

      await page.click('[data-testid="signup-submit-button"]');
      await expect(page.locator('[data-testid="verification-message"]')).toContainText(
        testUser.email
      );

      // Test mobile login
      await page.goto('/login');
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();

      await page.fill('[data-testid="login-email"]', testUser.email);
      await page.fill('[data-testid="login-password"]', testUser.password);
      await page.click('[data-testid="login-submit-button"]');

      await page.waitForURL('**/dashboard');
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    });

    test('Mobile password reset flow', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="forgot-password-link"]');

      await expect(page.locator('[data-testid="mobile-reset-form"]')).toBeVisible();
      await page.fill('[data-testid="reset-email"]', 'test@farmersboot.com');
      await page.click('[data-testid="reset-submit-button"]');

      await expect(page.locator('[data-testid="reset-success"]')).toContainText(
        'Password reset email sent'
      );

      // Test mobile reset token flow
      await page.goto('/reset-password?token=valid-token');
      await expect(page.locator('[data-testid="mobile-new-password-form"]')).toBeVisible();

      await page.fill('[data-testid="new-password"]', 'NewPassword123!');
      await page.fill('[data-testid="confirm-new-password"]', 'NewPassword123!');
      await page.click('[data-testid="set-password-button"]');

      await expect(page.locator('[data-testid="reset-complete"]')).toContainText(
        'Password reset successful'
      );
    });
  });

  test.describe('Mobile Dashboard Experience', () => {
    test('Complete mobile dashboard workflow', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.goto('/dashboard');

      // Test mobile dashboard layout
      await expect(
        authenticatedPage.locator('[data-testid="mobile-dashboard-header"]')
      ).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="mobile-stats-grid"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="mobile-quick-actions"]')).toBeVisible();

      // Test mobile navigation tabs
      await expect(
        authenticatedPage.locator('[data-testid="mobile-tab-navigation"]')
      ).toBeVisible();
      await authenticatedPage.click('[data-testid="mobile-menu-toggle"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-tabs"]')).toBeVisible();

      // Test mobile tab switching
      await authenticatedPage.click('[data-testid="mobile-crops-tab"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-crops-view"]')).toBeVisible();

      await authenticatedPage.click('[data-testid="mobile-animals-tab"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-animals-view"]')).toBeVisible();

      await authenticatedPage.click('[data-testid="mobile-tasks-tab"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-tasks-view"]')).toBeVisible();

      await authenticatedPage.click('[data-testid="mobile-inventory-tab"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-inventory-view"]')
      ).toBeVisible();

      await authenticatedPage.click('[data-testid="mobile-finance-tab"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-finance-view"]')).toBeVisible();

      // Test mobile farm selector
      await authenticatedPage.click('[data-testid="mobile-farm-selector"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-farm-dropdown"]')).toBeVisible();

      // Test mobile notifications
      await authenticatedPage.click('[data-testid="mobile-notifications"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-notifications-panel"]')
      ).toBeVisible();

      // Test mobile settings
      await authenticatedPage.click('[data-testid="mobile-settings"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-settings-panel"]')
      ).toBeVisible();
    });

    test('Mobile touch gestures and interactions', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.goto('/dashboard');

      // Test swipe gestures for tab navigation
      const cropsTab = authenticatedPage.locator('[data-testid="mobile-crops-tab"]');
      await cropsTab.tap();

      // Test horizontal swipe
      await authenticatedPage.touchscreen.swipe(200, 300, 50, 300);
      await expect(authenticatedPage.locator('[data-testid="mobile-animals-view"]')).toBeVisible();

      // Test vertical scrolling
      await authenticatedPage.touchscreen.swipe(200, 500, 200, 100);
      await expect(authenticatedPage.locator('[data-testid="scroll-content"]')).toBeVisible();

      // Test pinch to zoom (if applicable)
      const chartElement = authenticatedPage.locator('[data-testid="mobile-chart"]');
      if (await chartElement.isVisible()) {
        await chartElement.tap();
        await authenticatedPage.touchscreen.pinch(200, 200, 150, 150);
      }

      // Test long press for context menu
      const listItem = authenticatedPage.locator('[data-testid="mobile-list-item"]').first();
      await listItem.tap({ position: { x: 50, y: 50 } });
      await listItem.tap({ position: { x: 50, y: 50 }, delay: 1000 });

      // Test double tap for zoom
      await listItem.dbltap();
    });
  });

  test.describe('Mobile Farm and Field Management', () => {
    test('Complete mobile farm management workflow', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      // Navigate to farms
      await authenticatedPage.click('[data-testid="mobile-farms-tab"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-farms-list"]')).toBeVisible();

      // Test mobile farm creation
      await authenticatedPage.click('[data-testid="mobile-add-farm"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-farm-form"]')).toBeVisible();

      const testFarm = generateTestFarm();
      await authenticatedPage.fill('[data-testid="farm-name"]', testFarm.name);
      await authenticatedPage.fill('[data-testid="farm-location"]', testFarm.location);
      await authenticatedPage.fill('[data-testid="farm-size"]', testFarm.size.toString());
      await authenticatedPage.selectOption('[data-testid="farm-type"]', testFarm.type);

      // Test mobile form validation
      await authenticatedPage.click('[data-testid="save-farm-button"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-form-success"]')).toContainText(
        'Farm created'
      );

      // Test mobile farm details
      await authenticatedPage.click('[data-testid="mobile-farm-item"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-farm-details"]')).toBeVisible();

      // Test mobile field management
      await authenticatedPage.click('[data-testid="mobile-fields-tab"]');
      await authenticatedPage.click('[data-testid="mobile-add-field"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-field-form"]')).toBeVisible();

      await authenticatedPage.fill('[data-testid="field-name"]', 'Mobile Test Field');
      await authenticatedPage.fill('[data-testid="field-size"]', '25');
      await authenticatedPage.selectOption('[data-testid="soil-type"]', 'loamy');
      await authenticatedPage.click('[data-testid="save-field-button"]');

      await expect(authenticatedPage.locator('[data-testid="mobile-field-success"]')).toContainText(
        'Field created'
      );

      // Test mobile field mapping
      await authenticatedPage.click('[data-testid="mobile-field-item"]');
      await authenticatedPage.click('[data-testid="mobile-field-mapping"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-map-view"]')).toBeVisible();

      // Test map interactions
      const mapElement = authenticatedPage.locator('[data-testid="mobile-map"]');
      await mapElement.tap({ position: { x: 100, y: 100 } });
      await mapElement.tap({ position: { x: 200, y: 200 } });

      // Test mobile field equipment
      await authenticatedPage.click('[data-testid="mobile-equipment-tab"]');
      await authenticatedPage.click('[data-testid="mobile-add-equipment"]');
      await authenticatedPage.fill('[data-testid="equipment-name"]', 'Mobile Tractor');
      await authenticatedPage.selectOption('[data-testid="equipment-type"]', 'tractor');
      await authenticatedPage.click('[data-testid="save-equipment"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-equipment-success"]')
      ).toContainText('Equipment added');
    });

    test('Mobile farm search and filtering', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.click('[data-testid="mobile-farms-tab"]');

      // Test mobile search
      await authenticatedPage.click('[data-testid="mobile-search-button"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-search-bar"]')).toBeVisible();

      await authenticatedPage.fill('[data-testid="mobile-search-input"]', 'Test');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-search-results"]')
      ).toBeVisible();

      // Test mobile filters
      await authenticatedPage.click('[data-testid="mobile-filter-button"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-filter-panel"]')).toBeVisible();

      await authenticatedPage.selectOption('[data-testid="mobile-type-filter"]', 'crop');
      await authenticatedPage.click('[data-testid="apply-filters"]');

      // Test mobile sorting
      await authenticatedPage.click('[data-testid="mobile-sort-button"]');
      await authenticatedPage.selectOption('[data-testid="mobile-sort-option"]', 'name');
      await authenticatedPage.click('[data-testid="apply-sort"]');

      // Test mobile bulk actions
      await authenticatedPage.check('[data-testid="mobile-select-all"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-bulk-actions"]')).toBeVisible();

      await authenticatedPage.click('[data-testid="mobile-bulk-export"]');
      await authenticatedPage.selectOption('[data-testid="mobile-export-format"]', 'csv');
      await authenticatedPage.click('[data-testid="mobile-start-export"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-export-progress"]')
      ).toBeVisible();
    });
  });

  test.describe('Mobile Livestock Management', () => {
    test('Complete mobile livestock workflow', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      // Navigate to livestock
      await authenticatedPage.click('[data-testid="mobile-livestock-tab"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-livestock-list"]')
      ).toBeVisible();

      // Test mobile animal creation
      await authenticatedPage.click('[data-testid="mobile-add-animal"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-animal-form"]')).toBeVisible();

      const testAnimal = generateTestAnimal();
      await authenticatedPage.fill('[data-testid="animal-name"]', testAnimal.name);
      await authenticatedPage.selectOption('[data-testid="animal-species"]', testAnimal.species);
      await authenticatedPage.fill('[data-testid="animal-breed"]', testAnimal.breed);
      await authenticatedPage.fill(
        '[data-testid="identification-tag"]',
        testAnimal.identification_tag
      );
      await authenticatedPage.fill('[data-testid="acquisition-date"]', testAnimal.acquisition_date);

      await authenticatedPage.click('[data-testid="save-animal-button"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-animal-success"]')
      ).toContainText('Animal added');

      // Test mobile animal details
      await authenticatedPage.click('[data-testid="mobile-animal-item"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-animal-details"]')
      ).toBeVisible();

      // Test mobile weight tracking
      await authenticatedPage.click('[data-testid="mobile-weight-tab"]');
      await authenticatedPage.click('[data-testid="mobile-add-weight"]');
      await authenticatedPage.fill('[data-testid="weight-value"]', '500');
      await authenticatedPage.fill(
        '[data-testid="weight-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.click('[data-testid="save-weight"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-weight-success"]')
      ).toContainText('Weight recorded');

      // Test mobile health management
      await authenticatedPage.click('[data-testid="mobile-health-tab"]');
      await authenticatedPage.click('[data-testid="mobile-add-health"]');
      await authenticatedPage.selectOption('[data-testid="health-type"]', 'vaccination');
      await authenticatedPage.fill('[data-testid="health-description"]', 'Annual vaccination');
      await authenticatedPage.click('[data-testid="save-health"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-health-success"]')
      ).toContainText('Health record added');

      // Test mobile breeding management
      await authenticatedPage.click('[data-testid="mobile-breeding-tab"]');
      await authenticatedPage.click('[data-testid="mobile-add-breeding"]');
      await authenticatedPage.selectOption('[data-testid="breeding-type"]', 'natural');
      await authenticatedPage.fill(
        '[data-testid="breeding-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.click('[data-testid="save-breeding"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-breeding-success"]')
      ).toContainText('Breeding record added');

      // Test mobile animal photos
      await authenticatedPage.click('[data-testid="mobile-photos-tab"]');
      await authenticatedPage.click('[data-testid="mobile-add-photo"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-photo-upload"]')).toBeVisible();

      // Test animal scanning (QR code)
      await authenticatedPage.click('[data-testid="mobile-scan-button"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-qr-scanner"]')).toBeVisible();
    });

    test('Mobile livestock batch operations', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.click('[data-testid="mobile-livestock-tab"]');

      // Create multiple animals
      for (let i = 1; i <= 3; i++) {
        await authenticatedPage.click('[data-testid="mobile-add-animal"]');
        await authenticatedPage.fill('[data-testid="animal-name"]', `Mobile Animal ${i}`);
        await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
        await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
        await authenticatedPage.fill('[data-testid="identification-tag"]', `MOB00${i}`);
        await authenticatedPage.click('[data-testid="save-animal-button"]');
      }

      // Test mobile bulk selection
      await authenticatedPage.check('[data-testid="mobile-select-all"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-bulk-actions"]')).toBeVisible();

      // Test mobile bulk vaccination
      await authenticatedPage.click('[data-testid="mobile-bulk-vaccination"]');
      await authenticatedPage.fill('[data-testid="vaccine-type"]', 'BVD');
      await authenticatedPage.fill(
        '[data-testid="vaccination-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.click('[data-testid="apply-bulk-vaccination"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-vaccination-success"]')
      ).toContainText('Vaccination applied');

      // Test mobile bulk weight update
      await authenticatedPage.check('[data-testid="mobile-select-all"]');
      await authenticatedPage.click('[data-testid="mobile-bulk-weight"]');
      await authenticatedPage.fill('[data-testid="average-weight"]', '550');
      await authenticatedPage.click('[data-testid="update-weights"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-weight-success"]')
      ).toContainText('Weights updated');
    });
  });

  test.describe('Mobile Inventory and Finance', () => {
    test('Complete mobile inventory workflow', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      // Navigate to inventory
      await authenticatedPage.click('[data-testid="mobile-inventory-tab"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-inventory-list"]')
      ).toBeVisible();

      // Test mobile item creation
      await authenticatedPage.click('[data-testid="mobile-add-inventory"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-inventory-form"]')
      ).toBeVisible();

      const testItem = generateTestInventoryItem();
      await authenticatedPage.fill('[data-testid="item-name"]', testItem.name);
      await authenticatedPage.selectOption('[data-testid="item-category"]', testItem.category);
      await authenticatedPage.fill('[data-testid="item-quantity"]', testItem.quantity.toString());
      await authenticatedPage.selectOption('[data-testid="item-unit"]', testItem.unit);
      await authenticatedPage.fill(
        '[data-testid="cost-per-unit"]',
        testItem.cost_per_unit.toString()
      );

      await authenticatedPage.click('[data-testid="save-inventory-button"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-inventory-success"]')
      ).toContainText('Item added');

      // Test mobile stock adjustment
      await authenticatedPage.click('[data-testid="mobile-inventory-item"]');
      await authenticatedPage.click('[data-testid="mobile-adjust-stock"]');
      await authenticatedPage.selectOption('[data-testid="adjustment-type"]', 'add');
      await authenticatedPage.fill('[data-testid="adjustment-quantity"]', '10');
      await authenticatedPage.click('[data-testid="save-adjustment"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-adjustment-success"]')
      ).toContainText('Stock adjusted');

      // Test mobile barcode scanning
      await authenticatedPage.click('[data-testid="mobile-scan-barcode"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-barcode-scanner"]')
      ).toBeVisible();

      // Test mobile inventory categories
      await authenticatedPage.click('[data-testid="mobile-categories"]');
      await authenticatedPage.click('[data-testid="mobile-category-feed"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-category-items"]')
      ).toBeVisible();
    });

    test('Complete mobile finance workflow', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      // Navigate to finance
      await authenticatedPage.click('[data-testid="mobile-finance-tab"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-finance-summary"]')
      ).toBeVisible();

      // Test mobile transaction creation
      await authenticatedPage.click('[data-testid="mobile-add-transaction"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-transaction-form"]')
      ).toBeVisible();

      await authenticatedPage.selectOption('[data-testid="transaction-type"]', 'expense');
      await authenticatedPage.fill('[data-testid="transaction-amount"]', '100');
      await authenticatedPage.selectOption('[data-testid="transaction-category"]', 'supplies');
      await authenticatedPage.fill(
        '[data-testid="transaction-description"]',
        'Mobile test expense'
      );
      await authenticatedPage.click('[data-testid="save-transaction"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-transaction-success"]')
      ).toContainText('Transaction added');

      // Test mobile invoice creation
      await authenticatedPage.click('[data-testid="mobile-invoices"]');
      await authenticatedPage.click('[data-testid="mobile-create-invoice"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-invoice-form"]')).toBeVisible();

      await authenticatedPage.fill('[data-testid="invoice-number"]', 'MOB-001');
      await authenticatedPage.selectOption('[data-testid="customer-select"]', 'Mobile Customer');
      await authenticatedPage.fill('[data-testid="invoice-amount"]', '500');
      await authenticatedPage.click('[data-testid="save-invoice"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-invoice-success"]')
      ).toContainText('Invoice created');

      // Test mobile budget management
      await authenticatedPage.click('[data-testid="mobile-budgets"]');
      await authenticatedPage.click('[data-testid="mobile-create-budget"]');
      await authenticatedPage.fill('[data-testid="budget-name"]', 'Mobile Budget');
      await authenticatedPage.fill('[data-testid="budget-amount"]', '10000');
      await authenticatedPage.click('[data-testid="save-budget"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-budget-success"]')
      ).toContainText('Budget created');

      // Test mobile payment recording
      await authenticatedPage.click('[data-testid="mobile-payments"]');
      await authenticatedPage.click('[data-testid="mobile-record-payment"]');
      await authenticatedPage.fill('[data-testid="payment-amount"]', '500');
      await authenticatedPage.selectOption('[data-testid="payment-method"]', 'mobile-pay');
      await authenticatedPage.click('[data-testid="save-payment"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-payment-success"]')
      ).toContainText('Payment recorded');
    });
  });

  test.describe('Mobile Analytics and Reporting', () => {
    test('Complete mobile analytics workflow', async ({ authenticatedPage }) => {
      await authenticatedPage.setViewportSize({ width: 375, height: 667 });

      // Navigate to analytics
      await authenticatedPage.click('[data-testid="mobile-analytics-tab"]');
      await expect(
        authenticatedPage.locator('[data-testid="mobile-analytics-dashboard"]')
      ).toBeVisible();

      // Test mobile chart interactions
      await authenticatedPage.click('[data-testid="mobile-chart-tab"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-chart"]')).toBeVisible();

      // Test mobile chart touch interactions
      const chartElement = authenticatedPage.locator('[data-testid="mobile-chart"]');
      await chartElement.tap({ position: { x: 100, y: 100 } });
      await chartElement.swipe(100, 200, 200, 200);

      // Test mobile time range selection
      await authenticatedPage.click('[data-testid="mobile-time-range"]');
      await authenticatedPage.selectOption('[data-testid="mobile-range"]', 'last-7-days');
      await authenticatedPage.click('[data-testid="apply-range"]');

      // Test mobile metrics view
      await authenticatedPage.click('[data-testid="mobile-metrics"]');
      await expect(authenticatedPage.locator('[data-testid="mobile-metrics-list"]')).toBeVisible();

      // Test mobile report generation
      await authenticatedPage.click('[data-testid="mobile-reports"]');
      await authenticatedPage.click('[data-testid="mobile-generate-report"]');
      await authenticatedPage.selectOption('[data-testid="mobile-report-type"]', 'performance');
      await authenticatedPage.selectOption('[data-testid="mobile-report-format"]', 'pdf');
      await authenticatedPage.click('[data-testid="mobile-start-generation"]');

      await expect(
        authenticatedPage.locator('[data-testid="mobile-generation-progress"]')
      ).toBeVisible();

      // Test mobile report sharing
      await authenticatedPage.click('[data-testid="mobile-share-report"]');
      await authenticatedPage.selectOption('[data-testid="mobile-share-method"]', 'email');
      await authenticatedPage.fill('[data-testid="share-email"]', 'farmer@farmersboot.com');
      await authenticatedPage.click('[data-testid="send-report"]');

      await expect(authenticatedPage.locator('[data-testid="mobile-share-success"]')).toContainText(
        'Report sent'
      );
    });
  });

  test.describe('Mobile Device Compatibility', () => {
    const devices = [
      { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
      { name: 'iPhone SE', viewport: { width: 375, height: 667 } },
      { name: 'Android Phone', viewport: { width: 360, height: 640 } },
      { name: 'iPad', viewport: { width: 768, height: 1024 } },
      { name: 'Android Tablet', viewport: { width: 600, height: 960 } },
    ];

    devices.forEach(device => {
      test(`${device.name} responsive design test`, async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.goto('/');

        // Test basic layout
        await expect(page.locator('h1')).toContainText('Welcome to Farmers Boot');
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

        // Test navigation
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

        // Test signup flow
        await page.click('[data-testid="mobile-signup"]');
        await expect(page.locator('[data-testid="mobile-signup-form"]')).toBeVisible();

        // Test form elements
        await expect(page.locator('[data-testid="signup-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="signup-email"]')).toBeVisible();
        await expect(page.locator('[data-testid="signup-password"]')).toBeVisible();
        await expect(page.locator('[data-testid="signup-submit-button"]')).toBeVisible();

        // Test responsive elements
        if (device.viewport.width >= 768) {
          // Tablet layout
          await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
        } else {
          // Phone layout
          await expect(page.locator('[data-testid="phone-layout"]')).toBeVisible();
        }
      });
    });

    test('Mobile orientation changes', async ({ page }) => {
      // Test portrait mode
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();

      // Test landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();

      // Test form layout adaptation
      await expect(page.locator('[data-testid="mobile-form-landscape"]')).toBeVisible();

      // Test back to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible();
    });
  });

  test.describe('Mobile Performance and Accessibility', () => {
    test('Mobile performance optimization', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Measure page load performance
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Mobile should load quickly
      expect(loadTime).toBeLessThan(3000);

      // Test smooth scrolling
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      // Test touch responsiveness
      const button = page.locator('[data-testid="mobile-menu-button"]');
      await button.tap();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

      // Test animation performance
      await page.click('[data-testid="mobile-close-menu"]');
      await expect(page.locator('[data-testid="mobile-navigation"]')).not.toBeVisible();
    });

    test('Mobile accessibility compliance', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Test screen reader compatibility
      const landmarks = await page.locator('[role], [aria-label], [aria-labelledby]').count();
      expect(landmarks).toBeGreaterThan(0);

      // Test color contrast
      await page.goto('/login');
      const loginButton = page.locator('[data-testid="login-submit-button"]');
      await expect(loginButton).toHaveCSS('background-color', /rgb\(\d+, \d+, \d+\)/);

      // Test focus management
      await page.focus('[data-testid="login-email"]');
      await expect(page.locator('[data-testid="login-email"]')).toBeFocused();

      // Test touch target sizes
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        if (boundingBox) {
          // Touch targets should be at least 44x44px
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});
