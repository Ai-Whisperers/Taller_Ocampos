/**
 * API Contract Tests
 *
 * Validates that the backend API adheres to expected contracts:
 * - Response structure (success, data, error fields)
 * - Status codes (200, 201, 400, 401, 404, 500)
 * - Data types and required fields
 * - Pagination format
 * - Error message format
 *
 * These tests ensure frontend-backend integration stability.
 */

import { test, expect, APIRequestContext } from '@playwright/test';

// API base URL (from environment or default to localhost)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

let authToken: string;

test.describe('API Contract Tests', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    // Create API request context
    apiContext = await playwright.request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });

    // Login and get auth token
    const loginResponse = await apiContext.post('/auth/login', {
      data: {
        email: 'admin@tallerocampos.com',
        password: 'Admin123!',
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.data?.token || loginData.token;
    }
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('Authentication API Contracts', () => {
    test('POST /auth/register should follow registration contract', async () => {
      const timestamp = Date.now();
      const response = await apiContext.post('/auth/register', {
        data: {
          name: `Test User ${timestamp}`,
          email: `testuser${timestamp}@test.com`,
          password: 'TestPass123!',
          role: 'mechanic',
        },
      });

      const data = await response.json();

      // Status should be 201 Created or 200 OK
      expect([200, 201]).toContain(response.status());

      // Response structure
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);

      // User data
      expect(data.data).toHaveProperty('user');
      expect(data.data.user).toHaveProperty('id');
      expect(data.data.user).toHaveProperty('email');
      expect(data.data.user).toHaveProperty('name');
      expect(data.data.user).toHaveProperty('role');

      // Token
      expect(data.data).toHaveProperty('token');
      expect(typeof data.data.token).toBe('string');
      expect(data.data.token.length).toBeGreaterThan(20);

      // Password should NOT be in response
      expect(data.data.user).not.toHaveProperty('password');
    });

    test('POST /auth/login should follow login contract', async () => {
      const response = await apiContext.post('/auth/login', {
        data: {
          email: 'admin@tallerocampos.com',
          password: 'Admin123!',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          user: expect.objectContaining({
            id: expect.any(String),
            email: expect.any(String),
            name: expect.any(String),
            role: expect.any(String),
          }),
          token: expect.any(String),
        },
      });
    });

    test('POST /auth/login should return 401 for invalid credentials', async () => {
      const response = await apiContext.post('/auth/login', {
        data: {
          email: 'invalid@test.com',
          password: 'wrongpassword',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(401);
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });
  });

  test.describe('Clients API Contracts', () => {
    test('GET /clients should follow pagination contract', async () => {
      const response = await apiContext.get('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          page: 1,
          limit: 10,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: expect.any(Array),
      });

      // If pagination is implemented, check metadata
      if (data.pagination) {
        expect(data.pagination).toMatchObject({
          page: expect.any(Number),
          limit: expect.any(Number),
          total: expect.any(Number),
        });
      }

      // Validate client structure
      if (data.data.length > 0) {
        const client = data.data[0];
        expect(client).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          phone: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      }
    });

    test('POST /clients should follow creation contract', async () => {
      const timestamp = Date.now();
      const response = await apiContext.post('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          name: `Test Client ${timestamp}`,
          email: `client${timestamp}@test.com`,
          phone: '0981123456',
          ruc: `80012345-${timestamp % 10}`,
          address: 'Av. España 123, Asunción',
        },
      });

      const data = await response.json();

      expect([200, 201]).toContain(response.status());
      expect(data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          name: expect.stringContaining('Test Client'),
          email: expect.stringContaining('@test.com'),
        }),
      });
    });

    test('GET /clients/:id should return 404 for non-existent client', async () => {
      const response = await apiContext.get('/clients/non-existent-id-12345', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(404);
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });
  });

  test.describe('Work Orders API Contracts', () => {
    test('GET /work-orders should return work orders with status', async () => {
      const response = await apiContext.get('/work-orders', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(Array.isArray(data.data)).toBe(true);

      if (data.data.length > 0) {
        const workOrder = data.data[0];
        expect(workOrder).toMatchObject({
          id: expect.any(String),
          orderNumber: expect.any(String),
          status: expect.stringMatching(/draft|pending|in_progress|ready|closed/),
          clientId: expect.any(String),
          vehicleId: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      }
    });

    test('POST /work-orders should validate required fields', async () => {
      const response = await apiContext.post('/work-orders', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          // Missing required fields
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });
  });

  test.describe('Invoices API Contracts', () => {
    test('GET /invoices should include payment status', async () => {
      const response = await apiContext.get('/invoices', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);

      if (data.data.length > 0) {
        const invoice = data.data[0];
        expect(invoice).toMatchObject({
          id: expect.any(String),
          invoiceNumber: expect.any(String),
          status: expect.stringMatching(/draft|pending|partially_paid|paid|overdue/),
          total: expect.any(Number),
          paidAmount: expect.any(Number),
          iva: expect.any(Number), // Paraguayan IVA
        });

        // IVA should be 10% in Paraguay
        if (invoice.subtotal) {
          const expectedIva = Math.round(invoice.subtotal * 0.1);
          expect(Math.abs(invoice.iva - expectedIva)).toBeLessThan(2); // Allow rounding
        }
      }
    });
  });

  test.describe('Inventory API Contracts', () => {
    test('GET /inventory should include stock levels', async () => {
      const response = await apiContext.get('/inventory', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);

      if (data.data.length > 0) {
        const item = data.data[0];
        expect(item).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          quantity: expect.any(Number),
          price: expect.any(Number),
          minStock: expect.any(Number),
        });

        // Stock should be non-negative
        expect(item.quantity).toBeGreaterThanOrEqual(0);
        expect(item.price).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error Response Contracts', () => {
    test('Should return 401 for unauthenticated requests', async () => {
      const response = await apiContext.get('/clients');

      const data = await response.json();

      expect(response.status()).toBe(401);
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    test('Should return 400 for invalid request body', async () => {
      const response = await apiContext.post('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          // Invalid data (missing required fields)
          invalidField: 'test',
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    test('Should return 500 with error structure on server error', async () => {
      // This test depends on having an endpoint that can trigger a 500
      // Skip if not applicable
      test.skip();
    });
  });

  test.describe('Response Time Contracts', () => {
    test('GET /clients should respond within 2 seconds', async () => {
      const startTime = Date.now();

      const response = await apiContext.get('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });

    test('POST /clients should respond within 3 seconds', async () => {
      const timestamp = Date.now();
      const startTime = Date.now();

      const response = await apiContext.post('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          name: `Test Client ${timestamp}`,
          email: `perf${timestamp}@test.com`,
          phone: '0981123456',
          ruc: `80012345-${timestamp % 10}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect([200, 201]).toContain(response.status());
      expect(responseTime).toBeLessThan(3000);
    });
  });

  test.describe('CORS and Security Headers', () => {
    test('API should include CORS headers', async () => {
      const response = await apiContext.get('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Origin: 'http://localhost:3000',
        },
      });

      const headers = response.headers();

      // Should have CORS headers
      expect(headers).toHaveProperty('access-control-allow-origin');
    });

    test('API should include security headers', async () => {
      const response = await apiContext.get('/clients', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const headers = response.headers();

      // Should have security headers (Helmet)
      // Note: These might vary based on server configuration
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
      ];

      // At least some security headers should be present
      const hasSecurityHeaders = securityHeaders.some((header) => headers[header]);
      expect(hasSecurityHeaders).toBe(true);
    });
  });
});
