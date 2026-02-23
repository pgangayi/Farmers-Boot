import { test, expect, generateTestAnimal } from './setup/test-setup';

test.describe('Livestock Management - Complete Coverage', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
  });

  test('Complete livestock management workflow', async ({ authenticatedPage }) => {
    // Navigate to livestock page
    await authenticatedPage.click('[data-testid="livestock-tab"]');
    await expect(authenticatedPage.locator('h1')).toContainText('Livestock Management');

    // Test add animal button
    await authenticatedPage.click('[data-testid="add-animal-button"]');
    await expect(authenticatedPage.locator('h2')).toContainText('Add New Animal');

    // Test form validation
    await authenticatedPage.click('[data-testid="save-animal-button"]');
    await expect(authenticatedPage.locator('[data-testid="animal-name-error"]')).toContainText(
      'Animal name is required'
    );
    await expect(authenticatedPage.locator('[data-testid="species-error"]')).toContainText(
      'Species is required'
    );
    await expect(authenticatedPage.locator('[data-testid="breed-error"]')).toContainText(
      'Breed is required'
    );
    await expect(authenticatedPage.locator('[data-testid="tag-error"]')).toContainText(
      'Identification tag is required'
    );

    // Test successful animal creation
    const testAnimal = generateTestAnimal();
    await authenticatedPage.fill('[data-testid="animal-name"]', testAnimal.name);
    await authenticatedPage.selectOption('[data-testid="animal-species"]', testAnimal.species);
    await authenticatedPage.fill('[data-testid="animal-breed"]', testAnimal.breed);
    await authenticatedPage.fill(
      '[data-testid="identification-tag"]',
      testAnimal.identification_tag
    );
    await authenticatedPage.fill('[data-testid="acquisition-date"]', testAnimal.acquisition_date);
    await authenticatedPage.fill('[data-testid="birth-date"]', '2023-01-01');
    await authenticatedPage.selectOption('[data-testid="gender"]', 'female');
    await authenticatedPage.fill('[data-testid="initial-weight"]', '500');
    await authenticatedPage.selectOption('[data-testid="health-status"]', 'healthy');

    await authenticatedPage.click('[data-testid="save-animal-button"]');

    // Should return to livestock list
    await expect(authenticatedPage.locator('[data-testid="livestock-list"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toContainText(
      testAnimal.name
    );

    // Test animal details view
    await authenticatedPage.click('[data-testid="view-animal-details"]');
    await expect(authenticatedPage.locator('[data-testid="animal-details"]')).toContainText(
      testAnimal.name
    );
    await expect(authenticatedPage.locator('[data-testid="species-info"]')).toContainText(
      testAnimal.species
    );
    await expect(authenticatedPage.locator('[data-testid="breed-info"]')).toContainText(
      testAnimal.breed
    );

    // Test animal editing
    await authenticatedPage.click('[data-testid="edit-animal"]');
    await authenticatedPage.fill('[data-testid="animal-name"]', 'Updated Animal Name');
    await authenticatedPage.click('[data-testid="save-animal-button"]');

    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toContainText(
      'Updated Animal Name'
    );

    // Test weight tracking
    await authenticatedPage.click('[data-testid="weight-tracking"]');
    await authenticatedPage.click('[data-testid="add-weight"]');
    await authenticatedPage.fill('[data-testid="weight-value"]', '520');
    await authenticatedPage.fill(
      '[data-testid="weight-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.fill('[data-testid="weight-notes"]', 'Gained weight');
    await authenticatedPage.click('[data-testid="save-weight"]');

    await expect(authenticatedPage.locator('[data-testid="weight-history"]')).toContainText('520');

    // Test health management
    await authenticatedPage.click('[data-testid="health-management"]');
    await authenticatedPage.click('[data-testid="add-health-record"]');
    await authenticatedPage.selectOption('[data-testid="health-type"]', 'vaccination');
    await authenticatedPage.fill(
      '[data-testid="health-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.fill('[data-testid="health-description"]', 'Annual vaccination');
    await authenticatedPage.fill('[data-testid="veterinarian"]', 'Dr. Smith');
    await authenticatedPage.click('[data-testid="save-health-record"]');

    await expect(authenticatedPage.locator('[data-testid="health-history"]')).toContainText(
      'Annual vaccination'
    );

    // Test breeding management
    await authenticatedPage.click('[data-testid="breeding-management"]');
    await authenticatedPage.click('[data-testid="add-breeding-record"]');
    await authenticatedPage.selectOption('[data-testid="breeding-type"]', 'natural');
    await authenticatedPage.fill(
      '[data-testid="breeding-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.fill('[data-testid="sire-id"]', 'BULL001');
    await authenticatedPage.fill('[data-testid="expected-calving"]', '2024-12-01');
    await authenticatedPage.click('[data-testid="save-breeding"]');

    await expect(authenticatedPage.locator('[data-testid="breeding-history"]')).toContainText(
      'BULL001'
    );

    // Test animal deletion
    await authenticatedPage.click('[data-testid="delete-animal"]');
    await expect(authenticatedPage.locator('[data-testid="delete-confirmation"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="confirm-delete"]');

    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).not.toBeVisible();
  });

  test('Livestock batch operations', async ({ authenticatedPage }) => {
    // Create multiple animals
    await authenticatedPage.click('[data-testid="livestock-tab"]');

    for (let i = 1; i <= 5; i++) {
      await authenticatedPage.click('[data-testid="add-animal-button"]');
      await authenticatedPage.fill('[data-testid="animal-name"]', `Test Animal ${i}`);
      await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
      await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
      await authenticatedPage.fill('[data-testid="identification-tag"]', `TAG00${i}`);
      await authenticatedPage.fill('[data-testid="acquisition-date"]', '2023-01-01');
      await authenticatedPage.click('[data-testid="save-animal-button"]');
    }

    // Test bulk selection
    await authenticatedPage.check('[data-testid="select-all-animals"]');
    await expect(authenticatedPage.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Test bulk vaccination
    await authenticatedPage.click('[data-testid="bulk-vaccination"]');
    await authenticatedPage.fill('[data-testid="vaccine-type"]', 'BVD');
    await authenticatedPage.fill(
      '[data-testid="vaccination-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.fill('[data-testid="veterinarian"]', 'Dr. Johnson');
    await authenticatedPage.click('[data-testid="apply-bulk-vaccination"]');

    await expect(authenticatedPage.locator('[data-testid="vaccination-success"]')).toContainText(
      'Vaccination applied to all selected animals'
    );

    // Test bulk weight update
    await authenticatedPage.check('[data-testid="select-all-animals"]');
    await authenticatedPage.click('[data-testid="bulk-weight-update"]');
    await authenticatedPage.fill('[data-testid="average-weight"]', '550');
    await authenticatedPage.fill(
      '[data-testid="weight-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.click('[data-testid="update-weights"]');

    await expect(authenticatedPage.locator('[data-testid="weight-update-success"]')).toContainText(
      'Weights updated'
    );

    // Test bulk status change
    await authenticatedPage.check('[data-testid="select-all-animals"]');
    await authenticatedPage.click('[data-testid="bulk-status-change"]');
    await authenticatedPage.selectOption('[data-testid="new-status"]', 'for_sale');
    await authenticatedPage.click('[data-testid="update-status"]');

    await expect(authenticatedPage.locator('[data-testid="status-update-success"]')).toContainText(
      'Status updated'
    );
  });

  test('Livestock search and filtering', async ({ authenticatedPage }) => {
    // Create test animals with different attributes
    await authenticatedPage.click('[data-testid="livestock-tab"]');

    const animals = [
      { name: 'Bessie', species: 'Cattle', breed: 'Holstein', status: 'active' },
      { name: 'Charlie', species: 'Cattle', breed: 'Angus', status: 'for_sale' },
      { name: 'Dolly', species: 'Sheep', breed: 'Merino', status: 'active' },
      { name: 'Porky', species: 'Pigs', breed: 'Yorkshire', status: 'active' },
    ];

    for (const animal of animals) {
      await authenticatedPage.click('[data-testid="add-animal-button"]');
      await authenticatedPage.fill('[data-testid="animal-name"]', animal.name);
      await authenticatedPage.selectOption('[data-testid="animal-species"]', animal.species);
      await authenticatedPage.fill('[data-testid="animal-breed"]', animal.breed);
      await authenticatedPage.fill('[data-testid="identification-tag"]', `TAG${animal.name}`);
      await authenticatedPage.fill('[data-testid="acquisition-date"]', '2023-01-01');
      await authenticatedPage.selectOption('[data-testid="health-status"]', animal.status);
      await authenticatedPage.click('[data-testid="save-animal-button"]');
    }

    // Test search by name
    await authenticatedPage.fill('[data-testid="animal-search"]', 'Bessie');
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toContainText('Bessie');

    // Test filter by species
    await authenticatedPage.fill('[data-testid="animal-search"]', '');
    await authenticatedPage.selectOption('[data-testid="species-filter"]', 'Cattle');
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toHaveCount(2);

    // Test filter by breed
    await authenticatedPage.selectOption('[data-testid="species-filter"]', 'all');
    await authenticatedPage.selectOption('[data-testid="breed-filter"]', 'Angus');
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toContainText('Charlie');

    // Test filter by status
    await authenticatedPage.selectOption('[data-testid="breed-filter"]', 'all');
    await authenticatedPage.selectOption('[data-testid="status-filter"]', 'for_sale');
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toContainText('Charlie');

    // Test combined filters
    await authenticatedPage.selectOption('[data-testid="species-filter"]', 'Cattle');
    await authenticatedPage.selectOption('[data-testid="status-filter"]', 'active');
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toHaveCount(1);
    await expect(authenticatedPage.locator('[data-testid="animal-item"]')).toContainText('Bessie');
  });

  test('Livestock health monitoring', async ({ authenticatedPage }) => {
    // Create animal
    await authenticatedPage.click('[data-testid="livestock-tab"]');
    await authenticatedPage.click('[data-testid="add-animal-button"]');
    await authenticatedPage.fill('[data-testid="animal-name"]', 'Health Test Animal');
    await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
    await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
    await authenticatedPage.fill('[data-testid="identification-tag"]', 'HEALTH001');
    await authenticatedPage.fill('[data-testid="acquisition-date"]', '2023-01-01');
    await authenticatedPage.click('[data-testid="save-animal-button"]');

    // Navigate to health monitoring
    await authenticatedPage.click('[data-testid="view-animal-details"]');
    await authenticatedPage.click('[data-testid="health-monitoring"]');

    // Test health metrics
    await expect(authenticatedPage.locator('[data-testid="health-dashboard"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="temperature-chart"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="weight-chart"]')).toBeVisible();

    // Add health observation
    await authenticatedPage.click('[data-testid="add-observation"]');
    await authenticatedPage.selectOption('[data-testid="observation-type"]', 'symptom');
    await authenticatedPage.fill('[data-testid="observation-description"]', 'Slight cough');
    await authenticatedPage.selectOption('[data-testid="severity"]', 'mild');
    await authenticatedPage.fill(
      '[data-testid="observation-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.click('[data-testid="save-observation"]');

    await expect(authenticatedPage.locator('[data-testid="observation-list"]')).toContainText(
      'Slight cough'
    );

    // Test medication administration
    await authenticatedPage.click('[data-testid="medication-tab"]');
    await authenticatedPage.click('[data-testid="add-medication"]');
    await authenticatedPage.fill('[data-testid="medication-name"]', 'Antibiotic');
    await authenticatedPage.fill('[data-testid="dosage"]', '10ml');
    await authenticatedPage.fill(
      '[data-testid="administration-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.fill('[data-testid="withdrawal-period"]', '14 days');
    await authenticatedPage.click('[data-testid="save-medication"]');

    await expect(authenticatedPage.locator('[data-testid="medication-history"]')).toContainText(
      'Antibiotic'
    );

    // Test quarantine management
    await authenticatedPage.click('[data-testid="quarantine-tab"]');
    await authenticatedPage.click('[data-testid="place-quarantine"]');
    await authenticatedPage.fill('[data-testid="quarantine-reason"]', 'Respiratory symptoms');
    await authenticatedPage.fill(
      '[data-testid="quarantine-start"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.click('[data-testid="save-quarantine"]');

    await expect(authenticatedPage.locator('[data-testid="quarantine-status"]')).toContainText(
      'Under quarantine'
    );

    // Test release from quarantine
    await authenticatedPage.click('[data-testid="release-quarantine"]');
    await authenticatedPage.fill('[data-testid="release-reason"]', 'Symptoms resolved');
    await authenticatedPage.fill(
      '[data-testid="release-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.click('[data-testid="confirm-release"]');

    await expect(authenticatedPage.locator('[data-testid="quarantine-status"]')).toContainText(
      'Not quarantined'
    );
  });

  test('Livestock breeding and genetics', async ({ authenticatedPage }) => {
    // Create breeding animals
    await authenticatedPage.click('[data-testid="livestock-tab"]');

    // Create sire
    await authenticatedPage.click('[data-testid="add-animal-button"]');
    await authenticatedPage.fill('[data-testid="animal-name"]', 'Premium Bull');
    await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
    await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
    await authenticatedPage.fill('[data-testid="identification-tag"]', 'SIRE001');
    await authenticatedPage.selectOption('[data-testid="gender"]', 'male');
    await authenticatedPage.fill('[data-testid="acquisition-date"]', '2022-01-01');
    await authenticatedPage.click('[data-testid="save-animal-button"]');

    // Create dam
    await authenticatedPage.click('[data-testid="add-animal-button"]');
    await authenticatedPage.fill('[data-testid="animal-name"]', 'Quality Cow');
    await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
    await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
    await authenticatedPage.fill('[data-testid="identification-tag"]', 'DAM001');
    await authenticatedPage.selectOption('[data-testid="gender"]', 'female');
    await authenticatedPage.fill('[data-testid="acquisition-date"]', '2022-01-01');
    await authenticatedPage.click('[data-testid="save-animal-button"]');

    // Navigate to breeding management
    await authenticatedPage.click('[data-testid="breeding-management"]');

    // Test breeding pair matching
    await authenticatedPage.click('[data-testid="breeding-planner"]');
    await authenticatedPage.selectOption('[data-testid="sire-select"]', 'SIRE001');
    await authenticatedPage.selectOption('[data-testid="dam-select"]', 'DAM001');
    await authenticatedPage.click('[data-testid="analyze-compatibility"]');

    await expect(authenticatedPage.locator('[data-testid="compatibility-score"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="genetic-risks"]')).toBeVisible();

    // Create breeding record
    await authenticatedPage.click('[data-testid="create-breeding"]');
    await authenticatedPage.selectOption('[data-testid="breeding-method"]', 'artificial');
    await authenticatedPage.fill(
      '[data-testid="breeding-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.fill('[data-testid="semen-source"]', 'Premium Genetics Inc');
    await authenticatedPage.click('[data-testid="save-breeding-record"]');

    await expect(authenticatedPage.locator('[data-testid="breeding-success"]')).toContainText(
      'Breeding record created'
    );

    // Test pregnancy tracking
    await authenticatedPage.click('[data-testid="pregnancy-tracking"]');
    await authenticatedPage.click('[data-testid="pregnancy-check"]');
    await authenticatedPage.fill(
      '[data-testid="check-date"]',
      new Date().toISOString().split('T')[0]
    );
    await authenticatedPage.selectOption('[data-testid="pregnancy-status"]', 'confirmed');
    await authenticatedPage.fill('[data-testid="expected-calving"]', '2024-12-01');
    await authenticatedPage.click('[data-testid="save-pregnancy-check"]');

    await expect(authenticatedPage.locator('[data-testid="pregnancy-confirmed"]')).toContainText(
      'Pregnancy confirmed'
    );

    // Test pedigree tracking
    await authenticatedPage.click('[data-testid="pedigree-tab"]');
    await expect(authenticatedPage.locator('[data-testid="pedigree-chart"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="add-ancestor"]');
    await authenticatedPage.fill('[data-testid="ancestor-name"]', 'Grand Champion Bull');
    await authenticatedPage.fill('[data-testid="ancestor-id"]', 'ANC001');
    await authenticatedPage.selectOption('[data-testid="relationship"]', 'sire');
    await authenticatedPage.click('[data-testid="save-ancestor"]');

    await expect(authenticatedPage.locator('[data-testid="pedigree-updated"]')).toContainText(
      'Pedigree updated'
    );
  });

  test('Livestock performance analytics', async ({ authenticatedPage }) => {
    // Create test animals with performance data
    await authenticatedPage.click('[data-testid="livestock-tab"]');

    for (let i = 1; i <= 3; i++) {
      await authenticatedPage.click('[data-testid="add-animal-button"]');
      await authenticatedPage.fill('[data-testid="animal-name"]', `Performance Animal ${i}`);
      await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
      await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
      await authenticatedPage.fill('[data-testid="identification-tag"]', `PERF00${i}`);
      await authenticatedPage.fill('[data-testid="acquisition-date"]', '2023-01-01');
      await authenticatedPage.click('[data-testid="save-animal-button"]');
    }

    // Navigate to analytics
    await authenticatedPage.click('[data-testid="livestock-analytics"]');

    // Test performance metrics
    await expect(authenticatedPage.locator('[data-testid="performance-dashboard"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="growth-rates"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="feed-conversion"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="health-metrics"]')).toBeVisible();

    // Test performance comparisons
    await authenticatedPage.click('[data-testid="performance-comparison"]');
    await authenticatedPage.check('[data-testid="compare-weight"]');
    await authenticatedPage.check('[data-testid="compare-health"]');
    await authenticatedPage.click('[data-testid="generate-comparison"]');

    await expect(authenticatedPage.locator('[data-testid="comparison-chart"]')).toBeVisible();

    // Test productivity analysis
    await authenticatedPage.click('[data-testid="productivity-analysis"]');
    await expect(authenticatedPage.locator('[data-testid="productivity-scores"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="efficiency-metrics"]')).toBeVisible();

    // Test breeding performance
    await authenticatedPage.click('[data-testid="breeding-performance"]');
    await expect(authenticatedPage.locator('[data-testid="conception-rates"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="birth-rates"]')).toBeVisible();

    // Test financial performance
    await authenticatedPage.click('[data-testid="financial-performance"]');
    await expect(authenticatedPage.locator('[data-testid="revenue-per-animal"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="cost-per-animal"]')).toBeVisible();

    // Export performance report
    await authenticatedPage.click('[data-testid="export-performance"]');
    await authenticatedPage.selectOption('[data-testid="report-format"]', 'pdf');
    await authenticatedPage.check('[data-testid="include-charts"]');
    await authenticatedPage.click('[data-testid="generate-report"]');

    await expect(authenticatedPage.locator('[data-testid="report-ready"]')).toBeVisible();
  });

  test('Livestock mobile workflow', async ({ authenticatedPage }) => {
    // Set mobile viewport
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });

    await authenticatedPage.click('[data-testid="livestock-tab"]');

    // Test mobile livestock list
    await expect(authenticatedPage.locator('[data-testid="mobile-livestock-list"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="mobile-add-animal"]')).toBeVisible();

    // Test mobile animal creation
    await authenticatedPage.click('[data-testid="mobile-add-animal"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-animal-form"]')).toBeVisible();

    await authenticatedPage.fill('[data-testid="animal-name"]', 'Mobile Test Animal');
    await authenticatedPage.selectOption('[data-testid="animal-species"]', 'Cattle');
    await authenticatedPage.fill('[data-testid="animal-breed"]', 'Angus');
    await authenticatedPage.fill('[data-testid="identification-tag"]', 'MOB001');
    await authenticatedPage.click('[data-testid="save-animal-button"]');

    // Test mobile animal view
    await expect(authenticatedPage.locator('[data-testid="mobile-animal-card"]')).toContainText(
      'Mobile Test Animal'
    );

    // Test mobile health tracking
    await authenticatedPage.click('[data-testid="mobile-animal-card"]');
    await authenticatedPage.click('[data-testid="mobile-health-tab"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-health-form"]')).toBeVisible();

    await authenticatedPage.fill('[data-testid="health-observation"]', 'Healthy');
    await authenticatedPage.click('[data-testid="save-health"]');

    await expect(authenticatedPage.locator('[data-testid="health-success"]')).toContainText(
      'Health record added'
    );
  });
});
