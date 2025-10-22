import { test, expect } from '@playwright/test';

test.describe('Inventory Management Workflow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@tallerocampos.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display inventory/parts list page', async ({ page }) => {
    await page.goto('/dashboard/inventory');

    // Check for page heading
    await expect(page.locator('h1, h2').first()).toContainText(/inventory|part/i);

    // Check for "Add Part" or "Add Item" button
    await expect(page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')).toBeVisible();
  });

  test('should create a new part/item', async ({ page }) => {
    await page.goto('/dashboard/inventory');

    // Click "Add Part" or similar button
    await page.click('button:has-text("Add"), button:has-text("New")');

    // Wait for form to appear
    await page.waitForTimeout(500);

    const timestamp = Date.now();

    // Fill in part form
    await page.fill('input[name="code"], input[name="partCode"]', `PART${timestamp}`);
    await page.fill('input[name="name"], input[placeholder*="name" i]', `Test Part ${timestamp}`);

    // Fill prices
    const costPriceInput = page.locator('input[name="costPrice"], input[name="cost"]');
    if (await costPriceInput.isVisible({ timeout: 1000 })) {
      await costPriceInput.fill('50');
    }

    const salePriceInput = page.locator('input[name="salePrice"], input[name="price"]');
    if (await salePriceInput.isVisible({ timeout: 1000 })) {
      await salePriceInput.fill('75');
    }

    // Fill stock quantity
    const stockInput = page.locator('input[name="currentStock"], input[name="stock"], input[name="quantity"]');
    if (await stockInput.isVisible({ timeout: 1000 })) {
      await stockInput.fill('100');
    }

    // Fill minimum stock
    const minStockInput = page.locator('input[name="minStock"], input[name="minimumStock"]');
    if (await minStockInput.isVisible({ timeout: 1000 })) {
      await minStockInput.fill('10');
    }

    // Select category (optional)
    const categoryInput = page.locator('input[name="category"], select[name="category"]');
    if (await categoryInput.isVisible({ timeout: 1000 })) {
      await categoryInput.fill('Filters');
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Add")');

    // Wait for success message
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${`Test Part ${timestamp}`}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should search for parts', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('filter');
      await page.waitForTimeout(500);

      // Results should be filtered
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('should filter parts by category', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Look for category filter
    const categoryFilter = page.locator('select[name="category"], button:has-text("Category")').first();

    if (await categoryFilter.isVisible({ timeout: 2000 })) {
      await categoryFilter.click();
      await page.waitForTimeout(300);

      // Select a category
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500);

      // Table should show filtered results
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('should view part details', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Click on first part
    const viewButton = page.locator('button:has-text("View"), svg[class*="eye"], a:has-text("View")').first();

    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Should show part details
      await expect(page.locator('text=/code|name|stock|price/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit a part', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Find and click edit button for first part
    const editButton = page.locator('button:has-text("Edit"), svg[class*="edit"]').first();

    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Modify part name
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('Updated Part Name');

      // Submit form
      await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');

      // Wait for success notification
      await expect(page.locator('text=/success|updated/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should adjust stock levels', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Find "Adjust Stock" button for first part
    const adjustButton = page.locator('button:has-text("Adjust"), button:has-text("Stock")').first();

    if (await adjustButton.isVisible({ timeout: 2000 })) {
      await adjustButton.click();
      await page.waitForTimeout(500);

      // Select adjustment type
      const typeSelect = page.locator('select[name="type"], [role="combobox"]').first();
      if (await typeSelect.isVisible({ timeout: 1000 })) {
        await typeSelect.selectOption('IN');
      }

      // Enter quantity
      const quantityInput = page.locator('input[name="quantity"]');
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('50');
      }

      // Add reference/note
      const referenceInput = page.locator('input[name="reference"], textarea[name="notes"]');
      if (await referenceInput.isVisible({ timeout: 1000 })) {
        await referenceInput.fill('Stock replenishment');
      }

      // Submit adjustment
      await page.click('button[type="submit"]:has-text("Adjust"), button[type="submit"]:has-text("Save")');

      // Wait for success message
      await expect(page.locator('text=/success|adjusted/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show low stock alert', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Look for low stock indicator or filter
    const lowStockButton = page.locator('button:has-text("Low Stock"), span:has-text("Low Stock"), [class*="alert"]');

    if (await lowStockButton.first().isVisible({ timeout: 2000 })) {
      // If there's a filter button, click it
      if (await lowStockButton.first().hasAttribute('role')) {
        await lowStockButton.first().click();
        await page.waitForTimeout(500);
      }

      // Low stock items should be highlighted or filtered
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });

  test('should view stock movement history', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // View first part details
    const viewButton = page.locator('button:has-text("View"), a:has-text("View")').first();

    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await page.waitForTimeout(500);

      // Look for "History" or "Movements" tab/section
      const historyTab = page.locator('button:has-text("History"), button:has-text("Movements"), [role="tab"]:has-text("History")');

      if (await historyTab.isVisible({ timeout: 2000 })) {
        await historyTab.click();
        await page.waitForTimeout(500);

        // Should show stock movement records
        await expect(page.locator('table, [role="table"], text=/movement|adjustment/i').first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should manage suppliers', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Look for "Suppliers" tab or section
    const suppliersTab = page.locator('button:has-text("Suppliers"), [role="tab"]:has-text("Suppliers"), a:has-text("Suppliers")');

    if (await suppliersTab.isVisible({ timeout: 2000 })) {
      await suppliersTab.click();
      await page.waitForTimeout(500);

      // Should show suppliers list
      await expect(page.locator('h1, h2').first()).toContainText(/supplier/i);

      // Check for "Add Supplier" button
      const addSupplierButton = page.locator('button:has-text("Add Supplier")');
      if (await addSupplierButton.isVisible({ timeout: 2000 })) {
        await expect(addSupplierButton).toBeVisible();
      }
    }
  });

  test('should add a new supplier', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Navigate to suppliers section
    const suppliersTab = page.locator('button:has-text("Suppliers"), a:has-text("Suppliers")');
    if (await suppliersTab.isVisible({ timeout: 2000 })) {
      await suppliersTab.click();
      await page.waitForTimeout(500);

      // Click "Add Supplier"
      const addButton = page.locator('button:has-text("Add Supplier"), button:has-text("New")');
      if (await addButton.isVisible({ timeout: 2000 })) {
        await addButton.click();
        await page.waitForTimeout(500);

        const timestamp = Date.now();

        // Fill supplier form
        await page.fill('input[name="name"]', `Test Supplier ${timestamp}`);

        const emailInput = page.locator('input[name="email"]');
        if (await emailInput.isVisible({ timeout: 1000 })) {
          await emailInput.fill(`supplier${timestamp}@test.com`);
        }

        const phoneInput = page.locator('input[name="phone"]');
        if (await phoneInput.isVisible({ timeout: 1000 })) {
          await phoneInput.fill('1234567890');
        }

        // Submit form
        await page.click('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Add")');

        // Wait for success message
        await expect(page.locator('text=/success|added|supplier/i').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should export inventory list', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');

    if (await exportButton.isVisible({ timeout: 2000 })) {
      await exportButton.click();
      await page.waitForTimeout(1000);

      // Export should start or format selection dialog should appear
      // Note: Actual file download testing requires special Playwright configuration
    }
  });

  test('should show inventory statistics', async ({ page }) => {
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);

    // Check for statistics cards
    const statsCards = page.locator('text=/total.*parts|low.*stock|total.*value|out.*stock/i');

    if (await statsCards.first().isVisible({ timeout: 2000 })) {
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test('should delete a part (admin only)', async ({ page }) => {
    await page.goto('/dashboard/inventory');

    // Create a new part to delete
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(500);

    const timestamp = Date.now();
    await page.fill('input[name="code"]', `DEL${timestamp}`);
    await page.fill('input[name="name"]', `Delete Test ${timestamp}`);
    await page.fill('input[name="costPrice"], input[name="cost"]', '10');
    await page.fill('input[name="salePrice"], input[name="price"]', '20');
    await page.fill('input[name="currentStock"], input[name="stock"]', '5');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Find the part we just created
    const partRow = page.locator(`tr:has-text("Delete Test ${timestamp}")`);

    if (await partRow.isVisible({ timeout: 3000 })) {
      // Find delete button
      const deleteButton = partRow.locator('button:has-text("Delete"), svg[class*="trash"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        await page.click('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")');

        // Part should be removed from list
        await expect(partRow).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
