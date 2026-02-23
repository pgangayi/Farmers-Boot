import { test, expect, generateTestFarm, generateTestCrop } from './setup/test-setup';

test.describe('Farm and Field Management - Complete Coverage', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
  });

  test('Complete farm creation and management workflow', async ({ authenticatedPage }) => {
    // Navigate to farms page
    await authenticatedPage.click('[data-testid="farms-tab"]');
    await expect(authenticatedPage.locator('h1')).toContainText('Farm Management');

    // Test add farm button
    await authenticatedPage.click('[data-testid="add-farm-button"]');
    await expect(authenticatedPage.locator('h2')).toContainText('Add New Farm');

    // Test form validation
    await authenticatedPage.click('[data-testid="save-farm-button"]');
    await expect(authenticatedPage.locator('[data-testid="farm-name-error"]')).toContainText(
      'Farm name is required'
    );
    await expect(authenticatedPage.locator('[data-testid="farm-location-error"]')).toContainText(
      'Location is required'
    );
    await expect(authenticatedPage.locator('[data-testid="farm-size-error"]')).toContainText(
      'Size is required'
    );

    // Test invalid size
    await authenticatedPage.fill('[data-testid="farm-name"]', 'Test Farm');
    await authenticatedPage.fill('[data-testid="farm-location"]', 'Test Location');
    await authenticatedPage.fill('[data-testid="farm-size"]', 'invalid');
    await authenticatedPage.click('[data-testid="save-farm-button"]');
    await expect(authenticatedPage.locator('[data-testid="farm-size-error"]')).toContainText(
      'Invalid size'
    );

    // Test successful farm creation
    await authenticatedPage.fill('[data-testid="farm-size"]', '100');
    await authenticatedPage.selectOption('[data-testid="farm-type"]', 'mixed');
    await authenticatedPage.fill('[data-testid="farm-description"]', 'Test farm description');

    await authenticatedPage.click('[data-testid="save-farm-button"]');

    // Should return to farms list
    await expect(authenticatedPage.locator('[data-testid="farm-list"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toContainText('Test Farm');

    // Test farm details view
    await authenticatedPage.click('[data-testid="view-farm-details"]');
    await expect(authenticatedPage.locator('[data-testid="farm-details"]')).toContainText(
      'Test Farm'
    );
    await expect(authenticatedPage.locator('[data-testid="farm-location"]')).toContainText(
      'Test Location'
    );
    await expect(authenticatedPage.locator('[data-testid="farm-size"]')).toContainText('100 acres');

    // Test farm editing
    await authenticatedPage.click('[data-testid="edit-farm"]');
    await authenticatedPage.fill('[data-testid="farm-name"]', 'Updated Test Farm');
    await authenticatedPage.click('[data-testid="save-farm-button"]');

    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toContainText(
      'Updated Test Farm'
    );

    // Test farm deletion
    await authenticatedPage.click('[data-testid="delete-farm"]');
    await expect(authenticatedPage.locator('[data-testid="delete-confirmation"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="confirm-delete"]');

    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).not.toBeVisible();
  });

  test('Complete field management workflow', async ({ authenticatedPage }) => {
    // Create a farm first
    await authenticatedPage.click('[data-testid="farms-tab"]');
    await authenticatedPage.click('[data-testid="add-farm-button"]');

    const testFarm = generateTestFarm();
    await authenticatedPage.fill('[data-testid="farm-name"]', testFarm.name);
    await authenticatedPage.fill('[data-testid="farm-location"]', testFarm.location);
    await authenticatedPage.fill('[data-testid="farm-size"]', testFarm.size.toString());
    await authenticatedPage.selectOption('[data-testid="farm-type"]', testFarm.type);
    await authenticatedPage.click('[data-testid="save-farm-button"]');

    // Navigate to fields
    await authenticatedPage.click('[data-testid="fields-tab"]');
    await expect(authenticatedPage.locator('h1')).toContainText('Field Management');

    // Test add field
    await authenticatedPage.click('[data-testid="add-field-button"]');
    await expect(authenticatedPage.locator('h2')).toContainText('Add New Field');

    // Test field form validation
    await authenticatedPage.click('[data-testid="save-field-button"]');
    await expect(authenticatedPage.locator('[data-testid="field-name-error"]')).toContainText(
      'Field name is required'
    );
    await expect(authenticatedPage.locator('[data-testid="field-size-error"]')).toContainText(
      'Size is required'
    );

    // Test successful field creation
    await authenticatedPage.fill('[data-testid="field-name"]', 'North Field');
    await authenticatedPage.fill('[data-testid="field-size"]', '50');
    await authenticatedPage.selectOption('[data-testid="soil-type"]', 'loamy');
    await authenticatedPage.selectOption('[data-testid="drainage"]', 'good');
    await authenticatedPage.fill('[data-testid="field-coordinates"]', '40.7128, -74.0060');

    await authenticatedPage.click('[data-testid="save-field-button"]');

    // Should return to fields list
    await expect(authenticatedPage.locator('[data-testid="field-list"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="field-item"]')).toContainText(
      'North Field'
    );

    // Test field details
    await authenticatedPage.click('[data-testid="view-field-details"]');
    await expect(authenticatedPage.locator('[data-testid="field-details"]')).toContainText(
      'North Field'
    );
    await expect(authenticatedPage.locator('[data-testid="soil-type"]')).toContainText('Loamy');

    // Test field editing
    await authenticatedPage.click('[data-testid="edit-field"]');
    await authenticatedPage.fill('[data-testid="field-name"]', 'Updated North Field');
    await authenticatedPage.click('[data-testid="save-field-button"]');

    await expect(authenticatedPage.locator('[data-testid="field-item"]')).toContainText(
      'Updated North Field'
    );

    // Test field mapping
    await authenticatedPage.click('[data-testid="field-mapping"]');
    await expect(authenticatedPage.locator('[data-testid="map-view"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="field-marker"]')).toBeVisible();

    // Test soil analysis
    await authenticatedPage.click('[data-testid="soil-analysis"]');
    await expect(authenticatedPage.locator('[data-testid="soil-results"]')).toBeVisible();

    // Test field deletion
    await authenticatedPage.click('[data-testid="delete-field"]');
    await authenticatedPage.click('[data-testid="confirm-delete"]');

    await expect(authenticatedPage.locator('[data-testid="field-item"]')).not.toBeVisible();
  });

  test('Farm and field bulk operations', async ({ authenticatedPage }) => {
    // Create multiple farms
    await authenticatedPage.click('[data-testid="farms-tab"]');

    for (let i = 1; i <= 3; i++) {
      await authenticatedPage.click('[data-testid="add-farm-button"]');
      await authenticatedPage.fill('[data-testid="farm-name"]', `Test Farm ${i}`);
      await authenticatedPage.fill('[data-testid="farm-location"]', `Location ${i}`);
      await authenticatedPage.fill('[data-testid="farm-size"]', (100 * i).toString());
      await authenticatedPage.selectOption('[data-testid="farm-type"]', 'mixed');
      await authenticatedPage.click('[data-testid="save-farm-button"]');
    }

    // Test bulk selection
    await authenticatedPage.check('[data-testid="select-all-farms"]');
    await expect(authenticatedPage.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Test bulk export
    await authenticatedPage.click('[data-testid="bulk-export"]');
    await expect(authenticatedPage.locator('[data-testid="export-options"]')).toBeVisible();
    await authenticatedPage.selectOption('[data-testid="export-format"]', 'csv');
    await authenticatedPage.click('[data-testid="download-export"]');

    // Test bulk delete
    await authenticatedPage.click('[data-testid="bulk-delete"]');
    await authenticatedPage.click('[data-testid="confirm-bulk-delete"]');

    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toHaveCount(0);
  });

  test('Farm search and filtering', async ({ authenticatedPage }) => {
    // Create test farms
    await authenticatedPage.click('[data-testid="farms-tab"]');

    const farms = [
      { name: 'Organic Farm', type: 'organic', size: 50 },
      { name: 'Dairy Farm', type: 'livestock', size: 200 },
      { name: 'Crop Farm', type: 'crop', size: 150 },
    ];

    for (const farm of farms) {
      await authenticatedPage.click('[data-testid="add-farm-button"]');
      await authenticatedPage.fill('[data-testid="farm-name"]', farm.name);
      await authenticatedPage.fill('[data-testid="farm-location"]', 'Test Location');
      await authenticatedPage.fill('[data-testid="farm-size"]', farm.size.toString());
      await authenticatedPage.selectOption('[data-testid="farm-type"]', farm.type);
      await authenticatedPage.click('[data-testid="save-farm-button"]');
    }

    // Test search
    await authenticatedPage.fill('[data-testid="farm-search"]', 'Organic');
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toContainText(
      'Organic Farm'
    );

    // Test type filter
    await authenticatedPage.fill('[data-testid="farm-search"]', '');
    await authenticatedPage.selectOption('[data-testid="type-filter"]', 'livestock');
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toContainText(
      'Dairy Farm'
    );

    // Test size filter
    await authenticatedPage.selectOption('[data-testid="type-filter"]', 'all');
    await authenticatedPage.fill('[data-testid="min-size"]', '100');
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toHaveCount(2);

    // Test combined filters
    await authenticatedPage.fill('[data-testid="max-size"]', '180');
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="farm-item"]')).toContainText('Crop Farm');
  });

  test('Field equipment management', async ({ authenticatedPage }) => {
    // Create farm and field first
    await authenticatedPage.click('[data-testid="farms-tab"]');
    await authenticatedPage.click('[data-testid="add-farm-button"]');
    await authenticatedPage.fill('[data-testid="farm-name"]', 'Equipment Test Farm');
    await authenticatedPage.fill('[data-testid="farm-location"]', 'Test Location');
    await authenticatedPage.fill('[data-testid="farm-size"]', '100');
    await authenticatedPage.click('[data-testid="save-farm-button"]');

    await authenticatedPage.click('[data-testid="fields-tab"]');
    await authenticatedPage.click('[data-testid="add-field-button"]');
    await authenticatedPage.fill('[data-testid="field-name"]', 'Equipment Field');
    await authenticatedPage.fill('[data-testid="field-size"]', '50');
    await authenticatedPage.click('[data-testid="save-field-button"]');

    // Add equipment to field
    await authenticatedPage.click('[data-testid="view-field-details"]');
    await authenticatedPage.click('[data-testid="equipment-tab"]');
    await authenticatedPage.click('[data-testid="add-equipment"]');

    await authenticatedPage.fill('[data-testid="equipment-name"]', 'John Deere Tractor');
    await authenticatedPage.selectOption('[data-testid="equipment-type"]', 'tractor');
    await authenticatedPage.fill('[data-testid="equipment-model"]', '8R 410');
    await authenticatedPage.fill('[data-testid="purchase-date"]', '2023-01-01');
    await authenticatedPage.fill('[data-testid="equipment-cost"]', '150000');

    await authenticatedPage.click('[data-testid="save-equipment"]');

    await expect(authenticatedPage.locator('[data-testid="equipment-list"]')).toContainText(
      'John Deere Tractor'
    );

    // Test equipment maintenance
    await authenticatedPage.click('[data-testid="maintenance-tab"]');
    await authenticatedPage.click('[data-testid="add-maintenance"]');

    await authenticatedPage.fill('[data-testid="maintenance-date"]', '2024-01-01');
    await authenticatedPage.selectOption('[data-testid="maintenance-type"]', 'routine');
    await authenticatedPage.fill('[data-testid="maintenance-cost"]', '500');
    await authenticatedPage.fill(
      '[data-testid="maintenance-notes"]',
      'Oil change and filter replacement'
    );

    await authenticatedPage.click('[data-testid="save-maintenance"]');

    await expect(authenticatedPage.locator('[data-testid="maintenance-history"]')).toContainText(
      'Oil change'
    );
  });

  test('Farm analytics and reporting', async ({ authenticatedPage }) => {
    // Create test farm with data
    await authenticatedPage.click('[data-testid="farms-tab"]');
    await authenticatedPage.click('[data-testid="add-farm-button"]');
    await authenticatedPage.fill('[data-testid="farm-name"]', 'Analytics Test Farm');
    await authenticatedPage.fill('[data-testid="farm-location"]', 'Test Location');
    await authenticatedPage.fill('[data-testid="farm-size"]', '200');
    await authenticatedPage.click('[data-testid="save-farm-button"]');

    // View farm analytics
    await authenticatedPage.click('[data-testid="view-farm-details"]');
    await authenticatedPage.click('[data-testid="analytics-tab"]');

    await expect(authenticatedPage.locator('[data-testid="farm-overview"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="yield-chart"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Test date range filter
    await authenticatedPage.click('[data-testid="date-range-filter"]');
    await authenticatedPage.selectOption('[data-testid="preset-range"]', 'last-12-months');
    await authenticatedPage.click('[data-testid="apply-filter"]');

    // Test export reports
    await authenticatedPage.click('[data-testid="export-reports"]');
    await authenticatedPage.check('[data-testid="include-yield-data"]');
    await authenticatedPage.check('[data-testid="include-financial-data"]');
    await authenticatedPage.click('[data-testid="generate-report"]');

    await expect(authenticatedPage.locator('[data-testid="report-ready"]')).toBeVisible();
  });

  test('Farm collaboration and permissions', async ({ authenticatedPage }) => {
    // Create farm
    await authenticatedPage.click('[data-testid="farms-tab"]');
    await authenticatedPage.click('[data-testid="add-farm-button"]');
    await authenticatedPage.fill('[data-testid="farm-name"]', 'Collaboration Test Farm');
    await authenticatedPage.fill('[data-testid="farm-location"]', 'Test Location');
    await authenticatedPage.fill('[data-testid="farm-size"]', '100');
    await authenticatedPage.click('[data-testid="save-farm-button"]');

    // Test team management
    await authenticatedPage.click('[data-testid="view-farm-details"]');
    await authenticatedPage.click('[data-testid="team-tab"]');
    await authenticatedPage.click('[data-testid="invite-member"]');

    await authenticatedPage.fill('[data-testid="member-email"]', 'collaborator@farmersboot.com');
    await authenticatedPage.selectOption('[data-testid="member-role"]', 'worker');
    await authenticatedPage.fill('[data-testid="invite-message"]', 'Please join my farm');

    await authenticatedPage.click('[data-testid="send-invite"]');

    await expect(authenticatedPage.locator('[data-testid="invite-sent"]')).toContainText(
      'Invitation sent'
    );

    // Test permission settings
    await authenticatedPage.click('[data-testid="permissions-tab"]');
    await authenticatedPage.check('[data-testid="can-view-crops"]');
    await authenticatedPage.check('[data-testid="can-edit-fields"]');
    await authenticatedPage.uncheck('[data-testid="can-manage-finances"]');

    await authenticatedPage.click('[data-testid="save-permissions"]');

    await expect(authenticatedPage.locator('[data-testid="permissions-updated"]')).toContainText(
      'Permissions updated'
    );
  });

  test('Farm data import/export', async ({ authenticatedPage }) => {
    // Test CSV import
    await authenticatedPage.click('[data-testid="farms-tab"]');
    await authenticatedPage.click('[data-testid="import-data"]');

    await expect(authenticatedPage.locator('[data-testid="import-wizard"]')).toBeVisible();

    // Test file upload (mock)
    await authenticatedPage.setInputFiles('[data-testid="csv-upload"]', 'test-data/farms.csv');
    await authenticatedPage.click('[data-testid="preview-import"]');

    await expect(authenticatedPage.locator('[data-testid="import-preview"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="confirm-import"]');

    await expect(authenticatedPage.locator('[data-testid="import-success"]')).toContainText(
      'Data imported successfully'
    );

    // Test data export
    await authenticatedPage.click('[data-testid="export-data"]');
    await authenticatedPage.selectOption('[data-testid="export-type"]', 'farms');
    await authenticatedPage.selectOption('[data-testid="export-format"]', 'excel');
    await authenticatedPage.check('[data-testid="include-inactive"]');

    await authenticatedPage.click('[data-testid="generate-export"]');

    await expect(authenticatedPage.locator('[data-testid="export-ready"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="download-file"]');
  });

  test('Farm mobile responsiveness', async ({ authenticatedPage }) => {
    // Set mobile viewport
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });

    await authenticatedPage.click('[data-testid="farms-tab"]');

    // Test mobile navigation
    await expect(authenticatedPage.locator('[data-testid="mobile-farm-list"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="mobile-add-farm"]')).toBeVisible();

    // Test mobile farm creation
    await authenticatedPage.click('[data-testid="mobile-add-farm"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-farm-form"]')).toBeVisible();

    await authenticatedPage.fill('[data-testid="farm-name"]', 'Mobile Test Farm');
    await authenticatedPage.fill('[data-testid="farm-location"]', 'Mobile Location');
    await authenticatedPage.fill('[data-testid="farm-size"]', '50');
    await authenticatedPage.click('[data-testid="save-farm-button"]');

    // Test mobile farm view
    await expect(authenticatedPage.locator('[data-testid="mobile-farm-card"]')).toContainText(
      'Mobile Test Farm'
    );

    // Test mobile actions menu
    await authenticatedPage.click('[data-testid="mobile-actions-menu"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-actions"]')).toBeVisible();
  });
});
