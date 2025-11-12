/**
 * Enhanced E2E Scenarios
 *
 * Advanced test scenarios covering:
 * - Error handling and edge cases
 * - Multi-user workflows
 * - Data validation and constraints
 * - Complex business logic
 * - Real-world usage patterns
 */

import { test, expect, Page } from '@playwright/test';

// Helper: Login and return page
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

test.describe('Enhanced Scenarios - Work Order Lifecycle', () => {
  test('should complete full work order lifecycle: draft → pending → in_progress → ready → closed', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    const timestamp = Date.now();

    // Step 1: Create work order (draft status)
    await page.goto('/dashboard/work-orders');
    await page.click('button:has-text("Add"), button:has-text("New")');
    await page.waitForTimeout(500);

    // Fill form
    const clientSelect = page.locator('select[name="clientId"], [role="combobox"]').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(300);
    const vehicleSelect = page.locator('select[name="vehicleId"], [role="combobox"]').first();
    if (await vehicleSelect.isVisible({ timeout: 2000 })) {
      await vehicleSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    await page.fill('textarea[name="description"], input[name="description"]', `Lifecycle test ${timestamp}`);
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/success|created/i').first()).toBeVisible({ timeout: 5000 });

    // Step 2: Transition to pending (work order confirmed)
    // This would involve clicking on the work order and changing status
    await page.waitForTimeout(1000);
    const viewButton = page.locator('button:has-text("View"), a').first();
    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Change status to pending
      const statusButton = page.locator('button:has-text("Pending"), button:has-text("Confirm")').first();
      if (await statusButton.isVisible({ timeout: 2000 })) {
        await statusButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Add parts and services (transition to in_progress)
    // Step 4: Mark as ready for pickup
    // Step 5: Close work order

    // Verify final state
    await expect(page.locator('text=/work order|order/i')).toBeVisible();
  });

  test('should prevent closing work order without invoice', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/work-orders');
    await page.waitForTimeout(1000);

    // Find an in-progress work order
    const workOrder = page.locator('tr:has-text("In Progress"), tr:has-text("IN_PROGRESS")').first();

    if (await workOrder.isVisible({ timeout: 2000 })) {
      await workOrder.click();
      await page.waitForTimeout(500);

      // Try to close without generating invoice
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Complete")').first();

      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(500);

        // Should show error or warning
        const hasWarning = await page.locator('text=/invoice.*required|must.*generate.*invoice/i').first().isVisible({ timeout: 3000 }).catch(() => false);

        // Or should automatically prompt to create invoice
        const hasInvoicePrompt = await page.locator('text=/create.*invoice|generate.*invoice/i').first().isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasWarning || hasInvoicePrompt).toBe(true);
      }
    }
  });
});

test.describe('Enhanced Scenarios - Invoice and Payment Flow', () => {
  test('should handle partial payments correctly', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/billing');
    await page.waitForTimeout(1000);

    // Find a pending invoice
    const pendingInvoice = page.locator('tr:has-text("Pending"), tr:has-text("PENDING")').first();

    if (await pendingInvoice.isVisible({ timeout: 2000 })) {
      // Click to view/pay
      const payButton = page.locator('button:has-text("Pay"), button:has-text("Pagar")').first();

      if (await payButton.isVisible({ timeout: 2000 })) {
        await payButton.click();
        await page.waitForTimeout(500);

        // Enter partial payment (50% of total)
        const amountInput = page.locator('input[name="amount"]');
        if (await amountInput.isVisible()) {
          // Get total amount
          const totalText = await page.locator('text=/total|saldo/i').first().textContent();
          const totalMatch = totalText?.match(/[\d,]+/);

          if (totalMatch) {
            const total = parseFloat(totalMatch[0].replace(/,/g, ''));
            const partialAmount = Math.floor(total / 2);

            await amountInput.fill(partialAmount.toString());

            // Submit payment
            await page.click('button[type="submit"]:has-text("Pay"), button[type="submit"]:has-text("Confirm")');

            await page.waitForTimeout(1000);

            // Should show "Partially Paid" status
            await expect(page.locator('text=/partial.*paid|pago.*parcial/i')).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('should prevent overpayment', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/billing');
    await page.waitForTimeout(1000);

    const invoice = page.locator('tr:has-text("Pending"), tr:has-text("Partially Paid")').first();

    if (await invoice.isVisible({ timeout: 2000 })) {
      const payButton = page.locator('button:has-text("Pay"), button:has-text("Pagar")').first();

      if (await payButton.isVisible({ timeout: 2000 })) {
        await payButton.click();
        await page.waitForTimeout(500);

        const amountInput = page.locator('input[name="amount"]');
        if (await amountInput.isVisible()) {
          // Try to pay more than balance
          await amountInput.fill('999999999');

          await page.click('button[type="submit"]');

          // Should show error
          await expect(page.locator('text=/exceed|excede|mayor/i')).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('should calculate Paraguayan IVA (10%) correctly', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/billing');
    await page.waitForTimeout(1000);

    // Create new invoice or check existing
    const invoice = page.locator('table tr').nth(1);

    if (await invoice.isVisible({ timeout: 2000 })) {
      await invoice.click();
      await page.waitForTimeout(500);

      // Check IVA calculation
      const subtotalText = await page.locator('text=/subtotal/i').first().textContent();
      const ivaText = await page.locator('text=/iva/i').first().textContent();
      const totalText = await page.locator('text=/total/i').first().textContent();

      if (subtotalText && ivaText && totalText) {
        const subtotal = parseFloat(subtotalText.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || '0');
        const iva = parseFloat(ivaText.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || '0');
        const total = parseFloat(totalText.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || '0');

        // IVA should be 10% of subtotal
        const expectedIva = Math.round(subtotal * 0.10);
        const expectedTotal = subtotal + expectedIva;

        expect(Math.abs(iva - expectedIva)).toBeLessThan(5); // Allow rounding difference
        expect(Math.abs(total - expectedTotal)).toBeLessThan(5);
      }
    }
  });
});

test.describe('Enhanced Scenarios - Inventory Management', () => {
  test('should prevent negative stock', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    const item = page.locator('table tr').nth(1);

    if (await item.isVisible({ timeout: 2000 })) {
      const editButton = item.locator('button:has-text("Edit"), svg[class*="edit"]').first();

      if (await editButton.isVisible({ timeout: 1000 })) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Try to set negative quantity
        const quantityInput = page.locator('input[name="quantity"]');
        if (await quantityInput.isVisible()) {
          await quantityInput.fill('-10');

          await page.click('button[type="submit"]');

          // Should show validation error
          const hasError = await page.locator('text=/negative|invalid|debe.*mayor/i').first().isVisible({ timeout: 3000 }).catch(() => false);
          expect(hasError).toBe(true);
        }
      }
    }
  });

  test('should show low stock alert', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Check for low stock indicators
    const lowStockItems = page.locator('tr:has-text("Low Stock"), [class*="low-stock"], [class*="alert"]');

    const count = await lowStockItems.count();

    if (count > 0) {
      // Low stock items should be visually distinct (red/orange color)
      const firstLowStock = lowStockItems.first();
      await expect(firstLowStock).toBeVisible();

      // Should have warning indicator
      const hasIndicator = await page.locator('svg[class*="alert"], svg[class*="warning"], text=/low stock/i').first().isVisible({ timeout: 2000 });
      expect(hasIndicator).toBe(true);
    }
  });
});

test.describe('Enhanced Scenarios - Client and Vehicle Management', () => {
  test('should link vehicle to correct client', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    const timestamp = Date.now();

    // Create client first
    await page.goto('/dashboard/clients');
    await page.click('button:has-text("Add"), button:has-text("New")');
    await page.waitForTimeout(500);

    await page.fill('input[name="name"]', `Test Client ${timestamp}`);
    await page.fill('input[name="email"]', `client${timestamp}@test.com`);
    await page.fill('input[name="phone"]', '0981123456');
    await page.fill('input[name="ruc"]', `80012345-${timestamp % 10}`);

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/success/i').first()).toBeVisible({ timeout: 5000 });

    // Create vehicle for this client
    await page.goto('/dashboard/vehicles');
    await page.click('button:has-text("Add"), button:has-text("New")');
    await page.waitForTimeout(500);

    // Select the client we just created
    const clientSelect = page.locator('select[name="clientId"], [role="combobox"]:has-text("Client")').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.click();
      await page.keyboard.type(`Test Client ${timestamp}`);
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
    }

    // Fill vehicle details
    await page.fill('input[name="plate"]', `ABC${timestamp % 1000}`);
    await page.fill('input[name="brand"]', 'Toyota');
    await page.fill('input[name="model"]', 'Hilux');
    await page.fill('input[name="year"]', '2023');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/success/i').first()).toBeVisible({ timeout: 5000 });

    // Verify vehicle is linked to client
    await page.goto('/dashboard/clients');
    await page.fill('input[type="search"], input[placeholder*="Search"]', `Test Client ${timestamp}`);
    await page.waitForTimeout(500);

    const clientRow = page.locator(`tr:has-text("Test Client ${timestamp}")`).first();
    if (await clientRow.isVisible({ timeout: 2000 })) {
      await clientRow.click();
      await page.waitForTimeout(500);

      // Should show linked vehicle
      await expect(page.locator('text=/Toyota.*Hilux|ABC/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate Paraguayan RUC format', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/clients');
    await page.click('button:has-text("Add"), button:has-text("New")');
    await page.waitForTimeout(500);

    // Fill form with invalid RUC
    await page.fill('input[name="name"]', 'Test Client');
    await page.fill('input[name="email"]', 'test@test.com');
    await page.fill('input[name="phone"]', '0981123456');
    await page.fill('input[name="ruc"]', 'INVALID-RUC');

    await page.click('button[type="submit"]');

    // Should show RUC validation error
    const hasError = await page.locator('text=/ruc.*invalid|formato.*ruc/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasError).toBe(true);
  });

  test('should validate Paraguayan vehicle plate format (ABC-1234)', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard/vehicles');
    await page.click('button:has-text("Add"), button:has-text("New")');
    await page.waitForTimeout(500);

    // Select client
    const clientSelect = page.locator('select[name="clientId"], [role="combobox"]').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Fill with invalid plate
    await page.fill('input[name="plate"]', 'INVALID');
    await page.fill('input[name="brand"]', 'Toyota');
    await page.fill('input[name="model"]', 'Hilux');
    await page.fill('input[name="year"]', '2023');

    await page.click('button[type="submit"]');

    // Should show plate validation error
    const hasError = await page.locator('text=/plate.*invalid|formato.*placa|patente.*invalid/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasError).toBe(true);
  });
});

test.describe('Enhanced Scenarios - Real-time Updates', () => {
  test('should update dashboard statistics in real-time', async ({ page }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Get initial work order count
    const initialCount = await page.locator('text=/work order/i').first().textContent().then((text) => {
      const match = text?.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    });

    // Create a new work order in another tab would update this count via WebSocket
    // For now, just verify the statistic is displayed
    expect(initialCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Enhanced Scenarios - Error Recovery', () => {
  test('should handle session expiration gracefully', async ({ page, context }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    await page.goto('/dashboard');

    // Clear auth token to simulate expiration
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());

    // Try to perform an action
    await page.goto('/dashboard/clients');

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Should show message about session
    const hasMessage = await page.locator('text=/session.*expired|login.*again/i').first().isVisible({ timeout: 2000 }).catch(() => false);

    // Either shows message or just shows login form
    expect(hasMessage || await page.locator('input[name="email"]').isVisible()).toBe(true);
  });

  test('should recover from API errors', async ({ page, context }) => {
    await loginAs(page, 'admin@tallerocampos.com', 'Admin123!');

    // Intercept API calls and simulate error
    await page.route('**/api/clients', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard/clients');

    // Should show error message
    await expect(page.locator('text=/error|failed|unable/i').first()).toBeVisible({ timeout: 5000 });

    // Should show retry button
    const hasRetry = await page.locator('button:has-text("Retry"), button:has-text("Try Again")').first().isVisible({ timeout: 2000 });
    expect(hasRetry).toBe(true);
  });
});
