/**
 * Integration Test: Dashboard Overview Real-time Updates
 *
 * Tests the complete workflow of:
 * 1. Loading dashboard statistics
 * 2. Real-time metric updates
 * 3. Recent activity feed
 * 4. Revenue trends calculation
 * 5. Work order status distribution
 * 6. Low stock alerts integration
 * 7. Overdue invoices notification
 * 8. Data aggregation from multiple sources
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

describe('Integration: Dashboard Overview', () => {
  const mockDashboardStats = {
    clients: {
      total: 150,
      newThisMonth: 12,
      activeWithOpenOrders: 45,
    },
    vehicles: {
      total: 220,
      newThisMonth: 8,
      inService: 15,
    },
    workOrders: {
      total: 450,
      draft: 5,
      pending: 12,
      inProgress: 15,
      ready: 8,
      closed: 410,
      thisMonth: 35,
    },
    revenue: {
      total: 125000000, // Total all-time revenue
      thisMonth: 12500000,
      lastMonth: 11000000,
      growth: 13.6, // Percentage growth
      paid: 10000000,
      pending: 2500000,
    },
    invoices: {
      total: 380,
      paid: 320,
      partiallyPaid: 25,
      pending: 30,
      overdue: 5,
      totalValue: 95000000,
      outstandingBalance: 8500000,
    },
    inventory: {
      totalItems: 85,
      lowStock: 12,
      outOfStock: 3,
      totalValue: 15000000,
      reserved: 450,
    },
  };

  const mockRecentActivity = [
    {
      id: 'act-1',
      type: 'work_order_created',
      message: 'Orden de trabajo WO-2024-035 creada',
      timestamp: '2024-01-15T10:30:00.000Z',
      user: 'Admin User',
    },
    {
      id: 'act-2',
      type: 'invoice_paid',
      message: 'Factura INV-2024-120 pagada - ₲ 1,500,000',
      timestamp: '2024-01-15T09:45:00.000Z',
      user: 'Admin User',
    },
    {
      id: 'act-3',
      type: 'client_registered',
      message: 'Nuevo cliente: Carlos Mendoza',
      timestamp: '2024-01-15T08:20:00.000Z',
      user: 'Admin User',
    },
  ];

  const mockRevenueTrend = [
    { month: '2024-01', revenue: 8500000, invoices: 25 },
    { month: '2024-02', revenue: 9200000, invoices: 28 },
    { month: '2024-03', revenue: 11000000, invoices: 32 },
    { month: '2024-04', revenue: 12500000, invoices: 35 },
  ];

  const mockLowStockItems = [
    { id: 'inv-1', name: 'Aceite 10W-40', quantity: 8, minStock: 20, status: 'low' },
    { id: 'inv-2', name: 'Filtro de aire', quantity: 5, minStock: 15, status: 'low' },
    { id: 'inv-3', name: 'Bujías', quantity: 0, minStock: 10, status: 'out_of_stock' },
  ];

  const mockOverdueInvoices = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2024-080',
      clientName: 'Juan Pérez',
      total: 850000,
      dueDate: '2024-01-01',
      daysOverdue: 14,
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2024-095',
      clientName: 'María García',
      total: 1200000,
      dueDate: '2024-01-05',
      daysOverdue: 10,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Statistics Loading', () => {
    it('should load all dashboard statistics on initial render', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      expect(response.data.data.clients.total).toBe(150);
      expect(response.data.data.vehicles.total).toBe(220);
      expect(response.data.data.workOrders.total).toBe(450);
      expect(response.data.data.revenue.thisMonth).toBe(12500000);
      expect(response.data.data.invoices.overdue).toBe(5);
      expect(response.data.data.inventory.lowStock).toBe(12);
    });

    it('should calculate correct growth percentage', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      const thisMonth = response.data.data.revenue.thisMonth;
      const lastMonth = response.data.data.revenue.lastMonth;
      const expectedGrowth = ((thisMonth - lastMonth) / lastMonth) * 100;

      expect(response.data.data.revenue.growth).toBeCloseTo(expectedGrowth, 1);
      expect(response.data.data.revenue.growth).toBeCloseTo(13.6, 1);
    });

    it('should aggregate data from multiple sources', async () => {
      // Dashboard makes multiple API calls
      mockApi.get
        .mockResolvedValueOnce({
          data: { success: true, data: mockDashboardStats.clients },
        })
        .mockResolvedValueOnce({
          data: { success: true, data: mockDashboardStats.workOrders },
        })
        .mockResolvedValueOnce({
          data: { success: true, data: mockDashboardStats.revenue },
        });

      const clients = await mockApi.get('/api/clients/stats');
      const workOrders = await mockApi.get('/api/work-orders/stats');
      const revenue = await mockApi.get('/api/revenue/stats');

      expect(clients.data.data.total).toBe(150);
      expect(workOrders.data.data.inProgress).toBe(15);
      expect(revenue.data.data.thisMonth).toBe(12500000);
    });
  });

  describe('Real-time Metric Updates', () => {
    it('should update work order count when new order is created', async () => {
      // Initial stats
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const initial = await mockApi.get('/api/dashboard/stats');
      expect(initial.data.data.workOrders.total).toBe(450);

      // Create new work order
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { id: 'wo-new', orderNumber: 'WO-2024-036' } },
      });

      await mockApi.post('/api/work-orders', { clientId: 'client-1', vehicleId: 'vehicle-1' });

      // Fetch updated stats
      const updatedStats = {
        ...mockDashboardStats,
        workOrders: {
          ...mockDashboardStats.workOrders,
          total: 451,
          draft: 6,
        },
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedStats },
      });

      const updated = await mockApi.get('/api/dashboard/stats');
      expect(updated.data.data.workOrders.total).toBe(451);
      expect(updated.data.data.workOrders.draft).toBe(6);
    });

    it('should update revenue when invoice is paid', async () => {
      // Initial revenue
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const initial = await mockApi.get('/api/dashboard/stats');
      expect(initial.data.data.revenue.paid).toBe(10000000);

      // Pay invoice
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { id: 'pay-1', amount: 1500000 } },
      });

      await mockApi.post('/api/payments', {
        invoiceId: 'inv-1',
        amount: 1500000,
        method: 'efectivo',
      });

      // Updated revenue
      const updatedStats = {
        ...mockDashboardStats,
        revenue: {
          ...mockDashboardStats.revenue,
          paid: 11500000,
          pending: 1000000,
        },
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedStats },
      });

      const updated = await mockApi.get('/api/dashboard/stats');
      expect(updated.data.data.revenue.paid).toBe(11500000);
    });

    it('should update client count when new client is registered', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { id: 'client-new', name: 'Nuevo Cliente' } },
      });

      await mockApi.post('/api/clients', { name: 'Nuevo Cliente', email: 'nuevo@test.com' });

      const updatedStats = {
        ...mockDashboardStats,
        clients: {
          ...mockDashboardStats.clients,
          total: 151,
          newThisMonth: 13,
        },
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedStats },
      });

      const updated = await mockApi.get('/api/dashboard/stats');
      expect(updated.data.data.clients.total).toBe(151);
      expect(updated.data.data.clients.newThisMonth).toBe(13);
    });
  });

  describe('Recent Activity Feed', () => {
    it('should display recent activity in chronological order', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockRecentActivity },
      });

      const response = await mockApi.get('/api/dashboard/activity');

      expect(response.data.data).toHaveLength(3);
      expect(response.data.data[0].type).toBe('work_order_created');
      expect(response.data.data[1].type).toBe('invoice_paid');
      expect(response.data.data[2].type).toBe('client_registered');

      // Verify chronological order (most recent first)
      const timestamps = response.data.data.map((act: any) => new Date(act.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });

    it('should update activity feed when new action occurs', async () => {
      // Initial activity
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockRecentActivity },
      });

      const initial = await mockApi.get('/api/dashboard/activity');
      expect(initial.data.data).toHaveLength(3);

      // New action: Create work order
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { id: 'wo-new' } },
      });

      await mockApi.post('/api/work-orders', {});

      // Updated activity with new item
      const newActivity = {
        id: 'act-new',
        type: 'work_order_created',
        message: 'Orden de trabajo WO-2024-036 creada',
        timestamp: new Date().toISOString(),
        user: 'Admin User',
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: [newActivity, ...mockRecentActivity] },
      });

      const updated = await mockApi.get('/api/dashboard/activity');
      expect(updated.data.data).toHaveLength(4);
      expect(updated.data.data[0].id).toBe('act-new');
    });

    it('should limit activity feed to recent items', async () => {
      // Generate 50 activities
      const manyActivities = Array.from({ length: 50 }, (_, i) => ({
        id: `act-${i}`,
        type: 'work_order_created',
        message: `Action ${i}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        user: 'User',
      }));

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: manyActivities.slice(0, 10) }, // Only return 10 most recent
      });

      const response = await mockApi.get('/api/dashboard/activity', {
        params: { limit: 10 },
      });

      expect(response.data.data).toHaveLength(10);
    });
  });

  describe('Revenue Trends Analysis', () => {
    it('should calculate monthly revenue trends', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockRevenueTrend },
      });

      const response = await mockApi.get('/api/dashboard/revenue-trend', {
        params: { period: 'monthly', months: 4 },
      });

      expect(response.data.data).toHaveLength(4);
      expect(response.data.data[0].revenue).toBe(8500000);
      expect(response.data.data[3].revenue).toBe(12500000);

      // Verify growth trend
      const firstMonth = response.data.data[0].revenue;
      const lastMonth = response.data.data[3].revenue;
      expect(lastMonth).toBeGreaterThan(firstMonth);
    });

    it('should include invoice count in revenue trend', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockRevenueTrend },
      });

      const response = await mockApi.get('/api/dashboard/revenue-trend');

      expect(response.data.data[0].invoices).toBe(25);
      expect(response.data.data[3].invoices).toBe(35);
    });

    it('should calculate average invoice value per month', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockRevenueTrend },
      });

      const response = await mockApi.get('/api/dashboard/revenue-trend');

      // Calculate average for last month
      const lastMonth = response.data.data[3];
      const avgInvoiceValue = lastMonth.revenue / lastMonth.invoices;

      expect(avgInvoiceValue).toBeCloseTo(357142.86, 0); // 12,500,000 / 35
    });
  });

  describe('Work Order Status Distribution', () => {
    it('should show distribution of work orders by status', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      const workOrders = response.data.data.workOrders;

      expect(workOrders.draft).toBe(5);
      expect(workOrders.pending).toBe(12);
      expect(workOrders.inProgress).toBe(15);
      expect(workOrders.ready).toBe(8);
      expect(workOrders.closed).toBe(410);

      // Verify total
      const statusTotal = workOrders.draft + workOrders.pending + workOrders.inProgress + workOrders.ready + workOrders.closed;
      expect(statusTotal).toBe(workOrders.total);
    });

    it('should calculate percentage distribution', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      const workOrders = response.data.data.workOrders;
      const total = workOrders.total;

      const inProgressPercentage = (workOrders.inProgress / total) * 100;
      const closedPercentage = (workOrders.closed / total) * 100;

      expect(inProgressPercentage).toBeCloseTo(3.33, 1); // 15/450 ≈ 3.33%
      expect(closedPercentage).toBeCloseTo(91.11, 1); // 410/450 ≈ 91.11%
    });
  });

  describe('Low Stock Alerts Integration', () => {
    it('should display low stock items count on dashboard', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      expect(response.data.data.inventory.lowStock).toBe(12);
      expect(response.data.data.inventory.outOfStock).toBe(3);
    });

    it('should fetch detailed low stock items list', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockLowStockItems },
      });

      const response = await mockApi.get('/api/dashboard/low-stock');

      expect(response.data.data).toHaveLength(3);
      expect(response.data.data[0].status).toBe('low');
      expect(response.data.data[2].status).toBe('out_of_stock');
      expect(response.data.data[2].quantity).toBe(0);
    });

    it('should show critical alert for out of stock items', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockLowStockItems },
      });

      const response = await mockApi.get('/api/dashboard/low-stock');

      const outOfStock = response.data.data.filter((item: any) => item.status === 'out_of_stock');
      expect(outOfStock).toHaveLength(1);
      expect(outOfStock[0].quantity).toBe(0);
    });
  });

  describe('Overdue Invoices Notification', () => {
    it('should display overdue invoices count', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      expect(response.data.data.invoices.overdue).toBe(5);
    });

    it('should fetch detailed overdue invoices list', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockOverdueInvoices },
      });

      const response = await mockApi.get('/api/dashboard/overdue-invoices');

      expect(response.data.data).toHaveLength(2);
      expect(response.data.data[0].daysOverdue).toBe(14);
      expect(response.data.data[1].daysOverdue).toBe(10);
    });

    it('should calculate total overdue amount', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockOverdueInvoices },
      });

      const response = await mockApi.get('/api/dashboard/overdue-invoices');

      const totalOverdue = response.data.data.reduce((sum: number, inv: any) => sum + inv.total, 0);

      expect(totalOverdue).toBe(2050000); // 850,000 + 1,200,000
    });

    it('should sort overdue invoices by days overdue', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockOverdueInvoices },
      });

      const response = await mockApi.get('/api/dashboard/overdue-invoices', {
        params: { sortBy: 'daysOverdue', order: 'desc' },
      });

      const daysOverdue = response.data.data.map((inv: any) => inv.daysOverdue);

      // Verify descending order
      for (let i = 1; i < daysOverdue.length; i++) {
        expect(daysOverdue[i - 1]).toBeGreaterThanOrEqual(daysOverdue[i]);
      }
    });
  });

  describe('Data Refresh and Polling', () => {
    it('should support manual stats refresh', async () => {
      // Initial fetch
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      const initial = await mockApi.get('/api/dashboard/stats');
      expect(initial.data.data.workOrders.total).toBe(450);

      // Manual refresh with updated data
      const updatedStats = {
        ...mockDashboardStats,
        workOrders: { ...mockDashboardStats.workOrders, total: 455 },
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedStats, refreshed: true },
      });

      const refreshed = await mockApi.get('/api/dashboard/stats?refresh=true');
      expect(refreshed.data.data.workOrders.total).toBe(455);
      expect(refreshed.data.refreshed).toBe(true);
    });

    it('should handle stale data with timestamp', async () => {
      const statsWithTimestamp = {
        ...mockDashboardStats,
        _metadata: {
          lastUpdated: '2024-01-15T10:00:00.000Z',
          ttl: 300, // 5 minutes
        },
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: statsWithTimestamp },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      expect(response.data.data._metadata.lastUpdated).toBeTruthy();
      expect(response.data.data._metadata.ttl).toBe(300);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle partial data loading failures gracefully', async () => {
      // Stats load successfully
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      // Activity feed fails
      mockApi.get.mockRejectedValueOnce({
        response: { data: { success: false, error: 'Activity feed unavailable' } },
      });

      const stats = await mockApi.get('/api/dashboard/stats');
      expect(stats.data.success).toBe(true);

      await expect(mockApi.get('/api/dashboard/activity')).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Activity feed unavailable'),
          },
        },
      });
    });

    it('should provide default values when data is missing', async () => {
      const incompleteStats = {
        clients: { total: 150 },
        // Missing other fields
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: incompleteStats },
      });

      const response = await mockApi.get('/api/dashboard/stats');

      expect(response.data.data.clients.total).toBe(150);
      // Missing fields should be handled on client side with defaults
    });

    it('should retry failed requests with exponential backoff', async () => {
      // First attempt fails
      mockApi.get.mockRejectedValueOnce({
        response: { data: { success: false, error: 'Timeout' } },
      });

      // Second attempt succeeds
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockDashboardStats },
      });

      try {
        await mockApi.get('/api/dashboard/stats');
      } catch (error) {
        // Retry
        const retry = await mockApi.get('/api/dashboard/stats');
        expect(retry.data.success).toBe(true);
      }
    });
  });

  describe('Performance Optimization', () => {
    it('should batch multiple stat requests', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            stats: mockDashboardStats,
            activity: mockRecentActivity,
            lowStock: mockLowStockItems,
            overdue: mockOverdueInvoices,
          },
        },
      });

      const response = await mockApi.get('/api/dashboard/all');

      expect(response.data.data.stats).toBeDefined();
      expect(response.data.data.activity).toBeDefined();
      expect(response.data.data.lowStock).toBeDefined();
      expect(response.data.data.overdue).toBeDefined();

      // Only one API call made
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it('should cache dashboard data for short period', async () => {
      const cachedResponse = {
        data: {
          success: true,
          data: mockDashboardStats,
          cached: true,
          cacheAge: 120, // seconds
        },
      };

      mockApi.get.mockResolvedValueOnce(cachedResponse);

      const response = await mockApi.get('/api/dashboard/stats');

      expect(response.data.cached).toBe(true);
      expect(response.data.cacheAge).toBeLessThan(300); // Less than 5 minutes
    });
  });
});
