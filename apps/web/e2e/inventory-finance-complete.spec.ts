import { test, expect, generateTestInventoryItem } from './setup/test-setup';

test.describe('Inventory and Finance Management - Complete Coverage', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
  });

  test.describe('Inventory Management', () => {
    test('Complete inventory workflow', async ({ authenticatedPage }) => {
      // Navigate to inventory page
      await authenticatedPage.click('[data-testid="inventory-tab"]');
      await expect(authenticatedPage.locator('h1')).toContainText('Inventory Management');

      // Test add inventory item
      await authenticatedPage.click('[data-testid="add-inventory-button"]');
      await expect(authenticatedPage.locator('h2')).toContainText('Add Inventory Item');

      // Test form validation
      await authenticatedPage.click('[data-testid="save-inventory-button"]');
      await expect(authenticatedPage.locator('[data-testid="item-name-error"]')).toContainText(
        'Item name is required'
      );
      await expect(authenticatedPage.locator('[data-testid="category-error"]')).toContainText(
        'Category is required'
      );
      await expect(authenticatedPage.locator('[data-testid="quantity-error"]')).toContainText(
        'Quantity is required'
      );

      // Test successful item creation
      const testItem = generateTestInventoryItem();
      await authenticatedPage.fill('[data-testid="item-name"]', testItem.name);
      await authenticatedPage.selectOption('[data-testid="item-category"]', testItem.category);
      await authenticatedPage.fill('[data-testid="item-quantity"]', testItem.quantity.toString());
      await authenticatedPage.selectOption('[data-testid="item-unit"]', testItem.unit);
      await authenticatedPage.fill(
        '[data-testid="cost-per-unit"]',
        testItem.cost_per_unit.toString()
      );
      await authenticatedPage.fill(
        '[data-testid="reorder-level"]',
        testItem.reorder_level.toString()
      );
      await authenticatedPage.selectOption('[data-testid="supplier"]', 'Farm Supply Co');
      await authenticatedPage.fill('[data-testid="item-description"]', 'Test inventory item');

      await authenticatedPage.click('[data-testid="save-inventory-button"]');

      // Should return to inventory list
      await expect(authenticatedPage.locator('[data-testid="inventory-list"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="inventory-item"]')).toContainText(
        testItem.name
      );

      // Test item details view
      await authenticatedPage.click('[data-testid="view-item-details"]');
      await expect(authenticatedPage.locator('[data-testid="item-details"]')).toContainText(
        testItem.name
      );
      await expect(authenticatedPage.locator('[data-testid="item-quantity"]')).toContainText(
        testItem.quantity.toString()
      );
      await expect(authenticatedPage.locator('[data-testid="item-value"]')).toContainText(
        (testItem.quantity * testItem.cost_per_unit).toString()
      );

      // Test stock adjustment
      await authenticatedPage.click('[data-testid="stock-adjustment"]');
      await authenticatedPage.selectOption('[data-testid="adjustment-type"]', 'add');
      await authenticatedPage.fill('[data-testid="adjustment-quantity"]', '10');
      await authenticatedPage.fill('[data-testid="adjustment-reason"]', 'New stock received');
      await authenticatedPage.click('[data-testid="save-adjustment"]');

      await expect(authenticatedPage.locator('[data-testid="adjustment-success"]')).toContainText(
        'Stock adjusted'
      );

      // Test low stock alerts
      // Reduce stock to trigger alert
      await authenticatedPage.click('[data-testid="stock-adjustment"]');
      await authenticatedPage.selectOption('[data-testid="adjustment-type"]', 'remove');
      await authenticatedPage.fill('[data-testid="adjustment-quantity"]', '95');
      await authenticatedPage.fill('[data-testid="adjustment-reason"]', 'Used in operations');
      await authenticatedPage.click('[data-testid="save-adjustment"]');

      await expect(authenticatedPage.locator('[data-testid="low-stock-alert"]')).toBeVisible();

      // Test item editing
      await authenticatedPage.click('[data-testid="edit-item"]');
      await authenticatedPage.fill('[data-testid="item-name"]', 'Updated Item Name');
      await authenticatedPage.click('[data-testid="save-inventory-button"]');

      await expect(authenticatedPage.locator('[data-testid="inventory-item"]')).toContainText(
        'Updated Item Name'
      );

      // Test item deletion
      await authenticatedPage.click('[data-testid="delete-item"]');
      await authenticatedPage.click('[data-testid="confirm-delete"]');

      await expect(authenticatedPage.locator('[data-testid="inventory-item"]')).not.toBeVisible();
    });

    test('Inventory categories and bulk operations', async ({ authenticatedPage }) => {
      // Create items in different categories
      await authenticatedPage.click('[data-testid="inventory-tab"]');

      const categories = [
        { name: 'Feed', items: ['Corn Feed', 'Soybean Meal'] },
        { name: 'Medicine', items: ['Antibiotics', 'Vaccines'] },
        { name: 'Equipment', items: ['Shovel', 'Bucket'] },
      ];

      for (const category of categories) {
        for (const itemName of category.items) {
          await authenticatedPage.click('[data-testid="add-inventory-button"]');
          await authenticatedPage.fill('[data-testid="item-name"]', itemName);
          await authenticatedPage.selectOption('[data-testid="item-category"]', category.name);
          await authenticatedPage.fill('[data-testid="item-quantity"]', '50');
          await authenticatedPage.selectOption('[data-testid="item-unit"]', 'kg');
          await authenticatedPage.fill('[data-testid="cost-per-unit"]', '10');
          await authenticatedPage.click('[data-testid="save-inventory-button"]');
        }
      }

      // Test category filtering
      await authenticatedPage.selectOption('[data-testid="category-filter"]', 'Feed');
      await expect(authenticatedPage.locator('[data-testid="inventory-item"]')).toHaveCount(2);

      // Test bulk operations
      await authenticatedPage.selectOption('[data-testid="category-filter"]', 'all');
      await authenticatedPage.check('[data-testid="select-all-items"]');
      await expect(authenticatedPage.locator('[data-testid="bulk-actions"]')).toBeVisible();

      // Test bulk price update
      await authenticatedPage.click('[data-testid="bulk-price-update"]');
      await authenticatedPage.fill('[data-testid="price-increase"]', '10');
      await authenticatedPage.selectOption('[data-testid="price-type"]', 'percentage');
      await authenticatedPage.click('[data-testid="apply-price-update"]');

      await expect(authenticatedPage.locator('[data-testid="price-update-success"]')).toContainText(
        'Prices updated'
      );

      // Test bulk category change
      await authenticatedPage.check('[data-testid="select-all-items"]');
      await authenticatedPage.click('[data-testid="bulk-category-change"]');
      await authenticatedPage.selectOption('[data-testid="new-category"]', 'Supplies');
      await authenticatedPage.click('[data-testid="apply-category-change"]');

      await expect(
        authenticatedPage.locator('[data-testid="category-update-success"]')
      ).toContainText('Categories updated');
    });

    test('Inventory reporting and analytics', async ({ authenticatedPage }) => {
      // Create test inventory data
      await authenticatedPage.click('[data-testid="inventory-tab"]');

      const items = [
        { name: 'Premium Feed', category: 'Feed', quantity: 100, cost: 25 },
        { name: 'Basic Feed', category: 'Feed', quantity: 200, cost: 15 },
        { name: 'Medical Supplies', category: 'Medicine', quantity: 50, cost: 100 },
      ];

      for (const item of items) {
        await authenticatedPage.click('[data-testid="add-inventory-button"]');
        await authenticatedPage.fill('[data-testid="item-name"]', item.name);
        await authenticatedPage.selectOption('[data-testid="item-category"]', item.category);
        await authenticatedPage.fill('[data-testid="item-quantity"]', item.quantity.toString());
        await authenticatedPage.selectOption('[data-testid="item-unit"]', 'kg');
        await authenticatedPage.fill('[data-testid="cost-per-unit"]', item.cost.toString());
        await authenticatedPage.click('[data-testid="save-inventory-button"]');
      }

      // Test inventory analytics
      await authenticatedPage.click('[data-testid="inventory-analytics"]');
      await expect(authenticatedPage.locator('[data-testid="inventory-dashboard"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-value"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="category-breakdown"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="low-stock-items"]')).toBeVisible();

      // Test inventory turnover
      await authenticatedPage.click('[data-testid="turnover-analysis"]');
      await expect(authenticatedPage.locator('[data-testid="turnover-rates"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="slow-moving-items"]')).toBeVisible();

      // Test cost analysis
      await authenticatedPage.click('[data-testid="cost-analysis"]');
      await expect(authenticatedPage.locator('[data-testid="cost-trends"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="supplier-comparison"]')).toBeVisible();

      // Export inventory report
      await authenticatedPage.click('[data-testid="export-inventory"]');
      await authenticatedPage.selectOption('[data-testid="report-format"]', 'excel');
      await authenticatedPage.check('[data-testid="include-valuations"]');
      await authenticatedPage.click('[data-testid="generate-report"]');

      await expect(authenticatedPage.locator('[data-testid="report-ready"]')).toBeVisible();
    });
  });

  test.describe('Financial Management', () => {
    test('Complete financial workflow', async ({ authenticatedPage }) => {
      // Navigate to finance page
      await authenticatedPage.click('[data-testid="finance-tab"]');
      await expect(authenticatedPage.locator('h1')).toContainText('Financial Management');

      // Test add income transaction
      await authenticatedPage.click('[data-testid="add-transaction"]');
      await authenticatedPage.selectOption('[data-testid="transaction-type"]', 'income');
      await authenticatedPage.fill('[data-testid="transaction-amount"]', '5000.00');
      await authenticatedPage.fill('[data-testid="transaction-description"]', 'Crop sales - Q1');
      await authenticatedPage.selectOption('[data-testid="transaction-category"]', 'crop_sales');
      await authenticatedPage.fill(
        '[data-testid="transaction-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.selectOption('[data-testid="payment-method"]', 'bank_transfer');
      await authenticatedPage.fill('[data-testid="customer-name"]', 'Farmers Market');

      await authenticatedPage.click('[data-testid="save-transaction"]');

      await expect(authenticatedPage.locator('[data-testid="transaction-success"]')).toContainText(
        'Transaction added'
      );

      // Test add expense transaction
      await authenticatedPage.click('[data-testid="add-transaction"]');
      await authenticatedPage.selectOption('[data-testid="transaction-type"]', 'expense');
      await authenticatedPage.fill('[data-testid="transaction-amount"]', '1500.00');
      await authenticatedPage.fill(
        '[data-testid="transaction-description"]',
        'Fertilizer purchase'
      );
      await authenticatedPage.selectOption('[data-testid="transaction-category"]', 'supplies');
      await authenticatedPage.fill(
        '[data-testid="transaction-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.selectOption('[data-testid="payment-method"]', 'credit_card');
      await authenticatedPage.fill('[data-testid="vendor-name"]', 'AgriSupply Store');

      await authenticatedPage.click('[data-testid="save-transaction"]');

      await expect(authenticatedPage.locator('[data-testid="transaction-success"]')).toContainText(
        'Transaction added'
      );

      // Test transaction list view
      await expect(authenticatedPage.locator('[data-testid="transaction-list"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="income-total"]')).toContainText('5000');
      await expect(authenticatedPage.locator('[data-testid="expense-total"]')).toContainText(
        '1500'
      );
      await expect(authenticatedPage.locator('[data-testid="net-balance"]')).toContainText('3500');

      // Test transaction editing
      await authenticatedPage.click('[data-testid="edit-transaction"]');
      await authenticatedPage.fill('[data-testid="transaction-amount"]', '5500.00');
      await authenticatedPage.click('[data-testid="save-transaction"]');

      await expect(authenticatedPage.locator('[data-testid="income-total"]')).toContainText('5500');

      // Test transaction search and filtering
      await authenticatedPage.fill('[data-testid="transaction-search"]', 'Fertilizer');
      await expect(authenticatedPage.locator('[data-testid="transaction-item"]')).toHaveCount(1);

      await authenticatedPage.fill('[data-testid="transaction-search"]', '');
      await authenticatedPage.selectOption('[data-testid="type-filter"]', 'income');
      await expect(authenticatedPage.locator('[data-testid="transaction-item"]')).toHaveCount(1);

      // Test transaction deletion
      await authenticatedPage.selectOption('[data-testid="type-filter"]', 'all');
      await authenticatedPage.click('[data-testid="delete-transaction"]');
      await authenticatedPage.click('[data-testid="confirm-delete"]');

      await expect(authenticatedPage.locator('[data-testid="transaction-item"]')).toHaveCount(1);
    });

    test('Budget management', async ({ authenticatedPage }) => {
      // Navigate to budget section
      await authenticatedPage.click('[data-testid="finance-tab"]');
      await authenticatedPage.click('[data-testid="budget-management"]');

      // Test create budget
      await authenticatedPage.click('[data-testid="create-budget"]');
      await authenticatedPage.fill('[data-testid="budget-name"]', '2024 Annual Budget');
      await authenticatedPage.fill('[data-testid="budget-period"]', '2024-01-01');
      await authenticatedPage.fill('[data-testid="budget-end-period"]', '2024-12-31');
      await authenticatedPage.fill('[data-testid="total-budget"]', '100000');

      // Add budget categories
      await authenticatedPage.click('[data-testid="add-budget-category"]');
      await authenticatedPage.selectOption('[data-testid="category-name"]', 'feed');
      await authenticatedPage.fill('[data-testid="category-budget"]', '30000');
      await authenticatedPage.click('[data-testid="save-category"]');

      await authenticatedPage.click('[data-testid="add-budget-category"]');
      await authenticatedPage.selectOption('[data-testid="category-name"]', 'supplies');
      await authenticatedPage.fill('[data-testid="category-budget"]', '20000');
      await authenticatedPage.click('[data-testid="save-category"]');

      await authenticatedPage.click('[data-testid="save-budget"]');

      await expect(authenticatedPage.locator('[data-testid="budget-success"]')).toContainText(
        'Budget created'
      );

      // Test budget tracking
      await authenticatedPage.click('[data-testid="budget-tracking"]');
      await expect(authenticatedPage.locator('[data-testid="budget-progress"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="category-spending"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="budget-remaining"]')).toBeVisible();

      // Test budget alerts
      // Add some expenses to trigger alerts
      await authenticatedPage.click('[data-testid="finance-tab"]');
      await authenticatedPage.click('[data-testid="add-transaction"]');
      await authenticatedPage.selectOption('[data-testid="transaction-type"]', 'expense');
      await authenticatedPage.fill('[data-testid="transaction-amount"]', '25000');
      await authenticatedPage.selectOption('[data-testid="transaction-category"]', 'feed');
      await authenticatedPage.fill('[data-testid="transaction-description"]', 'Feed purchase');
      await authenticatedPage.click('[data-testid="save-transaction"]');

      await authenticatedPage.click('[data-testid="budget-tracking"]');
      await expect(authenticatedPage.locator('[data-testid="budget-warning"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="category-alert"]')).toContainText(
        'Feed'
      );
    });

    test('Financial reporting and analytics', async ({ authenticatedPage }) => {
      // Create test financial data
      await authenticatedPage.click('[data-testid="finance-tab"]');

      const transactions = [
        { type: 'income', amount: 10000, category: 'crop_sales', description: 'Wheat sales' },
        { type: 'income', amount: 5000, category: 'livestock_sales', description: 'Cattle sales' },
        { type: 'expense', amount: 3000, category: 'feed', description: 'Feed purchase' },
        { type: 'expense', amount: 2000, category: 'labor', description: 'Wages' },
        { type: 'expense', amount: 1500, category: 'equipment', description: 'Tractor repair' },
      ];

      for (const transaction of transactions) {
        await authenticatedPage.click('[data-testid="add-transaction"]');
        await authenticatedPage.selectOption('[data-testid="transaction-type"]', transaction.type);
        await authenticatedPage.fill(
          '[data-testid="transaction-amount"]',
          transaction.amount.toString()
        );
        await authenticatedPage.fill(
          '[data-testid="transaction-description"]',
          transaction.description
        );
        await authenticatedPage.selectOption(
          '[data-testid="transaction-category"]',
          transaction.category
        );
        await authenticatedPage.click('[data-testid="save-transaction"]');
      }

      // Test financial dashboard
      await authenticatedPage.click('[data-testid="financial-dashboard"]');
      await expect(authenticatedPage.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="expense-chart"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="profit-loss-chart"]')).toBeVisible();

      // Test profit and loss statement
      await authenticatedPage.click('[data-testid="profit-loss"]');
      await expect(authenticatedPage.locator('[data-testid="p-l-statement"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-revenue"]')).toContainText(
        '15000'
      );
      await expect(authenticatedPage.locator('[data-testid="total-expenses"]')).toContainText(
        '6500'
      );
      await expect(authenticatedPage.locator("[data-testid='net-profit']")).toContainText('8500');

      // Test cash flow analysis
      await authenticatedPage.click('[data-testid="cash-flow"]');
      await expect(authenticatedPage.locator('[data-testid="cash-flow-statement"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="operating-cash-flow"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="investing-cash-flow"]')).toBeVisible();

      // Test financial ratios
      await authenticatedPage.click('[data-testid="financial-ratios"]');
      await expect(authenticatedPage.locator('[data-testid="profitability-ratios"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="liquidity-ratios"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="efficiency-ratios"]')).toBeVisible();

      // Test trend analysis
      await authenticatedPage.click('[data-testid="trend-analysis"]');
      await expect(authenticatedPage.locator('[data-testid="revenue-trends"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="expense-trends"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="profit-trends"]')).toBeVisible();

      // Export financial reports
      await authenticatedPage.click('[data-testid="export-reports"]');
      await authenticatedPage.selectOption('[data-testid="report-type"]', 'profit_loss');
      await authenticatedPage.selectOption('[data-testid="report-format"]', 'pdf');
      await authenticatedPage.check('[data-testid="include-charts"]');
      await authenticatedPage.click('[data-testid="generate-report"]');

      await expect(authenticatedPage.locator('[data-testid="report-ready"]')).toBeVisible();
    });

    test('Invoice and billing management', async ({ authenticatedPage }) => {
      // Navigate to invoicing
      await authenticatedPage.click('[data-testid="finance-tab"]');
      await authenticatedPage.click('[data-testid="invoicing"]');

      // Test create invoice
      await authenticatedPage.click('[data-testid="create-invoice"]');
      await authenticatedPage.fill('[data-testid="invoice-number"]', 'INV-2024-001');
      await authenticatedPage.selectOption('[data-testid="customer-select"]', 'Farmers Market');
      await authenticatedPage.fill(
        '[data-testid="invoice-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.fill(
        '[data-testid="due-date"]',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      // Add invoice items
      await authenticatedPage.click('[data-testid="add-invoice-item"]');
      await authenticatedPage.fill('[data-testid="item-description"]', 'Organic Wheat - 1000kg');
      await authenticatedPage.fill('[data-testid="item-quantity"]', '1000');
      await authenticatedPage.fill('[data-testid="item-unit-price"]', '5.00');
      await authenticatedPage.click('[data-testid="save-item"]');

      await authenticatedPage.click('[data-testid="add-invoice-item"]');
      await authenticatedPage.fill('[data-testid="item-description"]', 'Transportation');
      await authenticatedPage.fill('[data-testid="item-quantity"]', '1');
      await authenticatedPage.fill('[data-testid="item-unit-price"]', '200.00');
      await authenticatedPage.click('[data-testid="save-item"]');

      await authenticatedPage.click('[data-testid="save-invoice"]');

      await expect(authenticatedPage.locator('[data-testid="invoice-success"]')).toContainText(
        'Invoice created'
      );

      // Test invoice list
      await expect(authenticatedPage.locator('[data-testid="invoice-list"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="invoice-item"]')).toContainText(
        'INV-2024-001'
      );

      // Test invoice details
      await authenticatedPage.click('[data-testid="view-invoice"]');
      await expect(authenticatedPage.locator('[data-testid="invoice-details"]')).toContainText(
        'INV-2024-001'
      );
      await expect(authenticatedPage.locator('[data-testid="invoice-total"]')).toContainText(
        '5200.00'
      );

      // Test invoice status update
      await authenticatedPage.click('[data-testid="update-status"]');
      await authenticatedPage.selectOption('[data-testid="invoice-status"]', 'sent');
      await authenticatedPage.click('[data-testid="save-status"]');

      await expect(authenticatedPage.locator('[data-testid="status-updated"]')).toContainText(
        'Status updated'
      );

      // Test payment recording
      await authenticatedPage.click('[data-testid="record-payment"]');
      await authenticatedPage.fill('[data-testid="payment-amount"]', '5200.00');
      await authenticatedPage.fill(
        '[data-testid="payment-date"]',
        new Date().toISOString().split('T')[0]
      );
      await authenticatedPage.selectOption('[data-testid="payment-method"]', 'bank_transfer');
      await authenticatedPage.click('[data-testid="save-payment"]');

      await expect(authenticatedPage.locator('[data-testid="payment-recorded"]')).toContainText(
        'Payment recorded'
      );
      await expect(authenticatedPage.locator('[data-testid="invoice-status"]')).toContainText(
        'paid'
      );
    });
  });

  test('Mobile inventory and finance workflow', async ({ authenticatedPage }) => {
    // Set mobile viewport
    await authenticatedPage.setViewportSize({ width: 375, height: 667 });

    // Test mobile inventory
    await authenticatedPage.click('[data-testid="inventory-tab"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-inventory-list"]')).toBeVisible();

    await authenticatedPage.click('[data-testid="mobile-add-inventory"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-inventory-form"]')).toBeVisible();

    await authenticatedPage.fill('[data-testid="item-name"]', 'Mobile Test Item');
    await authenticatedPage.selectOption('[data-testid="item-category"]', 'Feed');
    await authenticatedPage.fill('[data-testid="item-quantity"]', '50');
    await authenticatedPage.click('[data-testid="save-inventory-button"]');

    // Test mobile finance
    await authenticatedPage.click('[data-testid="finance-tab"]');
    await expect(authenticatedPage.locator('[data-testid="mobile-finance-summary"]')).toBeVisible();

    await authenticatedPage.click('[data-testid="mobile-add-transaction"]');
    await expect(
      authenticatedPage.locator('[data-testid="mobile-transaction-form"]')
    ).toBeVisible();

    await authenticatedPage.selectOption('[data-testid="transaction-type"]', 'expense');
    await authenticatedPage.fill('[data-testid="transaction-amount"]', '100');
    await authenticatedPage.selectOption('[data-testid="transaction-category"]', 'supplies');
    await authenticatedPage.click('[data-testid="save-transaction"]');

    await expect(authenticatedPage.locator('[data-testid="transaction-success"]')).toContainText(
      'Transaction added'
    );
  });
});
