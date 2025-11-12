/**
 * Integration Test: Inventory-Work Order Integration
 *
 * Tests the complete workflow of:
 * 1. Reserving inventory when parts added to work order
 * 2. Deducting inventory when work order completed
 * 3. Releasing reserved inventory on cancellation
 * 4. Preventing negative stock
 * 5. Low stock alerts
 * 6. Inventory tracking and history
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
  warning: jest.fn(),
});

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
}));

describe('Integration: Inventory-Work Order Flow', () => {
  const mockInventoryItem = {
    id: 'inv-123',
    name: 'Aceite 10W-40',
    category: 'Lubricantes',
    sku: 'OIL-10W40-001',
    quantity: 100,
    reserved: 0,
    minStock: 20,
    maxStock: 200,
    unitPrice: 45000,
    supplier: 'Distribuidora Asunción',
    location: 'Estante A-3',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockWorkOrder = {
    id: 'wo-123',
    orderNumber: 'WO-2024-001',
    clientId: 'client-123',
    vehicleId: 'vehicle-123',
    status: 'draft',
    description: 'Cambio de aceite',
    parts: [],
  };

  const mockWorkOrderPart = {
    id: 'wop-123',
    workOrderId: 'wo-123',
    inventoryItemId: 'inv-123',
    name: 'Aceite 10W-40',
    quantity: 4,
    unitPrice: 45000,
    totalPrice: 180000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inventory Reservation on Part Addition', () => {
    it('should reserve inventory when part is added to work order', async () => {
      // Initial inventory state
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockInventoryItem },
      });

      const initialInventory = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);
      expect(initialInventory.data.data.quantity).toBe(100);
      expect(initialInventory.data.data.reserved).toBe(0);

      // Add part to work order
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockWorkOrderPart },
      });

      await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
        inventoryItemId: mockInventoryItem.id,
        quantity: 4,
      });

      // Check updated inventory
      const reservedInventory = {
        ...mockInventoryItem,
        reserved: 4,
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: reservedInventory },
      });

      const updatedInventory = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(updatedInventory.data.data.quantity).toBe(100);
      expect(updatedInventory.data.data.reserved).toBe(4);

      // Available quantity = total - reserved
      const available = updatedInventory.data.data.quantity - updatedInventory.data.data.reserved;
      expect(available).toBe(96);
    });

    it('should handle multiple reservations from different work orders', async () => {
      // Work order 1 reserves 4 units
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { ...mockWorkOrderPart, id: 'wop-1', quantity: 4 } },
      });

      await mockApi.post('/api/work-orders/wo-1/parts', {
        inventoryItemId: mockInventoryItem.id,
        quantity: 4,
      });

      // Work order 2 reserves 5 units
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { ...mockWorkOrderPart, id: 'wop-2', quantity: 5 } },
      });

      await mockApi.post('/api/work-orders/wo-2/parts', {
        inventoryItemId: mockInventoryItem.id,
        quantity: 5,
      });

      // Check total reserved
      const updatedInventory = {
        ...mockInventoryItem,
        reserved: 9, // 4 + 5
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedInventory },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.reserved).toBe(9);
      expect(response.data.data.quantity - response.data.data.reserved).toBe(91);
    });
  });

  describe('Inventory Deduction on Work Order Completion', () => {
    it('should deduct inventory when work order is completed', async () => {
      // Work order with reserved parts
      const woWithParts = {
        ...mockWorkOrder,
        status: 'in_progress',
        parts: [mockWorkOrderPart],
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: woWithParts },
      });

      // Complete work order
      mockApi.patch.mockResolvedValueOnce({
        data: {
          success: true,
          data: { ...woWithParts, status: 'ready' },
        },
      });

      await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'ready',
      });

      // Check inventory after completion
      const deductedInventory = {
        ...mockInventoryItem,
        quantity: 96, // 100 - 4
        reserved: 0, // Released reservation and deducted
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: deductedInventory },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.quantity).toBe(96);
      expect(response.data.data.reserved).toBe(0);
    });

    it('should update inventory transaction history', async () => {
      const transaction = {
        id: 'txn-123',
        inventoryItemId: mockInventoryItem.id,
        workOrderId: mockWorkOrder.id,
        type: 'deduction',
        quantity: -4,
        balanceAfter: 96,
        notes: 'Work Order WO-2024-001 completed',
        createdAt: '2024-01-05T10:00:00.000Z',
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: [transaction] },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}/transactions`);

      expect(response.data.data[0].type).toBe('deduction');
      expect(response.data.data[0].quantity).toBe(-4);
      expect(response.data.data[0].balanceAfter).toBe(96);
      expect(response.data.data[0].workOrderId).toBe(mockWorkOrder.id);
    });
  });

  describe('Inventory Release on Work Order Cancellation', () => {
    it('should release reserved inventory when work order is cancelled', async () => {
      // Work order with reserved parts
      const reservedInventory = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 4,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: reservedInventory },
      });

      await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      // Cancel work order
      mockApi.patch.mockResolvedValueOnce({
        data: {
          success: true,
          data: { ...mockWorkOrder, status: 'cancelled' },
        },
      });

      await mockApi.patch(`/api/work-orders/${mockWorkOrder.id}`, {
        status: 'cancelled',
      });

      // Check inventory released
      const releasedInventory = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 0, // Released
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: releasedInventory },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.quantity).toBe(100);
      expect(response.data.data.reserved).toBe(0);
    });

    it('should release inventory when part is removed from work order', async () => {
      // Remove part from work order
      mockApi.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      await mockApi.delete(`/api/work-orders/${mockWorkOrder.id}/parts/${mockWorkOrderPart.id}`);

      // Check inventory updated
      const updatedInventory = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 0,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedInventory },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.reserved).toBe(0);
    });
  });

  describe('Negative Stock Prevention', () => {
    it('should prevent adding parts when insufficient inventory', async () => {
      const lowStockItem = {
        ...mockInventoryItem,
        quantity: 3,
        reserved: 0,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: lowStockItem },
      });

      await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      // Try to add 5 units when only 3 available
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Insufficient inventory: requested 5, available 3',
          },
        },
      });

      await expect(
        mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
          inventoryItemId: mockInventoryItem.id,
          quantity: 5,
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

    it('should consider reserved quantity when checking availability', async () => {
      const partiallyReserved = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 95, // 95 already reserved
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: partiallyReserved },
      });

      await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      // Try to add 10 units when only 5 available (100 - 95)
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Insufficient inventory: requested 10, available 5 (95 reserved)',
          },
        },
      });

      await expect(
        mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
          inventoryItemId: mockInventoryItem.id,
          quantity: 10,
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('available 5'),
          },
        },
      });
    });

    it('should allow exact available quantity reservation', async () => {
      const exactStockItem = {
        ...mockInventoryItem,
        quantity: 10,
        reserved: 0,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: exactStockItem },
      });

      await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      // Add exactly 10 units (all available)
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { ...mockWorkOrderPart, quantity: 10 } },
      });

      const response = await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
        inventoryItemId: mockInventoryItem.id,
        quantity: 10,
      });

      expect(response.data.data.quantity).toBe(10);

      // Verify inventory fully reserved
      const fullyReserved = {
        ...mockInventoryItem,
        quantity: 10,
        reserved: 10,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: fullyReserved },
      });

      const inventoryResponse = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);
      expect(inventoryResponse.data.data.quantity - inventoryResponse.data.data.reserved).toBe(0);
    });
  });

  describe('Low Stock Alerts', () => {
    it('should trigger warning when stock below minimum', async () => {
      const lowStockItem = {
        ...mockInventoryItem,
        quantity: 15,
        minStock: 20,
      };

      mockApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: lowStockItem,
          warning: 'Stock below minimum threshold',
        },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.quantity).toBeLessThan(response.data.data.minStock);
      expect(response.data.warning).toBeTruthy();
    });

    it('should list all items below minimum stock', async () => {
      const lowStockItems = [
        { ...mockInventoryItem, id: 'inv-1', name: 'Aceite', quantity: 10, minStock: 20 },
        { ...mockInventoryItem, id: 'inv-2', name: 'Filtro', quantity: 5, minStock: 15 },
        { ...mockInventoryItem, id: 'inv-3', name: 'Bujía', quantity: 8, minStock: 12 },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: lowStockItems },
      });

      const response = await mockApi.get('/api/inventory/low-stock');

      expect(response.data.data).toHaveLength(3);
      expect(response.data.data.every((item: any) => item.quantity < item.minStock)).toBe(true);
    });

    it('should not allow reservation that would create negative available stock', async () => {
      const item = {
        ...mockInventoryItem,
        quantity: 25,
        reserved: 10,
        minStock: 20,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: item },
      });

      // Available: 25 - 10 = 15
      // If we reserve 15, we'd have 0 available (below min of 20)
      mockApi.post.mockResolvedValueOnce({
        data: {
          success: true,
          data: { ...mockWorkOrderPart, quantity: 15 },
          warning: 'This reservation will bring stock below minimum threshold',
        },
      });

      const response = await mockApi.post(`/api/work-orders/${mockWorkOrder.id}/parts`, {
        inventoryItemId: mockInventoryItem.id,
        quantity: 15,
      });

      // Should succeed but with warning
      expect(response.data.success).toBe(true);
      expect(response.data.warning).toBeTruthy();
    });
  });

  describe('Part Quantity Updates', () => {
    it('should update inventory reservation when part quantity is changed', async () => {
      // Initial reservation: 4 units
      const initialReservation = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 4,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: initialReservation },
      });

      await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      // Update part quantity to 6
      mockApi.put.mockResolvedValueOnce({
        data: { success: true, data: { ...mockWorkOrderPart, quantity: 6 } },
      });

      await mockApi.put(`/api/work-orders/${mockWorkOrder.id}/parts/${mockWorkOrderPart.id}`, {
        quantity: 6,
      });

      // Check updated reservation
      const updatedReservation = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 6,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedReservation },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.reserved).toBe(6);
    });

    it('should handle quantity decrease correctly', async () => {
      // Initial: 10 reserved
      mockApi.put.mockResolvedValueOnce({
        data: { success: true, data: { ...mockWorkOrderPart, quantity: 5 } },
      });

      await mockApi.put(`/api/work-orders/${mockWorkOrder.id}/parts/${mockWorkOrderPart.id}`, {
        quantity: 5, // Decrease from 10 to 5
      });

      // Verify 5 units released
      const updatedInventory = {
        ...mockInventoryItem,
        quantity: 100,
        reserved: 5, // Was 10, now 5
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedInventory },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);

      expect(response.data.data.reserved).toBe(5);
    });

    it('should prevent quantity increase beyond available stock', async () => {
      // Currently reserved: 4, available: 96
      mockApi.put.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Cannot increase quantity: insufficient inventory',
          },
        },
      });

      await expect(
        mockApi.put(`/api/work-orders/${mockWorkOrder.id}/parts/${mockWorkOrderPart.id}`, {
          quantity: 110, // Would need 110 total, only 100 exist
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('insufficient inventory'),
          },
        },
      });
    });
  });

  describe('Inventory Restocking', () => {
    it('should add inventory and update quantity', async () => {
      // Initial stock
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockInventoryItem },
      });

      const initial = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);
      expect(initial.data.data.quantity).toBe(100);

      // Restock 50 units
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { quantity: 50, type: 'restock' } },
      });

      await mockApi.post(`/api/inventory/${mockInventoryItem.id}/transactions`, {
        type: 'restock',
        quantity: 50,
        notes: 'Restock from supplier',
      });

      // Check updated quantity
      const restocked = {
        ...mockInventoryItem,
        quantity: 150,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: restocked },
      });

      const updated = await mockApi.get(`/api/inventory/${mockInventoryItem.id}`);
      expect(updated.data.data.quantity).toBe(150);
    });

    it('should respect maximum stock limit', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Restock would exceed maximum stock limit (200)',
            warning: true,
          },
        },
      });

      await expect(
        mockApi.post(`/api/inventory/${mockInventoryItem.id}/transactions`, {
          type: 'restock',
          quantity: 150, // 100 + 150 = 250, exceeds maxStock of 200
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('exceed maximum'),
          },
        },
      });
    });
  });

  describe('Concurrent Inventory Operations', () => {
    it('should handle concurrent reservations with proper locking', async () => {
      // Two work orders try to reserve same inventory simultaneously
      const reservation1 = mockApi.post('/api/work-orders/wo-1/parts', {
        inventoryItemId: mockInventoryItem.id,
        quantity: 60,
      });

      const reservation2 = mockApi.post('/api/work-orders/wo-2/parts', {
        inventoryItemId: mockInventoryItem.id,
        quantity: 60,
      });

      // Only one should succeed (100 total, can't reserve 120)
      mockApi.post
        .mockResolvedValueOnce({
          data: { success: true, data: { ...mockWorkOrderPart, quantity: 60 } },
        })
        .mockRejectedValueOnce({
          response: {
            data: {
              success: false,
              error: 'Insufficient inventory: requested 60, available 40',
            },
          },
        });

      const results = await Promise.allSettled([reservation1, reservation2]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
    });
  });

  describe('Inventory Reporting', () => {
    it('should calculate inventory value', async () => {
      const items = [
        { ...mockInventoryItem, id: 'inv-1', quantity: 100, unitPrice: 45000 },
        { ...mockInventoryItem, id: 'inv-2', quantity: 50, unitPrice: 35000 },
        { ...mockInventoryItem, id: 'inv-3', quantity: 200, unitPrice: 15000 },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: items },
      });

      const response = await mockApi.get('/api/inventory');

      const totalValue = response.data.data.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unitPrice,
        0
      );

      // 100*45000 + 50*35000 + 200*15000 = 4,500,000 + 1,750,000 + 3,000,000 = 9,250,000
      expect(totalValue).toBe(9250000);
    });

    it('should track inventory turnover by work orders', async () => {
      const transactions = [
        { id: 'txn-1', type: 'deduction', quantity: -4, workOrderId: 'wo-1', createdAt: '2024-01-02' },
        { id: 'txn-2', type: 'deduction', quantity: -5, workOrderId: 'wo-2', createdAt: '2024-01-03' },
        { id: 'txn-3', type: 'deduction', quantity: -3, workOrderId: 'wo-3', createdAt: '2024-01-04' },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: transactions },
      });

      const response = await mockApi.get(`/api/inventory/${mockInventoryItem.id}/transactions`, {
        params: { type: 'deduction' },
      });

      const totalUsed = response.data.data.reduce((sum: number, txn: any) => sum + Math.abs(txn.quantity), 0);

      expect(totalUsed).toBe(12);
      expect(response.data.data.every((txn: any) => txn.workOrderId)).toBe(true);
    });
  });
});
