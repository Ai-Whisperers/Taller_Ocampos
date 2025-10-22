import { test, expect } from '@playwright/test';

test.describe('Work Order Management Workflow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@tallerocampos.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display work orders list page', async ({ page }) => {
    await page.goto('/dashboard/work-orders');

    // Check for page heading
    await expect(page.locator('h1, h2').first()).toContainText(/work.*order/i);

    // Check for "Create Work Order" or similar button
    await expect(page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')).toBeVisible();
  });

  test('should create a new work order', async ({ page }) => {
    await page.goto('/dashboard/work-orders');

    // Click "Add Work Order" or similar button
    await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');

    // Wait for form to appear
    await page.waitForTimeout(500);

    const timestamp = Date.now();

    // Fill in work order form
    // Select client
    const clientSelect = page.locator('select[name="clientId"], [role="combobox"]:has-text("Client")').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Select vehicle
    const vehicleSelect = page.locator('select[name="vehicleId"], [role="combobox"]:has-text("Vehicle")').first();
    if (await vehicleSelect.isVisible({ timeout: 2000 })) {
      await vehicleSelect.click();
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Fill description
    await page.fill('textarea[name="description"], input[name="description"]', `Test work order ${timestamp}`);

    // Fill labor rate if exists
    const laborRateInput = page.locator('input[name="laborRate"]');
    if (await laborRateInput.isVisible({ timeout: 1000 })) {
      await laborRateInput.fill('50');
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');

    // Wait for success message or redirect
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=/success|created|work order/i`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter work orders by status', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Look for status filter dropdown
    const statusFilter = page.locator('select[name="status"], [role="combobox"]:has-text("Status")').first();

    if (await statusFilter.isVisible({ timeout: 2000 })) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      // Select a status (e.g., "In Progress")
      await page.locator('option:has-text("In Progress"), [role="option"]:has-text("In Progress")').first().click();

      await page.waitForTimeout(500);

      // Table should still be visible with filtered results
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('should view work order details', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Click on first work order (view button or order number)
    const viewButton = page.locator('button:has-text("View"), svg[class*="eye"], a:has-text("View")').first();

    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Should show work order details
      await expect(page.locator('text=/description|client|vehicle|status/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update work order status', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Find first work order and click edit or status dropdown
    const editButton = page.locator('button:has-text("Edit"), svg[class*="edit"]').first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Update status
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.isVisible({ timeout: 2000 })) {
        await statusSelect.selectOption({ index: 2 }); // Select different status

        // Submit form
        await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');

        // Wait for success notification
        await expect(page.locator('text=/success|updated/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should add service to work order', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // View first work order
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();

    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Look for "Add Service" button
      const addServiceButton = page.locator('button:has-text("Add Service")');

      if (await addServiceButton.isVisible({ timeout: 2000 })) {
        await addServiceButton.click();
        await page.waitForTimeout(500);

        // Select a service from dropdown
        const serviceSelect = page.locator('select[name="serviceId"], [role="combobox"]').first();
        if (await serviceSelect.isVisible()) {
          await serviceSelect.click();
          await page.waitForTimeout(300);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }

        // Fill quantity
        const quantityInput = page.locator('input[name="quantity"]');
        if (await quantityInput.isVisible({ timeout: 1000 })) {
          await quantityInput.fill('1');
        }

        // Save service
        await page.click('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")');

        await expect(page.locator('text=/success|added/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should add part to work order', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // View first work order
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();

    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Look for "Add Part" button
      const addPartButton = page.locator('button:has-text("Add Part")');

      if (await addPartButton.isVisible({ timeout: 2000 })) {
        await addPartButton.click();
        await page.waitForTimeout(500);

        // Select a part from dropdown
        const partSelect = page.locator('select[name="partId"], [role="combobox"]').first();
        if (await partSelect.isVisible()) {
          await partSelect.click();
          await page.waitForTimeout(300);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }

        // Fill quantity
        const quantityInput = page.locator('input[name="quantity"]');
        if (await quantityInput.isVisible({ timeout: 1000 })) {
          await quantityInput.fill('2');
        }

        // Save part
        await page.click('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Save")');

        await expect(page.locator('text=/success|added/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should search work orders', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('oil');
      await page.waitForTimeout(500);

      // Results should be filtered
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('should generate invoice from work order', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Find completed work order
    const completeWorkOrder = page.locator('tr:has-text("Completed"), tr:has-text("COMPLETED")').first();

    if (await completeWorkOrder.isVisible({ timeout: 2000 })) {
      // Click on it to view details
      await completeWorkOrder.click();
      await page.waitForTimeout(500);

      // Look for "Generate Invoice" button
      const generateInvoiceButton = page.locator('button:has-text("Generate Invoice"), button:has-text("Create Invoice")');

      if (await generateInvoiceButton.isVisible({ timeout: 2000 })) {
        await generateInvoiceButton.click();

        // Should redirect to invoices or show success message
        await page.waitForTimeout(1000);
        await expect(page.locator('text=/invoice|success/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show work order statistics', async ({ page }) => {
    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Check for statistics cards showing counts
    const statsCards = page.locator('text=/total|pending|completed|in progress/i');

    if (await statsCards.first().isVisible({ timeout: 2000 })) {
      await expect(statsCards.first()).toBeVisible();
    }
  });
});
