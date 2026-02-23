import { test, expect } from './setup/test-setup';

test.describe('Reporting and Analytics - Complete Coverage', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
  });

  test.describe('Dashboard Analytics', () => {
    test('Complete dashboard analytics workflow', async ({ authenticatedPage }) => {
      // Navigate to analytics dashboard
      await authenticatedPage.click('[data-testid="analytics-tab"]');
      await expect(authenticatedPage.locator('h1')).toContainText('Farm Analytics');

      // Test overview metrics
      await expect(authenticatedPage.locator('[data-testid="overview-metrics"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-farms"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-fields"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-animals"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-crops"]')).toBeVisible();

      // Test performance charts
      await expect(authenticatedPage.locator('[data-testid="performance-chart"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="yield-chart"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="revenue-chart"]')).toBeVisible();

      // Test time range filters
      await authenticatedPage.click('[data-testid="time-range-filter"]');
      await authenticatedPage.selectOption('[data-testid="preset-range"]', 'last-30-days');
      await authenticatedPage.click('[data-testid="apply-filter"]');

      // Verify charts update
      await expect(authenticatedPage.locator('[data-testid="chart-updated"]')).toBeVisible();

      // Test custom date range
      await authenticatedPage.click('[data-testid="custom-range"]');
      await authenticatedPage.fill('[data-testid="start-date"]', '2024-01-01');
      await authenticatedPage.fill('[data-testid="end-date"]', '2024-12-31');
      await authenticatedPage.click('[data-testid="apply-custom-range"]');

      // Test metric comparisons
      await authenticatedPage.click('[data-testid="comparison-mode"]');
      await authenticatedPage.selectOption('[data-testid="compare-period"]', 'previous-year');
      await authenticatedPage.click('[data-testid="enable-comparison"]');

      await expect(authenticatedPage.locator('[data-testid="comparison-data"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="growth-indicators"]')).toBeVisible();

      // Test export dashboard
      await authenticatedPage.click('[data-testid="export-dashboard"]');
      await authenticatedPage.selectOption('[data-testid="export-format"]', 'pdf');
      await authenticatedPage.check('[data-testid="include-charts"]');
      await authenticatedPage.click('[data-testid="generate-export"]');

      await expect(authenticatedPage.locator('[data-testid="export-ready"]')).toBeVisible();
    });

    test('Real-time analytics monitoring', async ({ authenticatedPage }) => {
      // Navigate to real-time monitoring
      await authenticatedPage.click('[data-testid="analytics-tab"]');
      await authenticatedPage.click('[data-testid="real-time-monitoring"]');

      // Test live metrics
      await expect(authenticatedPage.locator('[data-testid="live-metrics"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="current-weather"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="soil-moisture"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="equipment-status"]')).toBeVisible();

      // Test alert system
      await expect(authenticatedPage.locator('[data-testid="alert-panel"]')).toBeVisible();
      await authenticatedPage.click('[data-testid="configure-alerts"]');

      await authenticatedPage.check('[data-testid="weather-alerts"]');
      await authenticatedPage.check('[data-testid="maintenance-alerts"]');
      await authenticatedPage.check('[data-testid="inventory-alerts"]');
      await authenticatedPage.click('[data-testid="save-alert-settings"]');

      await expect(authenticatedPage.locator('[data-testid="alerts-configured"]')).toContainText(
        'Alert settings saved'
      );

      // Test notification preferences
      await authenticatedPage.click('[data-testid="notification-settings"]');
      await authenticatedPage.selectOption('[data-testid="alert-method"]', 'email');
      await authenticatedPage.fill('[data-testid="notification-email"]', 'farmer@farmersboot.com');
      await authenticatedPage.click('[data-testid="save-notifications"]');

      await expect(authenticatedPage.locator('[data-testid="notifications-saved"]')).toContainText(
        'Notification preferences saved'
      );
    });
  });

  test.describe('Crop Analytics', () => {
    test('Complete crop analytics workflow', async ({ authenticatedPage }) => {
      // Navigate to crop analytics
      await authenticatedPage.click('[data-testid="crops-tab"]');
      await authenticatedPage.click('[data-testid="crop-analytics"]');

      // Test crop performance metrics
      await expect(authenticatedPage.locator('[data-testid="crop-performance"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="yield-analysis"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="growth-tracking"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="health-monitoring"]')).toBeVisible();

      // Test field comparison
      await authenticatedPage.click('[data-testid="field-comparison"]');
      await authenticatedPage.selectOption('[data-testid="field-select-1"]', 'north-field');
      await authenticatedPage.selectOption('[data-testid="field-select-2"]', 'south-field');
      await authenticatedPage.selectOption('[data-testid="comparison-metric"]', 'yield');
      await authenticatedPage.click('[data-testid="compare-fields"]');

      await expect(authenticatedPage.locator('[data-testid="comparison-results"]')).toBeVisible();
      await expect(
        authenticatedPage.locator('[data-testid="field-performance-chart"]')
      ).toBeVisible();

      // Test seasonal analysis
      await authenticatedPage.click('[data-testid="seasonal-analysis"]');
      await authenticatedPage.selectOption('[data-testid="season"]', 'summer');
      await authenticatedPage.selectOption('[data-testid="year"]', '2024');
      await authenticatedPage.click('[data-testid="analyze-season"]');

      await expect(authenticatedPage.locator('[data-testid="seasonal-results"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="seasonal-trends"]')).toBeVisible();

      // Test crop rotation analysis
      await authenticatedPage.click('[data-testid="rotation-analysis"]');
      await authenticatedPage.selectOption('[data-testid="rotation-cycle"]', '4-year');
      await authenticatedPage.click('[data-testid="analyze-rotation"]');

      await expect(
        authenticatedPage.locator('[data-testid="rotation-recommendations"]')
      ).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="soil-health-impact"]')).toBeVisible();

      // Test predictive analytics
      await authenticatedPage.click('[data-testid="predictive-analytics"]');
      await authenticatedPage.selectOption('[data-testid="prediction-type"]', 'yield');
      await authenticatedPage.selectOption('[data-testid="prediction-horizon"]', '3-months');
      await authenticatedPage.click('[data-testid="generate-prediction"]');

      await expect(authenticatedPage.locator('[data-testid="prediction-results"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="confidence-intervals"]')).toBeVisible();
    });

    test('Crop health and disease analytics', async ({ authenticatedPage }) => {
      // Navigate to crop health analytics
      await authenticatedPage.click('[data-testid="crops-tab"]');
      await authenticatedPage.click('[data-testid="health-analytics"]');

      // Test disease monitoring
      await expect(authenticatedPage.locator('[data-testid="disease-monitoring"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="symptom-tracking"]')).toBeVisible();
      await expect(
        authenticatedPage.locator('[data-testid="treatment-effectiveness"]')
      ).toBeVisible();

      // Test pest analysis
      await authenticatedPage.click('[data-testid="pest-analysis"]');
      await authenticatedPage.selectOption('[data-testid="pest-type"]', 'insects');
      await authenticatedPage.selectOption('[data-testid="time-period"]', 'current-season');
      await authenticatedPage.click('[data-testid="analyze-pests"]');

      await expect(authenticatedPage.locator('[data-testid="pest-report"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="infestation-map"]')).toBeVisible();

      // Test treatment recommendations
      await authenticatedPage.click('[data-testid="treatment-recommendations"]');
      await authenticatedPage.selectOption('[data-testid="issue-type"]', 'fungal-disease');
      await authenticatedPage.selectOption('[data-testid="crop-type"]', 'wheat');
      await authenticatedPage.click('[data-testid="get-recommendations"]');

      await expect(authenticatedPage.locator('[data-testid="treatment-options"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="prevention-tips"]')).toBeVisible();

      // Test chemical usage tracking
      await authenticatedPage.click('[data-testid="chemical-tracking"]');
      await expect(authenticatedPage.locator('[data-testid="chemical-usage"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="application-records"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="residue-monitoring"]')).toBeVisible();
    });
  });

  test.describe('Livestock Analytics', () => {
    test('Complete livestock analytics workflow', async ({ authenticatedPage }) => {
      // Navigate to livestock analytics
      await authenticatedPage.click('[data-testid="livestock-tab"]');
      await authenticatedPage.click('[data-testid="livestock-analytics"]');

      // Test herd performance
      await expect(authenticatedPage.locator('[data-testid="herd-performance"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="growth-rates"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="feed-conversion"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="reproduction-rates"]')).toBeVisible();

      // Test breeding analytics
      await authenticatedPage.click('[data-testid="breeding-analytics"]');
      await authenticatedPage.selectOption('[data-testid="breeding-metric"]', 'conception-rate');
      await authenticatedPage.selectOption('[data-testid="time-period"]', 'last-12-months');
      await authenticatedPage.click('[data-testid="analyze-breeding"]');

      await expect(authenticatedPage.locator('[data-testid="breeding-results"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="genetic-diversity"]')).toBeVisible();

      // Test health analytics
      await authenticatedPage.click('[data-testid="health-analytics"]');
      await expect(authenticatedPage.locator('[data-testid="health-metrics"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="disease-prevalence"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="vaccination-coverage"]')).toBeVisible();

      // Test financial performance
      await authenticatedPage.click('[data-testid="financial-performance"]');
      await expect(authenticatedPage.locator('[data-testid="revenue-per-animal"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="cost-analysis"]')).toBeVisible();
      await expect(
        authenticatedPage.locator('[data-testid="profitability-metrics"]')
      ).toBeVisible();

      // Test benchmarking
      await authenticatedPage.click('[data-testid="industry-benchmarking"]');
      await authenticatedPage.selectOption('[data-testid="benchmark-type"]', 'weight-gain');
      await authenticatedPage.selectOption('[data-testid="industry-standard"]', 'regional');
      await authenticatedPage.click('[data-testid="run-benchmark"]');

      await expect(authenticatedPage.locator('[data-testid="benchmark-results"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="performance-ranking"]')).toBeVisible();
    });

    test('Livestock nutrition and feed analytics', async ({ authenticatedPage }) => {
      // Navigate to nutrition analytics
      await authenticatedPage.click('[data-testid="livestock-tab"]');
      await authenticatedPage.click('[data-testid="nutrition-analytics"]');

      // Test feed efficiency
      await expect(authenticatedPage.locator('[data-testid="feed-efficiency"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="nutritional-analysis"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="cost-per-unit"]')).toBeVisible();

      // Test diet optimization
      await authenticatedPage.click('[data-testid="diet-optimization"]');
      await authenticatedPage.selectOption('[data-testid="animal-category"]', 'dairy-cattle');
      await authenticatedPage.selectOption('[data-testid="production-goal"]', 'milk-yield');
      await authenticatedPage.click('[data-testid="optimize-diet"]');

      await expect(authenticatedPage.locator('[data-testid="diet-recommendations"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="nutrient-breakdown"]')).toBeVisible();

      // Test supplement analysis
      await authenticatedPage.click('[data-testid="supplement-analysis"]');
      await authenticatedPage.selectOption('[data-testid="supplement-type"]', 'vitamins');
      await authenticatedPage.click('[data-testid="analyze-supplements"]');

      await expect(
        authenticatedPage.locator('[data-testid="supplement-effectiveness"]')
      ).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="roi-analysis"]')).toBeVisible();
    });
  });

  test.describe('Financial Analytics', () => {
    test('Complete financial analytics workflow', async ({ authenticatedPage }) => {
      // Navigate to financial analytics
      await authenticatedPage.click('[data-testid="finance-tab"]');
      await authenticatedPage.click('[data-testid="financial-analytics"]');

      // Test profit analysis
      await expect(authenticatedPage.locator('[data-testid="profit-analysis"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="revenue-breakdown"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="cost-analysis"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="profit-margins"]')).toBeVisible();

      // Test cash flow analysis
      await authenticatedPage.click('[data-testid="cash-flow-analysis"]');
      await authenticatedPage.selectOption('[data-testid="cash-flow-period"]', 'quarterly');
      await authenticatedPage.click('[data-testid="analyze-cash-flow"]');

      await expect(authenticatedPage.locator('[data-testid="cash-flow-statement"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="working-capital"]')).toBeVisible();

      // Test investment analysis
      await authenticatedPage.click('[data-testid="investment-analysis"]');
      await authenticatedPage.selectOption('[data-testid="investment-type"]', 'equipment');
      await authenticatedPage.fill('[data-testid="investment-amount"]', '50000');
      await authenticatedPage.fill('[data-testid="expected-return"]', '15');
      await authenticatedPage.click('[data-testid="analyze-investment"]');

      await expect(authenticatedPage.locator('[data-testid="investment-metrics"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="payback-period"]')).toBeVisible();

      // Test budget variance analysis
      await authenticatedPage.click('[data-testid="budget-variance"]');
      await authenticatedPage.selectOption('[data-testid="budget-period"]', 'current-quarter');
      await authenticatedPage.click('[data-testid="analyze-variance"]');

      await expect(authenticatedPage.locator('[data-testid="variance-report"]')).toBeVisible();
      await expect(
        authenticatedPage.locator('[data-testid="variance-explanations"]')
      ).toBeVisible();

      // Test scenario analysis
      await authenticatedPage.click('[data-testid="scenario-analysis"]');
      await authenticatedPage.selectOption('[data-testid="scenario-type"]', 'price-change');
      await authenticatedPage.fill('[data-testid="price-change"]', '-10');
      await authenticatedPage.click('[data-testid="run-scenario"]');

      await expect(authenticatedPage.locator('[data-testid="scenario-results"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="impact-assessment"]')).toBeVisible();
    });

    test('Market and commodity analytics', async ({ authenticatedPage }) => {
      // Navigate to market analytics
      await authenticatedPage.click('[data-testid="finance-tab"]');
      await authenticatedPage.click('[data-testid="market-analytics"]');

      // Test commodity price tracking
      await expect(authenticatedPage.locator('[data-testid="price-tracking"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="price-trends"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="price-alerts"]')).toBeVisible();

      // Test market analysis
      await authenticatedPage.click('[data-testid="market-analysis"]');
      await authenticatedPage.selectOption('[data-testid="commodity"]', 'wheat');
      await authenticatedPage.selectOption('[data-testid="market-region"]', 'local');
      await authenticatedPage.click('[data-testid="analyze-market"]');

      await expect(authenticatedPage.locator('[data-testid="market-report"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="supply-demand"]')).toBeVisible();

      // Test competitor analysis
      await authenticatedPage.click('[data-testid="competitor-analysis"]');
      await authenticatedPage.selectOption('[data-testid="analysis-metric"]', 'pricing');
      await authenticatedPage.click('[data-testid="analyze-competitors"]');

      await expect(authenticatedPage.locator('[data-testid="competitor-report"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="market-position"]')).toBeVisible();
    });
  });

  test.describe('Custom Reports', () => {
    test('Complete custom report builder workflow', async ({ authenticatedPage }) => {
      // Navigate to custom reports
      await authenticatedPage.click('[data-testid="reports-tab"]');
      await authenticatedPage.click('[data-testid="custom-reports"]');

      // Test report creation wizard
      await authenticatedPage.click('[data-testid="create-report"]');
      await authenticatedPage.fill('[data-testid="report-name"]', 'Q1 Performance Report');
      await authenticatedPage.selectOption('[data-testid="report-type"]', 'performance');
      await authenticatedPage.click('[data-testid="next-step"]');

      // Test data source selection
      await authenticatedPage.check('[data-testid="include-crops"]');
      await authenticatedPage.check('[data-testid="include-livestock"]');
      await authenticatedPage.check('[data-testid="include-financial"]');
      await authenticatedPage.click('[data-testid="next-step"]');

      // Test metric selection
      await authenticatedPage.check('[data-testid="metric-yield"]');
      await authenticatedPage.check('[data-testid="metric-revenue"]');
      await authenticatedPage.check('[data-testid="metric-costs"]');
      await authenticatedPage.click('[data-testid="next-step"]');

      // Test visualization selection
      await authenticatedPage.selectOption('[data-testid="chart-type-1"]', 'line');
      await authenticatedPage.selectOption('[data-testid="chart-type-2"]', 'bar');
      await authenticatedPage.selectOption('[data-testid="chart-type-3"]', 'pie');
      await authenticatedPage.click('[data-testid="next-step"]');

      // Test scheduling
      await authenticatedPage.check('[data-testid="schedule-report"]');
      await authenticatedPage.selectOption('[data-testid="frequency"]', 'monthly');
      await authenticatedPage.selectOption('[data-testid="delivery-method"]', 'email');
      await authenticatedPage.fill('[data-testid="recipients"]', 'manager@farmersboot.com');
      await authenticatedPage.click('[data-testid="create-report"]');

      await expect(authenticatedPage.locator('[data-testid="report-created"]')).toContainText(
        'Report created successfully'
      );

      // Test report preview
      await authenticatedPage.click('[data-testid="preview-report"]');
      await expect(authenticatedPage.locator('[data-testid="report-preview"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="preview-charts"]')).toBeVisible();

      // Test report customization
      await authenticatedPage.click('[data-testid="customize-report"]');
      await authenticatedPage.selectOption('[data-testid="color-scheme"]', 'farm-theme');
      await authenticatedPage.check('[data-testid="include-logo"]');
      await authenticatedPage.check('[data-testid="include-footer"]');
      await authenticatedPage.click('[data-testid="save-customization"]');

      await expect(authenticatedPage.locator('[data-testid="customization-saved"]')).toContainText(
        'Customization saved'
      );

      // Test report sharing
      await authenticatedPage.click('[data-testid="share-report"]');
      await authenticatedPage.selectOption('[data-testid="share-method"]', 'link');
      await authenticatedPage.check('[data-testid="allow-download"]');
      await authenticatedPage.click('[data-testid="generate-share-link"]');

      await expect(authenticatedPage.locator('[data-testid="share-link-generated"]')).toBeVisible();
    });

    test('Report templates and library', async ({ authenticatedPage }) => {
      // Navigate to report library
      await authenticatedPage.click('[data-testid="reports-tab"]');
      await authenticatedPage.click('[data-testid="report-library"]');

      // Test template browsing
      await expect(authenticatedPage.locator('[data-testid="template-categories"]')).toBeVisible();
      await authenticatedPage.selectOption('[data-testid="category-filter"]', 'financial');
      await expect(authenticatedPage.locator('[data-testid="template-list"]')).toBeVisible();

      // Test template usage
      await authenticatedPage.click('[data-testid="use-template"]');
      await authenticatedPage.selectOption('[data-testid="template"]', 'monthly-performance');
      await authenticatedPage.click('[data-testid="apply-template"]');

      await expect(authenticatedPage.locator('[data-testid="template-applied"]')).toContainText(
        'Template applied'
      );

      // Test report scheduling
      await authenticatedPage.click('[data-testid="scheduled-reports"]');
      await expect(authenticatedPage.locator('[data-testid="schedule-list"]')).toBeVisible();

      await authenticatedPage.click('[data-testid="add-schedule"]');
      await authenticatedPage.selectOption(
        '[data-testid="report-select"]',
        'Q1 Performance Report'
      );
      await authenticatedPage.selectOption('[data-testid="schedule"]', 'quarterly');
      await authenticatedPage.fill('[data-testid="next-run"]', '2024-04-01');
      await authenticatedPage.click('[data-testid="save-schedule"]');

      await expect(authenticatedPage.locator('[data-testid="schedule-saved"]')).toContainText(
        'Schedule saved'
      );

      // Test report history
      await authenticatedPage.click('[data-testid="report-history"]');
      await expect(authenticatedPage.locator('[data-testid="history-list"]')).toBeVisible();
      await authenticatedPage.selectOption('[data-testid="history-filter"]', 'last-30-days');
      await authenticatedPage.click('[data-testid="apply-filter"]');

      await expect(authenticatedPage.locator('[data-testid="filtered-history"]')).toBeVisible();
    });
  });

  test.describe('Data Export and Integration', () => {
    test('Complete data export workflow', async ({ authenticatedPage }) => {
      // Navigate to data export
      await authenticatedPage.click('[data-testid="settings-tab"]');
      await authenticatedPage.click('[data-testid="data-export"]');

      // Test export configuration
      await authenticatedPage.click('[data-testid="configure-export"]');
      await authenticatedPage.check('[data-testid="export-crops"]');
      await authenticatedPage.check('[data-testid="export-livestock"]');
      await authenticatedPage.check('[data-testid="export-financial"]');
      await authenticatedPage.check('[data-testid="export-inventory"]');
      await authenticatedPage.click('[data-testid="save-configuration"]');

      await expect(authenticatedPage.locator('[data-testid="configuration-saved"]')).toContainText(
        'Export configuration saved'
      );

      // Test manual export
      await authenticatedPage.click('[data-testid="manual-export"]');
      await authenticatedPage.selectOption('[data-testid="export-format"]', 'csv');
      await authenticatedPage.selectOption('[data-testid="date-range"]', 'last-year');
      await authenticatedPage.check('[data-testid="include-headers"]');
      await authenticatedPage.click('[data-testid="start-export"]');

      await expect(authenticatedPage.locator('[data-testid="export-progress"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="export-complete"]')).toContainText(
        'Export completed'
      );

      // Test automated exports
      await authenticatedPage.click('[data-testid="automated-exports"]');
      await authenticatedPage.click('[data-testid="add-automation"]');
      await authenticatedPage.selectOption('[data-testid="export-frequency"]', 'weekly');
      await authenticatedPage.selectOption('[data-testid="delivery-method"]', 'ftp');
      await authenticatedPage.fill('[data-testid="ftp-server"]', 'ftp.farmersboot.com');
      await authenticatedPage.click('[data-testid="save-automation"]');

      await expect(authenticatedPage.locator('[data-testid="automation-saved"]')).toContainText(
        'Automation saved'
      );

      // Test API integration
      await authenticatedPage.click('[data-testid="api-integration"]');
      await authenticatedPage.click('[data-testid="generate-api-key"]');
      await expect(authenticatedPage.locator('[data-testid="api-key"]')).toBeVisible();
      await authenticatedPage.click('[data-testid="copy-api-key"]');

      await expect(authenticatedPage.locator('[data-testid="api-key-copied"]')).toContainText(
        'API key copied'
      );

      // Test webhook configuration
      await authenticatedPage.click('[data-testid="webhook-config"]');
      await authenticatedPage.fill(
        '[data-testid="webhook-url"]',
        'https://api.farmersboot.com/webhook'
      );
      await authenticatedPage.selectOption('[data-testid="webhook-events"]', 'data-updated');
      await authenticatedPage.click('[data-testid="save-webhook"]');

      await expect(authenticatedPage.locator('[data-testid="webhook-saved"]')).toContainText(
        'Webhook saved'
      );
    });
  });

  test('Mobile analytics experience', async ({ authenticatedPage }) => {
    // Set mobile viewport
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });

    // Test mobile analytics dashboard
    await authenticatedPage.click('[data-testid="analytics-tab"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-analytics"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="mobile-metrics"]')).toBeVisible();

    // Test mobile chart interaction
    await authenticatedPage.click('[data-testid="mobile-chart-tab"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-chart"]')).toBeVisible();

    // Test mobile report generation
    await authenticatedPage.click('[data-testid="mobile-reports"]');
    await authenticatedPage.click('[data-testid="mobile-generate-report"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-report-options"]')).toBeVisible();

    // Test mobile data export
    await authenticatedPage.click('[data-testid="mobile-export"]');
    await authenticatedPage.selectOption('[data-testid="mobile-export-format"]', 'pdf');
    await authenticatedPage.click('[data-testid="mobile-start-export"]');

    await expect(authenticatedPage.locator('[data-testid="mobile-export-progress"]')).toBeVisible();
  });
});
