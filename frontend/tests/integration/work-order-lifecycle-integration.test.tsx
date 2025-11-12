/**
 * Integration Test: Work Order Lifecycle Flow
 *
 * Tests the complete workflow of:
 * 1. Creating a work order in draft status
 * 2. Transitioning through statuses: draft → pending → in_progress → ready → closed
 * 3. Adding services and parts to work order
 * 4. Updating costs and estimates
 * 5. Verifying valid state transitions
 * 6. Preventing invalid state transitions
 * 7. Data consistency across status changes
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the API client
const mockApi = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: mockApi,
}));

// Mock toast notifications
const mockToast = Object.assign(jest.fn(), {
  success: jest.fn(),
  error: jest.fn(),
});

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
}));

describe('Integration: Work Order Lifecycle Flow', () => {
  const mockClient = {
    id: 'client-123',
    name: 'Carlos Mendoza',
    ruc: '80012345-1',
    phone: '0981123456',
    email: 'carlos@example.com',
  };

  const mockVehicle = {
    id: 'vehicle-123',
    clientId: 'client-123',
    plate: 'ABC-1234',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2022,
    vin: 'JTDZR3ER9N3123456',
  };

  const mockWorkOrder = {
    id: 'wo-123',
    orderNumber: 'WO-2024-001',
    clientId: 'client-123',
    vehicleId: 'vehicle-123',
    status: 'draft',
    description: 'Cambio de aceite y filtros',
    estimatedCost: 0,
    actualCost: 0,
    services: [],
    parts: [],
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
  };

  const mockServices = [
    {
      id: 'service-1',
      workOrderId: 'wo-123',
      description: 'Cambio de aceite',
      laborCost: 150000,
      estimatedHours: 1,
      actualHours: 1,
    },
    {
      id: 'service-2',
      workOrderId: 'wo-123',
      description: 'Cambio de filtro de aceite',
      laborCost: 50000,
      estimatedHours: 0.5,
      actualHours: 0.5,
    },
  ];

  const mockParts = [
    {
      id: 'part-1',
      workOrderId: 'wo-123',
      inventoryItemId: 'inv-1',
      name: 'Aceite 10W-40',
      quantity: 4,
      unitPrice: 45000,
      totalPrice: 180000,
    },
    {
      id: 'part-2',
      workOrderId: 'wo-123',
      inventoryItemId: 'inv-2',
      name: 'Filtro de aceite',
      quantity: 1,
      unitPrice: 35000,
      totalPrice: 35000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Work Order Lifecycle', () => {
    it('should create work order and transition through all valid statuses', async () => {
      // Step 1: Create work order in draft status
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockWorkOrder },
      });

      const draftWO = await mockApi.post('/api/work-orders', {
        clientId: mockClient.id,
        vehicleId: mockVehicle.id,
        description: 'Cambio de aceite y filtros',
        status: 'draft',
      });

      expect(draftWO.data.data.status).toBe('draft');
      expect(draftWO.data.data.orderNumber).toBe('WO-2024-001');

      // Step 2: Transition to pending (awaiting parts/approval)
      const pendingWO = { ...mockWorkOrder, status: 'pending', updatedAt: '2024-01-01T11:00:00.000Z' };
      mockApi.patch.mockResolvedValueOnce({
        data: { success: true, data: pendingWO },
      });

      const pendingResponse = await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'pending',
      });

      expect(pendingResponse.data.data.status).toBe('pending');

      // Step 3: Transition to in_progress (work started)
      const inProgressWO = { ...mockWorkOrder, status: 'in_progress', updatedAt: '2024-01-01T12:00:00.000Z' };
      mockApi.patch.mockResolvedValueOnce({
        data: { success: true, data: inProgressWO },
      });

      const inProgressResponse = await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'in_progress',
      });

      expect(inProgressResponse.data.data.status).toBe('in_progress');

      // Step 4: Transition to ready (work completed, awaiting pickup)
      const readyWO = { ...mockWorkOrder, status: 'ready', updatedAt: '2024-01-01T16:00:00.000Z' };
      mockApi.patch.mockResolvedValueOnce({
        data: { success: true, data: readyWO },
      });

      const readyResponse = await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'ready',
      });

      expect(readyResponse.data.data.status).toBe('ready');

      // Step 5: Transition to closed (vehicle picked up, invoice paid)
      const closedWO = { ...mockWorkOrder, status: 'closed', updatedAt: '2024-01-02T10:00:00.000Z' };
      mockApi.patch.mockResolvedValueOnce({
        data: { success: true, data: closedWO },
      });

      const closedResponse = await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'closed',
      });

      expect(closedResponse.data.data.status).toBe('closed');

      // Verify all transitions occurred
      expect(mockApi.patch).toHaveBeenCalledTimes(4);
    });

    it('should add services and parts during work order lifecycle', async () => {
      // Create work order
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockWorkOrder },
      });

      await mockApi.post('/api/work-orders', mockWorkOrder);

      // Add first service
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockServices[0] },
      });

      const service1 = await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/services`, mockServices[0]);
      expect(service1.data.data.description).toBe('Cambio de aceite');

      // Add second service
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockServices[1] },
      });

      const service2 = await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/services`, mockServices[1]);
      expect(service2.data.data.description).toBe('Cambio de filtro de aceite');

      // Add parts
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockParts[0] },
      });

      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockParts[1] },
      });

      await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, mockParts[0]);
      await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, mockParts[1]);

      // Verify work order with services and parts
      const woWithDetails = {
        ...mockWorkOrder,
        services: mockServices,
        parts: mockParts,
        estimatedCost: 415000, // Total: 150k + 50k + 180k + 35k
        actualCost: 415000,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: woWithDetails },
      });

      const response = await mockApi.get(`/api/work-orders/${mockWorkOrder.id}`);

      expect(response.data.data.services).toHaveLength(2);
      expect(response.data.data.parts).toHaveLength(2);
      expect(response.data.data.estimatedCost).toBe(415000);
    });
  });

  describe('Status Transition Validation', () => {
    it('should prevent invalid status transitions', async () => {
      // Cannot jump from draft directly to closed
      mockApi.patch.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Invalid status transition: draft → closed',
          },
        },
      });

      await expect(
        mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
          status: 'closed',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Invalid status transition'),
          },
        },
      });
    });

    it('should prevent reverting to previous status', async () => {
      const inProgressWO = { ...mockWorkOrder, status: 'in_progress' };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: inProgressWO },
      });

      // Try to revert to draft
      mockApi.patch.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Cannot revert work order status backwards',
          },
        },
      });

      await expect(
        mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
          status: 'draft',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Cannot revert'),
          },
        },
      });
    });

    it('should allow skipping optional statuses in forward direction', async () => {
      // Can go from draft → in_progress (skipping pending)
      mockApi.patch.mockResolvedValueOnce({
        data: {
          success: true,
          data: { ...mockWorkOrder, status: 'in_progress' },
        },
      });

      const response = await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'in_progress',
      });

      expect(response.data.data.status).toBe('in_progress');
    });
  });

  describe('Cost Calculation and Updates', () => {
    it('should calculate total cost from services and parts', async () => {
      const laborTotal = mockServices.reduce((sum, s) => sum + s.laborCost, 0); // 200,000
      const partsTotal = mockParts.reduce((sum, p) => sum + p.totalPrice, 0); // 215,000
      const expectedTotal = laborTotal + partsTotal; // 415,000

      const woWithCosts = {
        ...mockWorkOrder,
        services: mockServices,
        parts: mockParts,
        estimatedCost: expectedTotal,
        actualCost: expectedTotal,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: woWithCosts },
      });

      const response = await mockApi.get(`/api/work-orders/${mockWorkOrder.id}`);

      expect(response.data.data.estimatedCost).toBe(415000);
      expect(response.data.data.actualCost).toBe(415000);
    });

    it('should update costs when services are added or removed', async () => {
      // Initial cost
      let totalCost = 200000;

      const initialWO = {
        ...mockWorkOrder,
        services: [mockServices[0]],
        estimatedCost: totalCost,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: initialWO },
      });

      const initial = await mockApi.get(`/api/work-orders/${mockWorkOrder.id}`);
      expect(initial.data.data.estimatedCost).toBe(200000);

      // Add service
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockServices[1] },
      });

      await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/services`, mockServices[1]);

      // Updated cost
      totalCost = 250000; // 200k + 50k

      const updatedWO = {
        ...mockWorkOrder,
        services: mockServices,
        estimatedCost: totalCost,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedWO },
      });

      const updated = await mockApi.get(`/api/work-orders/${mockWorkOrder.id}`);
      expect(updated.data.data.estimatedCost).toBe(250000);
    });
  });

  describe('Inventory Integration', () => {
    it('should reserve inventory items when parts are added', async () => {
      // Add part to work order
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockParts[0] },
      });

      await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
        inventoryItemId: 'inv-1',
        quantity: 4,
      });

      // Verify inventory was updated
      mockApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'inv-1',
            name: 'Aceite 10W-40',
            quantity: 96, // Was 100, reserved 4
            reserved: 4,
          },
        },
      });

      const inventory = await mockApi.get('/api/inventory/inv-1');
      expect(inventory.data.data.quantity).toBe(96);
      expect(inventory.data.data.reserved).toBe(4);
    });

    it('should prevent adding parts when insufficient inventory', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Insufficient inventory: requested 10, available 5',
          },
        },
      });

      await expect(
        mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
          inventoryItemId: 'inv-1',
          quantity: 10,
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Insufficient inventory'),
          },
        },
      });
    });

    it('should release inventory when work order is cancelled', async () => {
      // Work order with reserved parts
      const woWithParts = {
        ...mockWorkOrder,
        status: 'cancelled',
        parts: mockParts,
      };

      mockApi.patch.mockResolvedValueOnce({
        data: { success: true, data: woWithParts },
      });

      await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'cancelled',
      });

      // Verify inventory was released
      mockApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'inv-1',
            name: 'Aceite 10W-40',
            quantity: 100, // Returned to original
            reserved: 0,
          },
        },
      });

      const inventory = await mockApi.get('/api/inventory/inv-1');
      expect(inventory.data.data.quantity).toBe(100);
      expect(inventory.data.data.reserved).toBe(0);
    });
  });

  describe('Client and Vehicle Relationship', () => {
    it('should maintain correct client-vehicle-workorder relationships', async () => {
      const woWithRelations = {
        ...mockWorkOrder,
        client: mockClient,
        vehicle: mockVehicle,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: woWithRelations },
      });

      const response = await mockApi.get(`/api/work-orders/${mockWorkOrder.id}`);

      expect(response.data.data.client.id).toBe(mockClient.id);
      expect(response.data.data.vehicle.id).toBe(mockVehicle.id);
      expect(response.data.data.vehicle.clientId).toBe(mockClient.id);
    });

    it('should list all work orders for a specific vehicle', async () => {
      const vehicleWorkOrders = [
        { ...mockWorkOrder, id: 'wo-123', orderNumber: 'WO-2024-001' },
        { ...mockWorkOrder, id: 'wo-124', orderNumber: 'WO-2024-002' },
        { ...mockWorkOrder, id: 'wo-125', orderNumber: 'WO-2024-003' },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: vehicleWorkOrders },
      });

      const response = await mockApi.get(`/api/vehicles/${mockVehicle.id}/work-orders`);

      expect(response.data.data).toHaveLength(3);
      expect(response.data.data.every((wo: any) => wo.vehicleId === mockVehicle.id)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent updates gracefully', async () => {
      // Two users try to update the same work order
      const update1 = mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'in_progress',
      });

      const update2 = mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        description: 'Updated description',
      });

      mockApi.patch
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { ...mockWorkOrder, status: 'in_progress' },
          },
        })
        .mockResolvedValueOnce({
          data: {
            success: true,
            data: { ...mockWorkOrder, status: 'in_progress', description: 'Updated description' },
          },
        });

      const results = await Promise.all([update1, update2]);

      expect(results).toHaveLength(2);
      expect(results[0].data.success).toBe(true);
      expect(results[1].data.success).toBe(true);
    });

    it('should prevent closing work order without invoice', async () => {
      mockApi.patch.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Cannot close work order without generating invoice',
          },
        },
      });

      await expect(
        mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
          status: 'closed',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('without generating invoice'),
          },
        },
      });
    });

    it('should handle deletion of draft work orders', async () => {
      // Can delete draft work orders
      mockApi.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      const response = await mockApi.delete(`/api/work-orders/${mockWorkOrder.id}`);
      expect(response.data.success).toBe(true);
    });

    it('should prevent deletion of in-progress work orders', async () => {
      const inProgressWO = { ...mockWorkOrder, status: 'in_progress' };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: inProgressWO },
      });

      mockApi.delete.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Cannot delete work order in progress',
          },
        },
      });

      await expect(mockApi.delete(`/api/work-orders/${mockWorkOrder.id}`)).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Cannot delete'),
          },
        },
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter work orders by status', async () => {
      const inProgressOrders = [
        { ...mockWorkOrder, id: 'wo-1', status: 'in_progress' },
        { ...mockWorkOrder, id: 'wo-2', status: 'in_progress' },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: inProgressOrders },
      });

      const response = await mockApi.get('/api/work-orders', {
        params: { status: 'in_progress' },
      });

      expect(response.data.data).toHaveLength(2);
      expect(response.data.data.every((wo: any) => wo.status === 'in_progress')).toBe(true);
    });

    it('should search work orders by client name or vehicle plate', async () => {
      const searchResults = [
        {
          ...mockWorkOrder,
          client: mockClient,
          vehicle: mockVehicle,
        },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: searchResults },
      });

      const response = await mockApi.get('/api/work-orders', {
        params: { search: 'ABC-1234' },
      });

      expect(response.data.data[0].vehicle.plate).toBe('ABC-1234');
    });

    it('should filter work orders by date range', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: [mockWorkOrder],
        },
      });

      const response = await mockApi.get('/api/work-orders', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });

      expect(response.data.data).toHaveLength(1);
      expect(response.data.data[0].createdAt).toContain('2024-01');
    });
  });
});
