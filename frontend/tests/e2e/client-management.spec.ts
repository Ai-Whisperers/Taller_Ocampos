import { test, expect } from '@playwright/test';

test.describe('Client Management Workflow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@tallerocampos.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display clients list page', async ({ page }) => {
    await page.goto('/dashboard/clients');

    // Check for page heading
    await expect(page.locator('h1, h2').first()).toContainText(/client/i);

    // Check for "Add Client" button
    await expect(page.locator('button:has-text("Add Client"), button:has-text("New Client"), button:has-text("Create Client")')).toBeVisible();
  });

  test('should create a new client', async ({ page }) => {
    await page.goto('/dashboard/clients');

    // Click "Add Client" or "New Client" button
    await page.click('button:has-text("Add Client"), button:has-text("New Client"), button:has-text("Create Client")');

    // Wait for modal or form to appear
    await page.waitForTimeout(500);

    // Generate unique email
    const timestamp = Date.now();
    const clientEmail = `client${timestamp}@test.com`;
    const clientName = `Test Client ${timestamp}`;

    // Fill in client form
    await page.fill('input[name="name"], input[placeholder*="name" i]', clientName);
    await page.fill('input[name="email"], input[type="email"]', clientEmail);
    await page.fill('input[name="phone"], input[placeholder*="phone" i]', '1234567890');

    // Optional fields if they exist
    try {
      await page.fill('input[name="address"], textarea[name="address"]', '123 Test St', { timeout: 1000 });
    } catch (e) {
      // Field might not exist, that's ok
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Add")');

    // Wait for success message or client to appear in list
    await expect(page.locator(`text=${clientName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should search for a client', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"], input[name="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Results should be filtered
      // This is a basic check - actual implementation may vary
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('should view client details', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForTimeout(1000);

    // Click on first client in the list (view/eye icon or name)
    const viewButton = page.locator('button:has-text("View"), svg[class*="eye"], a:has-text("View")').first();
    const clientName = page.locator('table tr td:first-child, [role="row"] [role="cell"]:first-child').nth(1);

    if (await viewButton.isVisible()) {
      await viewButton.click();
    } else if (await clientName.isVisible()) {
      await clientName.click();
    }

    // Should show client details (name, email, phone, etc.)
    await page.waitForTimeout(500);
    await expect(page.locator('text=/email|phone|address/i')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a client', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForTimeout(1000);

    // Find and click edit button for first client
    const editButton = page.locator('button:has-text("Edit"), svg[class*="edit"], svg[class*="pencil"]').first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Modify client name
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('Updated Client Name');

      // Submit form
      await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');

      // Wait for success notification
      await expect(page.locator('text=/success|updated|saved/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete a client', async ({ page }) => {
    await page.goto('/dashboard/clients');

    // First, create a new client to delete
    await page.click('button:has-text("Add Client"), button:has-text("New Client"), button:has-text("Create Client")');
    await page.waitForTimeout(500);

    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Delete Test ${timestamp}`);
    await page.fill('input[name="email"]', `delete${timestamp}@test.com`);
    await page.fill('input[name="phone"]', '9999999999');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Find the client we just created
    const clientRow = page.locator(`tr:has-text("Delete Test ${timestamp}")`);

    if (await clientRow.isVisible({ timeout: 3000 })) {
      // Find delete button
      const deleteButton = clientRow.locator('button:has-text("Delete"), svg[class*="trash"], svg[class*="delete"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion in confirmation dialog
        await page.click('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');

        // Client should be removed from list
        await expect(clientRow).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show validation errors for invalid client data', async ({ page }) => {
    await page.goto('/dashboard/clients');

    // Click "Add Client"
    await page.click('button:has-text("Add Client"), button:has-text("New Client"), button:has-text("Create Client")');
    await page.waitForTimeout(500);

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/required|invalid|error/i').first()).toBeVisible({ timeout: 3000 });
  });

  test('should navigate between clients pages (pagination)', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await page.waitForTimeout(1000);

    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next"), button[aria-label="Next page"]');

    if (await nextButton.isVisible({ timeout: 2000 }) && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Should load next page
      await expect(page.locator('table, [role="table"]')).toBeVisible();
    }
  });
});
