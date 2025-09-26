import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');

    // Check for registration form elements
    await expect(page.locator('h1')).toContainText('Register');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.locator('button[type="submit"]').click();

    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.locator('button[type="submit"]').click();

    // Wait for error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully register a new user', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email
    const timestamp = Date.now();
    const email = `testuser${timestamp}@test.com`;

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard or show success message
    await expect(page).toHaveURL(/\/(dashboard|login)/, { timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page, context }) => {
    // First, ensure we have a test user (this would normally be seeded)
    await page.goto('/login');

    // Fill login form with test credentials
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Check for authentication token in storage
    const localStorage = await page.evaluate(() => window.localStorage);
    expect(localStorage).toHaveProperty('token');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard
    await page.waitForURL('/dashboard');

    // Look for logout button and click it
    await page.locator('button:has-text("Logout")').click();

    // Should redirect to login page
    await expect(page).toHaveURL('/login', { timeout: 10000 });

    // Check that token is removed
    const localStorage = await page.evaluate(() => window.localStorage);
    expect(localStorage.token).toBeUndefined();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });
});