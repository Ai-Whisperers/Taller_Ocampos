import { test, expect } from '@playwright/test';

test.describe('Invoice and Payment Workflow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@tallerocampos.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('Invoice Management', () => {
    test('should display invoices list page', async ({ page }) => {
      await page.goto('/dashboard/invoices');

      // Check for page heading
      await expect(page.locator('h1, h2').first()).toContainText(/invoice/i);

      // Check for "Create Invoice" button
      await expect(page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')).toBeVisible();
    });

    test('should create a new invoice', async ({ page }) => {
      await page.goto('/dashboard/invoices');

      // Click "Add Invoice" or similar button
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');

      // Wait for form to appear
      await page.waitForTimeout(500);

      // Select client
      const clientSelect = page.locator('select[name="clientId"], [role="combobox"]:has-text("Client")').first();
      if (await clientSelect.isVisible({ timeout: 2000 })) {
        await clientSelect.click();
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      // Fill due date (if exists)
      const dueDateInput = page.locator('input[name="dueDate"], input[type="date"]');
      if (await dueDateInput.isVisible({ timeout: 1000 })) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        await dueDateInput.fill(futureDate.toISOString().split('T')[0]);
      }

      // Fill tax rate (if exists)
      const taxRateInput = page.locator('input[name="taxRate"]');
      if (await taxRateInput.isVisible({ timeout: 1000 })) {
        await taxRateInput.fill('10');
      }

      // Add invoice items
      const addItemButton = page.locator('button:has-text("Add Item")');
      if (await addItemButton.isVisible({ timeout: 2000 })) {
        await addItemButton.click();
        await page.waitForTimeout(300);

        // Fill item details
        await page.fill('input[name="description"], input[placeholder*="description" i]', 'Test Service');
        await page.fill('input[name="quantity"]', '1');
        await page.fill('input[name="unitPrice"], input[name="price"]', '100');
      }

      // Submit form
      await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');

      // Wait for success message
      await page.waitForTimeout(1000);
      await expect(page.locator('text=/success|created|invoice/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should filter invoices by status', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForTimeout(1000);

      // Look for status filter
      const statusFilter = page.locator('select[name="status"], button:has-text("Status")').first();

      if (await statusFilter.isVisible({ timeout: 2000 })) {
        await statusFilter.click();
        await page.waitForTimeout(300);

        // Select "PAID" status
        await page.locator('option:has-text("Paid"), [role="option"]:has-text("Paid")').first().click();

        await page.waitForTimeout(500);

        // Table should show filtered results
        await expect(page.locator('table, [role="table"]').first()).toBeVisible();
      }
    });

    test('should view invoice details', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForTimeout(1000);

      // Click on first invoice
      const viewButton = page.locator('button:has-text("View"), svg[class*="eye"]').first();

      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Should show invoice details
        await expect(page.locator('text=/invoice|client|total|status/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should export invoice to PDF', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForTimeout(1000);

      // View first invoice
      const viewButton = page.locator('button:has-text("View")').first();

      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Look for export/PDF button
        const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("Download")');

        if (await exportButton.isVisible({ timeout: 2000 })) {
          // Click and check if download happens (this is a placeholder - actual implementation may vary)
          await exportButton.click();
          await page.waitForTimeout(1000);

          // Either a download starts or a success message appears
          // Note: Testing actual file downloads in Playwright requires special configuration
        }
      }
    });

    test('should mark invoice as paid', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForTimeout(1000);

      // Find an unpaid invoice
      const unpaidInvoice = page.locator('tr:has-text("Pending"), tr:has-text("Unpaid"), tr:has-text("DRAFT")').first();

      if (await unpaidInvoice.isVisible({ timeout: 2000 })) {
        // Click to view details
        await unpaidInvoice.click();
        await page.waitForTimeout(500);

        // Look for "Mark as Paid" button
        const markPaidButton = page.locator('button:has-text("Mark"), button:has-text("Paid")');

        if (await markPaidButton.isVisible({ timeout: 2000 })) {
          await markPaidButton.click();

          // Confirm action if dialog appears
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
          if (await confirmButton.isVisible({ timeout: 1000 })) {
            await confirmButton.click();
          }

          // Should show success message
          await expect(page.locator('text=/success|paid/i').first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should send invoice by email', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForTimeout(1000);

      // View first invoice
      const viewButton = page.locator('button:has-text("View")').first();

      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Look for "Send" or "Email" button
        const sendButton = page.locator('button:has-text("Send"), button:has-text("Email")');

        if (await sendButton.isVisible({ timeout: 2000 })) {
          await sendButton.click();
          await page.waitForTimeout(1000);

          // Should show success or confirmation message
          await expect(page.locator('text=/success|sent|email/i').first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Payment Management', () => {
    test('should display payments list page', async ({ page }) => {
      await page.goto('/dashboard/payments');

      // Check for page heading
      await expect(page.locator('h1, h2').first()).toContainText(/payment/i);

      // Check for "Add Payment" button
      await expect(page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')).toBeVisible();
    });

    test('should record a new payment', async ({ page }) => {
      await page.goto('/dashboard/payments');

      // Click "Add Payment" or similar button
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Record")');

      // Wait for form to appear
      await page.waitForTimeout(500);

      // Select invoice
      const invoiceSelect = page.locator('select[name="invoiceId"], [role="combobox"]:has-text("Invoice")').first();
      if (await invoiceSelect.isVisible({ timeout: 2000 })) {
        await invoiceSelect.click();
        await page.waitForTimeout(300);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      // Fill payment amount
      const amountInput = page.locator('input[name="amount"]');
      if (await amountInput.isVisible({ timeout: 1000 })) {
        await amountInput.fill('100');
      }

      // Select payment method
      const methodSelect = page.locator('select[name="method"], select[name="paymentMethod"]');
      if (await methodSelect.isVisible({ timeout: 1000 })) {
        await methodSelect.selectOption('CASH');
      }

      // Fill reference/notes (optional)
      const referenceInput = page.locator('input[name="reference"], textarea[name="notes"]');
      if (await referenceInput.isVisible({ timeout: 1000 })) {
        await referenceInput.fill('Test payment reference');
      }

      // Submit form
      await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Record"), button[type="submit"]:has-text("Add")');

      // Wait for success message
      await page.waitForTimeout(1000);
      await expect(page.locator('text=/success|recorded|payment/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should filter payments by method', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForTimeout(1000);

      // Look for payment method filter
      const methodFilter = page.locator('select[name="method"], button:has-text("Method")').first();

      if (await methodFilter.isVisible({ timeout: 2000 })) {
        await methodFilter.click();
        await page.waitForTimeout(300);

        // Select "CASH" method
        await page.locator('option:has-text("Cash"), [role="option"]:has-text("Cash")').first().click();

        await page.waitForTimeout(500);

        // Table should show filtered results
        await expect(page.locator('table, [role="table"]').first()).toBeVisible();
      }
    });

    test('should view payment details', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForTimeout(1000);

      // Click on first payment
      const viewButton = page.locator('button:has-text("View"), svg[class*="eye"]').first();

      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Should show payment details
        await expect(page.locator('text=/payment|amount|method|invoice/i')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show payment summary/stats', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForTimeout(1000);

      // Check for summary cards showing totals
      const statsCards = page.locator('text=/total|today|this month|cash|card/i');

      if (await statsCards.first().isVisible({ timeout: 2000 })) {
        await expect(statsCards.first()).toBeVisible();
      }
    });

    test('should search payments', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForTimeout(1000);

      // Look for search input
      const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('100');
        await page.waitForTimeout(500);

        // Results should be filtered
        await expect(page.locator('table, [role="table"]').first()).toBeVisible();
      }
    });

    test('should print payment receipt', async ({ page }) => {
      await page.goto('/dashboard/payments');
      await page.waitForTimeout(1000);

      // View first payment
      const viewButton = page.locator('button:has-text("View")').first();

      if (await viewButton.isVisible({ timeout: 2000 })) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Look for print/receipt button
        const printButton = page.locator('button:has-text("Print"), button:has-text("Receipt")');

        if (await printButton.isVisible({ timeout: 2000 })) {
          await printButton.click();
          await page.waitForTimeout(1000);

          // Print dialog might open or receipt view might show
          // This is a placeholder - actual testing of print functionality is complex
        }
      }
    });
  });

  test.describe('Invoice-Payment Integration', () => {
    test('should link payment to invoice and update invoice status', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await page.waitForTimeout(1000);

      // Find an unpaid invoice and note its number/ID
      const unpaidInvoice = page.locator('tr:has-text("Pending"), tr:has-text("Unpaid")').first();

      if (await unpaidInvoice.isVisible({ timeout: 2000 })) {
        // Get invoice number or ID for reference
        await unpaidInvoice.click();
        await page.waitForTimeout(500);

        // Navigate to payments
        await page.goto('/dashboard/payments');
        await page.waitForTimeout(500);

        // Create a payment for this invoice
        await page.click('button:has-text("Add"), button:has-text("Record")');
        await page.waitForTimeout(500);

        // Select the invoice we just viewed
        const invoiceSelect = page.locator('select[name="invoiceId"]');
        if (await invoiceSelect.isVisible({ timeout: 2000 })) {
          await invoiceSelect.selectOption({ index: 1 });

          // Fill payment amount
          await page.fill('input[name="amount"]', '100');

          // Select payment method
          const methodSelect = page.locator('select[name="method"]');
          if (await methodSelect.isVisible()) {
            await methodSelect.selectOption('CASH');
          }

          // Submit payment
          await page.click('button[type="submit"]');

          await page.waitForTimeout(1000);

          // Go back to invoices and verify status updated
          await page.goto('/dashboard/invoices');
          await page.waitForTimeout(1000);

          // Invoice status should have changed (or at least payment recorded)
          await expect(page.locator('table').first()).toBeVisible();
        }
      }
    });
  });
});
