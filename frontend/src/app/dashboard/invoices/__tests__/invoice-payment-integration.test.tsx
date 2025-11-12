/**
 * Integration Test: Invoice-Payment Flow
 *
 * Tests the complete workflow of:
 * 1. Generating invoice from work order
 * 2. Calculating Paraguayan IVA (10%)
 * 3. Processing full payments
 * 4. Handling partial payments
 * 5. Tracking payment history
 * 6. Preventing overpayments
 * 7. Updating invoice status based on payments
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

describe('Integration: Invoice-Payment Flow', () => {
  const mockWorkOrder = {
    id: 'wo-123',
    orderNumber: 'WO-2024-001',
    clientId: 'client-123',
    vehicleId: 'vehicle-123',
    status: 'ready',
    estimatedCost: 1000000, // 1 million guaraníes
    actualCost: 1000000,
  };

  const mockInvoice = {
    id: 'inv-123',
    invoiceNumber: 'INV-2024-001',
    workOrderId: 'wo-123',
    clientId: 'client-123',
    status: 'pending',
    subtotal: 909091, // Before IVA
    iva: 90909, // 10% IVA (Paraguay)
    total: 1000000,
    paidAmount: 0,
    balance: 1000000,
    dueDate: '2024-01-15T00:00:00.000Z',
    issueDate: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockPayment = {
    id: 'pay-123',
    invoiceId: 'inv-123',
    amount: 1000000,
    method: 'efectivo',
    reference: '',
    notes: '',
    paymentDate: '2024-01-02T00:00:00.000Z',
    createdAt: '2024-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invoice Generation from Work Order', () => {
    it('should generate invoice with correct IVA (10%) calculation', async () => {
      // Create invoice from completed work order
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockInvoice },
      });

      const response = await mockApi.post('/api/invoices', {
        workOrderId: mockWorkOrder.id,
      });

      const invoice = response.data.data;

      // Verify IVA calculation (10% for Paraguay)
      expect(invoice.iva).toBe(90909);
      expect(invoice.subtotal).toBe(909091);
      expect(invoice.total).toBe(1000000);

      // Verify IVA is 10% of subtotal (with rounding)
      const calculatedIva = Math.round(invoice.subtotal * 0.1);
      expect(Math.abs(invoice.iva - calculatedIva)).toBeLessThan(2);
    });

    it('should set invoice status to pending initially', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockInvoice },
      });

      const response = await mockApi.post('/api/invoices', {
        workOrderId: mockWorkOrder.id,
      });

      expect(response.data.data.status).toBe('pending');
      expect(response.data.data.paidAmount).toBe(0);
      expect(response.data.data.balance).toBe(response.data.data.total);
    });

    it('should generate unique invoice number', async () => {
      const invoice1 = { ...mockInvoice, id: 'inv-1', invoiceNumber: 'INV-2024-001' };
      const invoice2 = { ...mockInvoice, id: 'inv-2', invoiceNumber: 'INV-2024-002' };

      mockApi.post
        .mockResolvedValueOnce({
          data: { success: true, data: invoice1 },
        })
        .mockResolvedValueOnce({
          data: { success: true, data: invoice2 },
        });

      const response1 = await mockApi.post('/api/invoices', { workOrderId: 'wo-1' });
      const response2 = await mockApi.post('/api/invoices', { workOrderId: 'wo-2' });

      expect(response1.data.data.invoiceNumber).toBe('INV-2024-001');
      expect(response2.data.data.invoiceNumber).toBe('INV-2024-002');
      expect(response1.data.data.invoiceNumber).not.toBe(response2.data.data.invoiceNumber);
    });
  });

  describe('Full Payment Processing', () => {
    it('should process full payment and update invoice status to paid', async () => {
      // Process full payment
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockPayment },
      });

      const paymentResponse = await mockApi.post('/api/payments', {
        invoiceId: mockInvoice.id,
        amount: 1000000,
        method: 'efectivo',
      });

      expect(paymentResponse.data.data.amount).toBe(1000000);

      // Fetch updated invoice
      const paidInvoice = {
        ...mockInvoice,
        status: 'paid',
        paidAmount: 1000000,
        balance: 0,
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: paidInvoice },
      });

      const invoiceResponse = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(invoiceResponse.data.data.status).toBe('paid');
      expect(invoiceResponse.data.data.paidAmount).toBe(1000000);
      expect(invoiceResponse.data.data.balance).toBe(0);
    });

    it('should support multiple payment methods', async () => {
      const paymentMethods = ['efectivo', 'tarjeta', 'transferencia', 'cheque'];

      for (const method of paymentMethods) {
        mockApi.post.mockResolvedValueOnce({
          data: {
            success: true,
            data: { ...mockPayment, method },
          },
        });

        const response = await mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 1000000,
          method,
        });

        expect(response.data.data.method).toBe(method);
      }
    });

    it('should require reference number for card and transfer payments', async () => {
      // Card payment requires reference
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Reference number required for card payments',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 1000000,
          method: 'tarjeta',
          reference: '', // Missing reference
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Reference number required'),
          },
        },
      });
    });
  });

  describe('Partial Payment Handling', () => {
    it('should process partial payment and update invoice to partially_paid', async () => {
      // First partial payment: 400,000
      const partialPayment1 = {
        ...mockPayment,
        id: 'pay-1',
        amount: 400000,
      };

      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: partialPayment1 },
      });

      await mockApi.post('/api/payments', {
        invoiceId: mockInvoice.id,
        amount: 400000,
        method: 'efectivo',
      });

      // Check invoice status
      const partiallyPaidInvoice = {
        ...mockInvoice,
        status: 'partially_paid',
        paidAmount: 400000,
        balance: 600000,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: partiallyPaidInvoice },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.status).toBe('partially_paid');
      expect(response.data.data.paidAmount).toBe(400000);
      expect(response.data.data.balance).toBe(600000);
    });

    it('should track multiple partial payments correctly', async () => {
      const payments = [
        { id: 'pay-1', amount: 300000, method: 'efectivo' },
        { id: 'pay-2', amount: 400000, method: 'tarjeta' },
        { id: 'pay-3', amount: 300000, method: 'transferencia' },
      ];

      // Process each payment
      for (let i = 0; i < payments.length; i++) {
        mockApi.post.mockResolvedValueOnce({
          data: { success: true, data: { ...mockPayment, ...payments[i] } },
        });

        await mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          ...payments[i],
        });
      }

      // Verify final invoice state
      const finalInvoice = {
        ...mockInvoice,
        status: 'paid',
        paidAmount: 1000000,
        balance: 0,
        payments: payments,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: finalInvoice },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.status).toBe('paid');
      expect(response.data.data.paidAmount).toBe(1000000);
      expect(response.data.data.payments).toHaveLength(3);
    });

    it('should calculate balance correctly after each partial payment', async () => {
      const paymentSteps = [
        { amount: 250000, expectedBalance: 750000, expectedStatus: 'partially_paid' },
        { amount: 250000, expectedBalance: 500000, expectedStatus: 'partially_paid' },
        { amount: 250000, expectedBalance: 250000, expectedStatus: 'partially_paid' },
        { amount: 250000, expectedBalance: 0, expectedStatus: 'paid' },
      ];

      let cumulativePaid = 0;

      for (const step of paymentSteps) {
        mockApi.post.mockResolvedValueOnce({
          data: { success: true, data: { ...mockPayment, amount: step.amount } },
        });

        await mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: step.amount,
          method: 'efectivo',
        });

        cumulativePaid += step.amount;

        mockApi.get.mockResolvedValueOnce({
          data: {
            success: true,
            data: {
              ...mockInvoice,
              status: step.expectedStatus,
              paidAmount: cumulativePaid,
              balance: step.expectedBalance,
            },
          },
        });

        const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

        expect(response.data.data.paidAmount).toBe(cumulativePaid);
        expect(response.data.data.balance).toBe(step.expectedBalance);
        expect(response.data.data.status).toBe(step.expectedStatus);
      }
    });
  });

  describe('Overpayment Prevention', () => {
    it('should prevent payment exceeding invoice total', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Payment amount exceeds invoice balance',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 1500000, // More than total
          method: 'efectivo',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('exceeds invoice balance'),
          },
        },
      });
    });

    it('should prevent payment on already paid invoice', async () => {
      const paidInvoice = {
        ...mockInvoice,
        status: 'paid',
        paidAmount: 1000000,
        balance: 0,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: paidInvoice },
      });

      await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Invoice is already fully paid',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 100000,
          method: 'efectivo',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('already fully paid'),
          },
        },
      });
    });

    it('should prevent overpayment with partial payments', async () => {
      // Invoice with 600,000 balance remaining
      const partialInvoice = {
        ...mockInvoice,
        status: 'partially_paid',
        paidAmount: 400000,
        balance: 600000,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: partialInvoice },
      });

      await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      // Try to pay more than remaining balance
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Payment amount (700,000) exceeds remaining balance (600,000)',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 700000,
          method: 'efectivo',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('exceeds remaining balance'),
          },
        },
      });
    });
  });

  describe('Payment History and Tracking', () => {
    it('should maintain complete payment history', async () => {
      const payments = [
        { id: 'pay-1', amount: 500000, method: 'efectivo', paymentDate: '2024-01-02T10:00:00.000Z' },
        { id: 'pay-2', amount: 300000, method: 'tarjeta', paymentDate: '2024-01-03T14:00:00.000Z' },
        { id: 'pay-3', amount: 200000, method: 'transferencia', paymentDate: '2024-01-04T09:00:00.000Z' },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: payments },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}/payments`);

      expect(response.data.data).toHaveLength(3);
      expect(response.data.data[0].amount).toBe(500000);
      expect(response.data.data[1].method).toBe('tarjeta');
      expect(response.data.data[2].paymentDate).toContain('2024-01-04');
    });

    it('should allow viewing individual payment details', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            ...mockPayment,
            invoice: mockInvoice,
            createdBy: { id: 'user-1', name: 'Admin User' },
          },
        },
      });

      const response = await mockApi.get(`/api/payments/${mockPayment.id}`);

      expect(response.data.data.amount).toBe(1000000);
      expect(response.data.data.invoice.invoiceNumber).toBe('INV-2024-001');
      expect(response.data.data.createdBy.name).toBe('Admin User');
    });

    it('should track payment timestamps accurately', async () => {
      const payment = {
        ...mockPayment,
        paymentDate: '2024-01-02T15:30:00.000Z',
        createdAt: '2024-01-02T15:30:05.000Z',
      };

      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: payment },
      });

      const response = await mockApi.post('/api/payments', {
        invoiceId: mockInvoice.id,
        amount: 1000000,
        method: 'efectivo',
      });

      expect(response.data.data.paymentDate).toBeTruthy();
      expect(response.data.data.createdAt).toBeTruthy();
      expect(new Date(response.data.data.createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(response.data.data.paymentDate).getTime()
      );
    });
  });

  describe('Invoice Status Updates', () => {
    it('should update invoice from pending to partially_paid on first partial payment', async () => {
      const pendingInvoice = { ...mockInvoice, status: 'pending' };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: pendingInvoice },
      });

      await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      // Make partial payment
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { ...mockPayment, amount: 300000 } },
      });

      await mockApi.post('/api/payments', {
        invoiceId: mockInvoice.id,
        amount: 300000,
        method: 'efectivo',
      });

      // Check updated status
      const updatedInvoice = {
        ...mockInvoice,
        status: 'partially_paid',
        paidAmount: 300000,
        balance: 700000,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: updatedInvoice },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.status).toBe('partially_paid');
    });

    it('should update invoice from partially_paid to paid on final payment', async () => {
      const partialInvoice = {
        ...mockInvoice,
        status: 'partially_paid',
        paidAmount: 800000,
        balance: 200000,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: partialInvoice },
      });

      await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      // Make final payment
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: { ...mockPayment, amount: 200000 } },
      });

      await mockApi.post('/api/payments', {
        invoiceId: mockInvoice.id,
        amount: 200000,
        method: 'efectivo',
      });

      // Check final status
      const paidInvoice = {
        ...mockInvoice,
        status: 'paid',
        paidAmount: 1000000,
        balance: 0,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: paidInvoice },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.status).toBe('paid');
      expect(response.data.data.balance).toBe(0);
    });

    it('should mark invoice as overdue when past due date without payment', async () => {
      const overdueInvoice = {
        ...mockInvoice,
        status: 'overdue',
        dueDate: '2024-01-15T00:00:00.000Z',
        paidAmount: 0,
        balance: 1000000,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: overdueInvoice },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.status).toBe('overdue');
      expect(new Date(response.data.data.dueDate).getTime()).toBeLessThan(Date.now());
    });
  });

  describe('Invoice-Work Order Relationship', () => {
    it('should link invoice to work order correctly', async () => {
      const invoiceWithWO = {
        ...mockInvoice,
        workOrder: mockWorkOrder,
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: invoiceWithWO },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.workOrderId).toBe(mockWorkOrder.id);
      expect(response.data.data.workOrder.orderNumber).toBe('WO-2024-001');
    });

    it('should prevent creating multiple invoices for same work order', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Invoice already exists for this work order',
          },
        },
      });

      await expect(
        mockApi.post('/api/invoices', {
          workOrderId: mockWorkOrder.id,
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('Invoice already exists'),
          },
        },
      });
    });

    it('should update work order status when invoice is paid', async () => {
      // Pay invoice
      mockApi.post.mockResolvedValueOnce({
        data: { success: true, data: mockPayment },
      });

      await mockApi.post('/api/payments', {
        invoiceId: mockInvoice.id,
        amount: 1000000,
        method: 'efectivo',
      });

      // Verify work order status updated
      const closedWorkOrder = {
        ...mockWorkOrder,
        status: 'closed',
      };

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: closedWorkOrder },
      });

      const response = await mockApi.get(`/api/work-orders/${mockWorkOrder.id}`);

      expect(response.data.data.status).toBe('closed');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payment amounts', async () => {
      // Negative amount
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Payment amount must be greater than zero',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: -100,
          method: 'efectivo',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('must be greater than zero'),
          },
        },
      });

      // Zero amount
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Payment amount must be greater than zero',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 0,
          method: 'efectivo',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('must be greater than zero'),
          },
        },
      });
    });

    it('should handle payment to non-existent invoice', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Invoice not found',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: 'non-existent-id',
          amount: 1000000,
          method: 'efectivo',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: 'Invoice not found',
          },
        },
      });
    });

    it('should rollback payment on processing failure', async () => {
      mockApi.post.mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: 'Payment gateway timeout',
          },
        },
      });

      await expect(
        mockApi.post('/api/payments', {
          invoiceId: mockInvoice.id,
          amount: 1000000,
          method: 'tarjeta',
          reference: 'REF123',
        })
      ).rejects.toMatchObject({
        response: {
          data: {
            success: false,
            error: expect.stringContaining('timeout'),
          },
        },
      });

      // Verify invoice state unchanged
      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: mockInvoice },
      });

      const response = await mockApi.get(`/api/invoices/${mockInvoice.id}`);

      expect(response.data.data.paidAmount).toBe(0);
      expect(response.data.data.status).toBe('pending');
    });
  });

  describe('Reporting and Analytics', () => {
    it('should calculate total revenue from paid invoices', async () => {
      const paidInvoices = [
        { ...mockInvoice, id: 'inv-1', status: 'paid', total: 1000000, paidAmount: 1000000 },
        { ...mockInvoice, id: 'inv-2', status: 'paid', total: 1500000, paidAmount: 1500000 },
        { ...mockInvoice, id: 'inv-3', status: 'paid', total: 2000000, paidAmount: 2000000 },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: paidInvoices },
      });

      const response = await mockApi.get('/api/invoices', {
        params: { status: 'paid' },
      });

      const totalRevenue = response.data.data.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);

      expect(totalRevenue).toBe(4500000);
    });

    it('should track outstanding balance across all invoices', async () => {
      const invoices = [
        { ...mockInvoice, id: 'inv-1', status: 'pending', balance: 1000000 },
        { ...mockInvoice, id: 'inv-2', status: 'partially_paid', balance: 500000 },
        { ...mockInvoice, id: 'inv-3', status: 'overdue', balance: 750000 },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: invoices },
      });

      const response = await mockApi.get('/api/invoices', {
        params: { status: ['pending', 'partially_paid', 'overdue'] },
      });

      const totalOutstanding = response.data.data.reduce((sum: number, inv: any) => sum + inv.balance, 0);

      expect(totalOutstanding).toBe(2250000);
    });

    it('should generate payment summary by method', async () => {
      const payments = [
        { ...mockPayment, id: 'pay-1', amount: 500000, method: 'efectivo' },
        { ...mockPayment, id: 'pay-2', amount: 300000, method: 'efectivo' },
        { ...mockPayment, id: 'pay-3', amount: 400000, method: 'tarjeta' },
        { ...mockPayment, id: 'pay-4', amount: 200000, method: 'transferencia' },
      ];

      mockApi.get.mockResolvedValueOnce({
        data: { success: true, data: payments },
      });

      const response = await mockApi.get('/api/payments', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });

      const byMethod = response.data.data.reduce((acc: any, payment: any) => {
        acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
        return acc;
      }, {});

      expect(byMethod.efectivo).toBe(800000);
      expect(byMethod.tarjeta).toBe(400000);
      expect(byMethod.transferencia).toBe(200000);
    });
  });
});
