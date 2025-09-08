import { test, expect } from '@playwright/test';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    await expect(page).toHaveTitle(/Login.*Mechanics Shop Management/);
  });

  test('should validate form fields', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/v1/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'owner@testshop.com',
            firstName: 'John',
            lastName: 'Smith',
            role: 'owner'
          },
          shops: [{
            id: '1',
            name: 'Test Auto Repair'
          }],
          tokens: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 900
          }
        })
      });
    });

    await page.fill('[data-testid="email-input"]', 'owner@testshop.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123');
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show welcome message or user info
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('John Smith');
  });

  test('should handle login errors gracefully', async ({ page }) => {
    await page.route('**/api/v1/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid credentials'
        })
      });
    });

    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should show loading state during login', async ({ page }) => {
    // Delay the response to test loading state
    await page.route('**/api/v1/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    const loginButton = page.locator('[data-testid="login-button"]');
    await loginButton.click();

    // Should show loading state immediately
    await expect(loginButton).toBeDisabled();
    await expect(loginButton).toContainText('Signing in...');
  });

  test('should be accessible', async ({ page }) => {
    // Check basic accessibility
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    
    // Inputs should have proper labels
    await expect(emailInput).toHaveAttribute('aria-label', 'Email address');
    await expect(passwordInput).toHaveAttribute('aria-label', 'Password');
    
    // Should be keyboard navigable
    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    
    // Form should be properly sized for mobile
    const form = page.locator('[data-testid="login-form"]');
    const boundingBox = await form.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/api/v1/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should maintain loading state for extended period
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
    
    // Should not timeout immediately
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
  });
});