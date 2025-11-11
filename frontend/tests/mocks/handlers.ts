/**
 * Mock Service Worker (MSW) Request Handlers
 *
 * Defines API endpoint mocks for testing without hitting the real backend.
 * All handlers use test data factories for consistent, realistic responses.
 */

import { http, HttpResponse, delay } from 'msw';
import {
  createClients,
  createClient,
  createVehicles,
  createVehicle,
  createWorkOrders,
  createWorkOrder,
  createInvoices,
  createInvoice,
  createPayments,
  createPayment,
  createInventoryParts,
  createInventoryPart,
  createAuthResponse,
  createFailedAuthResponse,
  createUser,
  testUsers,
  testCredentials,
} from '../fixtures';

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Simulates network delay for more realistic testing
 */
async function simulateNetworkDelay(ms: number = 100) {
  await delay(ms);
}

export const handlers = [
  // ============================================================================
  // Authentication Endpoints
  // ============================================================================

  // POST /api/auth/login
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as { email: string; password: string };

    // Check for test credentials
    if (body.email === testCredentials.valid().email && body.password === testCredentials.valid().password) {
      return HttpResponse.json(createAuthResponse());
    }

    if (body.email === testCredentials.admin().email && body.password === testCredentials.admin().password) {
      return HttpResponse.json(createAuthResponse(testUsers.admin()));
    }

    // Invalid credentials
    return HttpResponse.json(
      createFailedAuthResponse('Invalid credentials'),
      { status: 401 }
    );
  }),

  // POST /api/auth/register
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as { name: string; email: string; password: string; phone?: string };

    // Check if email already exists (for testing duplicate email scenario)
    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    const user = createUser({
      email: body.email,
      name: body.name,
      phone: body.phone,
    });

    return HttpResponse.json(createAuthResponse(user));
  }),

  // GET /api/auth/me
  http.get(`${API_BASE_URL}/auth/me`, async () => {
    await simulateNetworkDelay();

    const token = 'mock-token'; // In real tests, extract from Authorization header

    if (!token) {
      return HttpResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: testUsers.regular(),
    });
  }),

  // ============================================================================
  // Dashboard Endpoints
  // ============================================================================

  // GET /api/dashboard/stats
  http.get(`${API_BASE_URL}/dashboard/stats`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: {
        totalClients: 142,
        totalVehicles: 267,
        activeWorkOrders: 23,
        totalRevenue: 12500000,
        recentWorkOrders: createWorkOrders(5),
        lowStockItems: 8,
      },
    });
  }),

  // ============================================================================
  // Client Endpoints
  // ============================================================================

  // GET /api/clients
  http.get(`${API_BASE_URL}/clients`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: createClients(10),
    });
  }),

  // GET /api/clients/:id
  http.get(`${API_BASE_URL}/clients/:id`, async ({ params }) => {
    await simulateNetworkDelay();

    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: createClient({ id: id as string }),
    });
  }),

  // POST /api/clients
  http.post(`${API_BASE_URL}/clients`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createClient(body),
      message: 'Cliente creado exitosamente',
    }, { status: 201 });
  }),

  // PUT /api/clients/:id
  http.put(`${API_BASE_URL}/clients/:id`, async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createClient({ id: id as string, ...body }),
      message: 'Cliente actualizado exitosamente',
    });
  }),

  // DELETE /api/clients/:id
  http.delete(`${API_BASE_URL}/clients/:id`, async ({ params }) => {
    await simulateNetworkDelay();

    const { id } = params;

    // Simulate constraint error if client has vehicles
    if (id === 'client-with-vehicles') {
      return HttpResponse.json({
        success: false,
        error: 'Cannot delete client with existing vehicles',
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    });
  }),

  // ============================================================================
  // Vehicle Endpoints
  // ============================================================================

  // GET /api/vehicles
  http.get(`${API_BASE_URL}/vehicles`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: createVehicles(15),
    });
  }),

  // GET /api/vehicles/:id
  http.get(`${API_BASE_URL}/vehicles/:id`, async ({ params }) => {
    await simulateNetworkDelay();

    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: createVehicle({ id: id as string }),
    });
  }),

  // POST /api/vehicles
  http.post(`${API_BASE_URL}/vehicles`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createVehicle(body),
      message: 'Vehículo creado exitosamente',
    }, { status: 201 });
  }),

  // PUT /api/vehicles/:id
  http.put(`${API_BASE_URL}/vehicles/:id`, async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createVehicle({ id: id as string, ...body }),
      message: 'Vehículo actualizado exitosamente',
    });
  }),

  // DELETE /api/vehicles/:id
  http.delete(`${API_BASE_URL}/vehicles/:id`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      message: 'Vehículo eliminado exitosamente',
    });
  }),

  // ============================================================================
  // Work Order Endpoints
  // ============================================================================

  // GET /api/work-orders
  http.get(`${API_BASE_URL}/work-orders`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: createWorkOrders(12),
    });
  }),

  // GET /api/work-orders/:id
  http.get(`${API_BASE_URL}/work-orders/:id`, async ({ params }) => {
    await simulateNetworkDelay();

    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: createWorkOrder({ id: id as string }),
    });
  }),

  // POST /api/work-orders
  http.post(`${API_BASE_URL}/work-orders`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createWorkOrder(body),
      message: 'Orden de trabajo creada exitosamente',
    }, { status: 201 });
  }),

  // PUT /api/work-orders/:id
  http.put(`${API_BASE_URL}/work-orders/:id`, async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createWorkOrder({ id: id as string, ...body }),
      message: 'Orden de trabajo actualizada exitosamente',
    });
  }),

  // DELETE /api/work-orders/:id
  http.delete(`${API_BASE_URL}/work-orders/:id`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      message: 'Orden de trabajo eliminada exitosamente',
    });
  }),

  // ============================================================================
  // Invoice Endpoints
  // ============================================================================

  // GET /api/invoices
  http.get(`${API_BASE_URL}/invoices`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: createInvoices(10),
    });
  }),

  // GET /api/invoices/:id
  http.get(`${API_BASE_URL}/invoices/:id`, async ({ params }) => {
    await simulateNetworkDelay();

    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: createInvoice({ id: id as string }),
    });
  }),

  // POST /api/invoices
  http.post(`${API_BASE_URL}/invoices`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createInvoice(body),
      message: 'Factura creada exitosamente',
    }, { status: 201 });
  }),

  // PUT /api/invoices/:id
  http.put(`${API_BASE_URL}/invoices/:id`, async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createInvoice({ id: id as string, ...body }),
      message: 'Factura actualizada exitosamente',
    });
  }),

  // ============================================================================
  // Payment Endpoints
  // ============================================================================

  // GET /api/payments
  http.get(`${API_BASE_URL}/payments`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: createPayments(10),
    });
  }),

  // POST /api/payments
  http.post(`${API_BASE_URL}/payments`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createPayment(body),
      message: 'Pago registrado exitosamente',
    }, { status: 201 });
  }),

  // ============================================================================
  // Inventory Endpoints
  // ============================================================================

  // GET /api/inventory
  http.get(`${API_BASE_URL}/inventory`, async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: createInventoryParts(20),
    });
  }),

  // GET /api/inventory/:id
  http.get(`${API_BASE_URL}/inventory/:id`, async ({ params }) => {
    await simulateNetworkDelay();

    const { id } = params;

    return HttpResponse.json({
      success: true,
      data: createInventoryPart({ id: id as string }),
    });
  }),

  // POST /api/inventory
  http.post(`${API_BASE_URL}/inventory`, async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createInventoryPart(body),
      message: 'Artículo agregado al inventario exitosamente',
    }, { status: 201 });
  }),

  // PUT /api/inventory/:id
  http.put(`${API_BASE_URL}/inventory/:id`, async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      success: true,
      data: createInventoryPart({ id: id as string, ...body }),
      message: 'Artículo actualizado exitosamente',
    });
  }),
];

/**
 * Error handlers for specific test scenarios
 */
export const errorHandlers = {
  // Network error
  networkError: http.get(`${API_BASE_URL}/*`, () => {
    return HttpResponse.error();
  }),

  // Server error (500)
  serverError: http.get(`${API_BASE_URL}/*`, () => {
    return HttpResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }),

  // Unauthorized (401)
  unauthorized: http.get(`${API_BASE_URL}/*`, () => {
    return HttpResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }),

  // Forbidden (403)
  forbidden: http.get(`${API_BASE_URL}/*`, () => {
    return HttpResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }),
};
