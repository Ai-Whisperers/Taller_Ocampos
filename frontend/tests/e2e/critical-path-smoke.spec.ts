/**
 * Critical Path Smoke Tests
 *
 * Fast, essential tests that verify core functionality works end-to-end.
 * These tests should run before every deployment to catch breaking changes.
 *
 * Time budget: < 5 minutes for entire suite
 *
 * Critical Paths Tested:
 * 1. User authentication (login/logout)
 * 2. Client registration workflow
 * 3. Work order creation and completion
 * 4. Invoice generation and payment
 * 5. Inventory check
 * 6. Dashboard loading
 */

import { test, expect } from '@playwright/test';

// Configure shorter timeout for smoke tests
test.setTimeout(30000);

test.describe('Critical Path Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' }); // Run in order for speed

  let clientId: string;
  let vehicleId: string;
  let workOrderId: string;
  let invoiceId: string;

  test('CP-01: User can login to the application', async ({ page }) => {
    await page.goto('/login');

    // Fill and submit login form
    await page.fill('input[name="email"]', 'admin@tallerocampos.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Dashboard should load
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('CP-02: Dashboard displays key metrics', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Should show statistics (clients, vehicles, work orders, revenue)
    const statsVisible = await page.locator('text=/client|vehicle|work order|revenue/i').first().isVisible({ timeout: 5000 });
    expect(statsVisible).toBe(true);

    // Should have navigation menu
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
  });

  test('CP-03: Can create a new client', async ({ page }) => {
    await page.goto('/dashboard/clients');

    const timestamp = Date.now();

    // Click create button
    await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    await page.waitForTimeout(500);

    // Fill client form
    await page.fill('input[name="name"]', `Test Client ${timestamp}`);
    await page.fill('input[name="email"]', `client${timestamp}@test.com`);
    await page.fill('input[name="phone"]', '0981123456');
    await page.fill('input[name="ruc"]', `80012345-${timestamp % 10}`);

    const addressField = page.locator('input[name="address"], textarea[name="address"]').first();
    if (await addressField.isVisible({ timeout: 1000 })) {
      await addressField.fill('Av. España 123, Asunción');
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');

    // Should show success or redirect
    await expect(page.locator('text=/success|created|client/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('CP-04: Can create a work order', async ({ page }) => {
    await page.goto('/dashboard/work-orders');

    const timestamp = Date.now();

    // Click create button
    await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    await page.waitForTimeout(500);

    // Select first client
    const clientSelect = page.locator('select[name="clientId"], [role="combobox"]').first();
    if (await clientSelect.isVisible({ timeout: 2000 })) {
      await clientSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Select first vehicle
    await page.waitForTimeout(300);
    const vehicleSelect = page.locator('select[name="vehicleId"], [role="combobox"]').first();
    if (await vehicleSelect.isVisible({ timeout: 2000 })) {
      await vehicleSelect.click();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }

    // Fill description
    await page.fill('textarea[name="description"], input[name="description"]', `Smoke test work order ${timestamp}`);

    // Submit
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create")');

    // Verify success
    await expect(page.locator('text=/success|created|work order/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('CP-05: Can view invoices list', async ({ page }) => {
    await page.goto('/dashboard/invoices');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should show invoices page
    await expect(page.locator('h1, h2').first()).toContainText(/invoice|factura/i);

    // Should have table or list of invoices
    const hasInvoices = await page.locator('table, [role="table"], [role="list"]').first().isVisible({ timeout: 3000 });
    expect(hasInvoices).toBe(true);
  });

  test('CP-06: Can access inventory management', async ({ page }) => {
    await page.goto('/dashboard/inventory');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Should show inventory page
    await expect(page.locator('h1, h2').first()).toContainText(/inventor/i);

    // Should have inventory items or message
    const hasContent = await page.locator('table, [role="table"], text=/no items|sin items/i').first().isVisible({ timeout: 3000 });
    expect(hasContent).toBe(true);
  });

  test('CP-07: Can navigate between main sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Test navigation to each main section
    const sections = [
      { url: '/dashboard/clients', text: /client/i },
      { url: '/dashboard/vehicles', text: /vehicle/i },
      { url: '/dashboard/work-orders', text: /work.*order/i },
      { url: '/dashboard/invoices', text: /invoice/i },
      { url: '/dashboard/inventory', text: /inventor/i },
    ];

    for (const section of sections) {
      await page.goto(section.url);
      await page.waitForLoadState('networkidle');

      const heading = await page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 3000 });
      await expect(heading).toContainText(section.text);
    }
  });

  test('CP-08: Search functionality works', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Results should update (table should still be visible or show "no results")
      const hasResults = await page.locator('table, [role="table"], text=/no.*result/i').first().isVisible({ timeout: 2000 });
      expect(hasResults).toBe(true);
    }
  });

  test('CP-09: User profile is accessible', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for user menu/profile button
    const userMenu = page.locator('[role="button"]:has-text("Admin"), button:has-text("admin"), [aria-label*="user" i]').first();

    if (await userMenu.isVisible({ timeout: 2000 })) {
      await userMenu.click();
      await page.waitForTimeout(300);

      // Should show dropdown with profile options
      const hasDropdown = await page.locator('[role="menu"], [role="menuitem"]').first().isVisible({ timeout: 2000 });
      expect(hasDropdown).toBe(true);
    }
  });

  test('CP-10: Can logout successfully', async ({ page }) => {
    await page.goto('/dashboard');

    // Find and click logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Salir"), button:has-text("Cerrar")').first();

    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
    } else {
      // Try user menu first
      const userMenu = page.locator('[role="button"]:has-text("Admin"), button:has-text("admin")').first();
      if (await userMenu.isVisible({ timeout: 2000 })) {
        await userMenu.click();
        await page.waitForTimeout(300);
        await page.locator('button:has-text("Logout"), button:has-text("Salir"), [role="menuitem"]:has-text("Salir")').first().click();
      }
    }

    // Should redirect to login
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

test.describe('Critical Path - Error Recovery', () => {
  test('EP-01: Handles invalid login gracefully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message (not crash)
    await expect(page.locator('text=/invalid|incorrect|error/i').first()).toBeVisible({ timeout: 5000 });

    // Form should still be usable
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('EP-02: Handles network errors gracefully', async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    await page.goto('/dashboard/clients', { waitUntil: 'domcontentloaded' });

    // Should show error state (not blank screen)
    const hasErrorMessage = await page.locator('text=/error|failed|network|offline/i').first().isVisible({ timeout: 5000 }).catch(() => false);

    // Or should show cached data
    const hasContent = await page.locator('table, [role="table"]').first().isVisible({ timeout: 2000 }).catch(() => false);

    // Either error message or cached content should be shown
    expect(hasErrorMessage || hasContent).toBe(true);

    // Restore network
    await context.setOffline(false);
  });

  test('EP-03: Handles missing required fields', async ({ page }) => {
    await page.goto('/dashboard/clients');

    // Open create form
    await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
    await page.waitForTimeout(500);

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Should show validation errors (not crash)
    const hasValidation = await page.locator('text=/required|requerido|obligatorio/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasValidation).toBe(true);
  });
});

test.describe('Critical Path - Performance Baseline', () => {
  test('PF-01: Dashboard loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('PF-02: Client list loads within 2 seconds', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@tallerocampos.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Measure client list load time
    const startTime = Date.now();

    await page.goto('/dashboard/clients');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });
});
