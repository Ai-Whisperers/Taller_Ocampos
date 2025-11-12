/**
 * Comprehensive Tests for Billing Page
 *
 * Tests cover:
 * - State management and data fetching
 * - Invoice table display and filtering
 * - Payment registration flow
 * - Invoice creation form
 * - Stats calculations
 * - User interactions and edge cases
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BillingPage from './page';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock toast
jest.mock('react-hot-toast', () => {
  const mockToastFn = jest.fn();
  mockToastFn.success = jest.fn();
  mockToastFn.error = jest.fn();
  return {
    __esModule: true,
    default: mockToastFn,
  };
});

// Get reference to the mock after it's been set up
const toast = require('react-hot-toast').default;

describe('Billing Page', () => {
  // Create mock data inline to avoid faker ES module issues
  const mockInvoices = [
    {
      id: '1',
      invoiceNumber: 'INV-001',
      clientId: 'c1',
      workOrderId: 'wo1',
      issueDate: '2024-01-01',
      dueDate: '2024-02-01',
      subtotal: 909090.91,
      iva: 90909.09,
      total: 1000000,
      paidAmount: 500000,
      status: 'partially_paid' as const,
      notes: 'Test invoice 1',
      items: [
        {
          id: 'item1',
          description: 'Service 1',
          quantity: 1,
          unitPrice: 909090.91,
          subtotal: 909090.91,
        },
      ],
      payments: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      invoiceNumber: 'INV-002',
      clientId: 'c2',
      workOrderId: 'wo2',
      issueDate: '2024-01-15',
      dueDate: '2024-02-15',
      subtotal: 681818.18,
      iva: 68181.82,
      total: 750000,
      paidAmount: 750000,
      status: 'paid' as const,
      notes: 'Test invoice 2',
      items: [
        {
          id: 'item2',
          description: 'Service 2',
          quantity: 1,
          unitPrice: 681818.18,
          subtotal: 681818.18,
        },
      ],
      payments: [],
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
    {
      id: '3',
      invoiceNumber: 'INV-003',
      clientId: 'c3',
      workOrderId: 'wo3',
      issueDate: '2024-01-20',
      dueDate: '2024-02-20',
      subtotal: 454545.45,
      iva: 45454.55,
      total: 500000,
      paidAmount: 0,
      status: 'pending' as const,
      notes: 'Test invoice 3',
      items: [
        {
          id: 'item3',
          description: 'Service 3',
          quantity: 1,
          unitPrice: 454545.45,
          subtotal: 454545.45,
        },
      ],
      payments: [],
      createdAt: '2024-01-20T00:00:00.000Z',
      updatedAt: '2024-01-20T00:00:00.000Z',
    },
  ];

  const mockPayments = [
    {
      id: 'p1',
      invoiceId: '1',
      amount: 500000,
      method: 'cash' as const,
      paymentDate: '2024-01-10',
      notes: 'Payment 1',
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: '2024-01-10T00:00:00.000Z',
    },
    {
      id: 'p2',
      invoiceId: '2',
      amount: 750000,
      method: 'transfer' as const,
      paymentDate: '2024-01-16',
      notes: 'Payment 2',
      createdAt: '2024-01-16T00:00:00.000Z',
      updatedAt: '2024-01-16T00:00:00.000Z',
    },
  ];

  const mockClients = [
    {
      id: 'c1',
      name: 'Juan Pérez',
      ruc: '80012345-1',
      phone: '0981123456',
      email: 'juan@example.com',
      address: 'Asunción',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'c2',
      name: 'María González',
      ruc: '80012346-2',
      phone: '0981123457',
      email: 'maria@example.com',
      address: 'Asunción',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'c3',
      name: 'Carlos López',
      ruc: '80012347-3',
      phone: '0981123458',
      email: 'carlos@example.com',
      address: 'Asunción',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  const mockWorkOrders = [
    {
      id: 'wo1',
      orderNumber: 'WO-001',
      clientId: 'c1',
      vehicleId: 'v1',
      status: 'closed' as const,
      description: 'Work order 1',
      totalAmount: 800000,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'wo2',
      orderNumber: 'WO-002',
      clientId: 'c2',
      vehicleId: 'v2',
      status: 'closed' as const,
      description: 'Work order 2',
      totalAmount: 600000,
      createdAt: '2024-01-15T00:00:00.000Z',
      updatedAt: '2024-01-15T00:00:00.000Z',
    },
  ];

  const setupMockFetch = () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/invoices')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockInvoices.map(inv => ({
              ...inv,
              client: mockClients.find(c => c.id === inv.clientId),
              workOrder: mockWorkOrders.find(wo => wo.clientId === inv.clientId),
            })),
          }),
        });
      }
      if (url.includes('/api/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockPayments,
          }),
        });
      }
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockClients,
          }),
        });
      }
      if (url.includes('/api/work-orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockWorkOrders,
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockFetch();
  });

  describe('Initial Rendering and Data Fetching', () => {
    it('renders page title and description', () => {
      render(<BillingPage />);

      expect(screen.getByText('Facturación y Pagos')).toBeInTheDocument();
      expect(screen.getByText(/Gestiona facturas y registra pagos/i)).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      render(<BillingPage />);

      expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
    });

    it('fetches invoices and payments on mount', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/invoices'));
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/payments'));
      });
    });

    it('fetches clients and work orders on mount', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/clients'));
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/work-orders'));
      });
    });

    it('displays invoices after loading', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.getByText('INV-002')).toBeInTheDocument();
        expect(screen.getByText('INV-003')).toBeInTheDocument();
      });
    });

    it('handles fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<BillingPage />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al cargar datos de facturación');
      });
    });
  });

  describe('Stats Cards', () => {
    it('displays Total Facturado stat', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Facturado')).toBeInTheDocument();
        // Total: 1000000 + 750000 + 500000 = 2250000
        expect(screen.getByText(/2\.250\.000/)).toBeInTheDocument();
      });
    });

    it('displays Total Recibido stat', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Recibido')).toBeInTheDocument();
        // Paid: 500000 + 750000 = 1250000
        expect(screen.getByText(/1\.250\.000/)).toBeInTheDocument();
      });
    });

    it('displays Por Cobrar stat', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Por Cobrar')).toBeInTheDocument();
        // Pending: (1000000-500000) + (500000-0) = 1000000
        expect(screen.getByText(/1\.000\.000/)).toBeInTheDocument();
      });
    });

    it('displays Vencido stat', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Vencido')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters invoices by search term (invoice number)', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por número/i);
      await user.type(searchInput, 'INV-001');

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.queryByText('INV-002')).not.toBeInTheDocument();
        expect(screen.queryByText('INV-003')).not.toBeInTheDocument();
      });
    });

    it('filters invoices by client name', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por número/i);
      await user.type(searchInput, 'Juan');

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.queryByText('INV-002')).not.toBeInTheDocument();
      });
    });

    it('filters by status: pending', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
      });

      const statusSelect = screen.getByRole('combobox', { name: /Filtrar por estado/i });
      await user.click(statusSelect);

      const pendingOption = screen.getByRole('option', { name: /Pendiente/i });
      await user.click(pendingOption);

      await waitFor(() => {
        expect(screen.getByText('INV-003')).toBeInTheDocument();
        expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
        expect(screen.queryByText('INV-002')).not.toBeInTheDocument();
      });
    });

    it('filters by status: paid', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
      });

      const statusSelect = screen.getByRole('combobox', { name: /Filtrar por estado/i });
      await user.click(statusSelect);

      const paidOption = screen.getByRole('option', { name: /Pagado/i });
      await user.click(paidOption);

      await waitFor(() => {
        expect(screen.getByText('INV-002')).toBeInTheDocument();
        expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
        expect(screen.queryByText('INV-003')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when no results found', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por número/i);
      await user.type(searchInput, 'NONEXISTENT');

      await waitFor(() => {
        expect(screen.getByText(/No se encontraron facturas con ese criterio/i)).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Table Display', () => {
    it('displays all invoice columns', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Factura')).toBeInTheDocument();
        expect(screen.getByText('Cliente')).toBeInTheDocument();
        expect(screen.getByText('Orden')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Pagado')).toBeInTheDocument();
        expect(screen.getByText('Saldo')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Vencimiento')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('displays invoice status badges with correct styling', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('Pago Parcial')).toBeInTheDocument();
        expect(screen.getByText('Pagado')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });

    it('displays action buttons for each invoice', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        // 3 invoices × 3 buttons each = 9 buttons (payment, view, download)
        const creditCardButtons = screen.getAllByTitle('Registrar pago');
        const eyeButtons = screen.getAllByTitle('Ver detalles y pagos');
        const downloadButtons = screen.getAllByTitle('Exportar PDF');

        expect(creditCardButtons).toHaveLength(3);
        expect(eyeButtons).toHaveLength(3);
        expect(downloadButtons).toHaveLength(3);
      });
    });

    it('disables payment button when invoice is fully paid', async () => {
      render(<BillingPage />);

      await waitFor(() => {
        const paymentButtons = screen.getAllByTitle('Registrar pago');
        // INV-002 is fully paid (remainingBalance = 0)
        const paidInvoiceButton = paymentButtons[1];
        expect(paidInvoiceButton).toBeDisabled();
      });
    });
  });

  describe('Payment Dialog', () => {
    it('opens payment dialog when clicking payment button', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const paymentButtons = screen.getAllByTitle('Registrar pago');
      await user.click(paymentButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
        expect(screen.getByText(/INV-001/)).toBeInTheDocument();
      });
    });

    it('prefills payment amount with remaining balance', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const paymentButtons = screen.getAllByTitle('Registrar pago');
      await user.click(paymentButtons[0]);

      await waitFor(() => {
        const amountInput = screen.getByRole('spinbutton');
        expect(amountInput).toHaveValue(500000); // remaining balance
      });
    });

    it('validates payment amount exceeds balance', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const paymentButtons = screen.getAllByTitle('Registrar pago');
      await user.click(paymentButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const amountInput = screen.getByRole('spinbutton');
      await user.clear(amountInput);
      await user.type(amountInput, '1000000');

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('excede el saldo pendiente'));
      });
    });

    it('submits payment successfully', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementationOnce((url: string, options: any) => {
        if (url.includes('/api/payments') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unexpected call'));
      });

      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const paymentButtons = screen.getAllByTitle('Registrar pago');
      await user.click(paymentButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Registrar Pago/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Pago registrado exitosamente');
      });
    });

    it('closes payment dialog on cancel', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const paymentButtons = screen.getAllByTitle('Registrar pago');
      await user.click(paymentButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Invoice Details Dialog', () => {
    it('opens invoice details dialog when clicking view button', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('Ver detalles y pagos');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Detalles de Factura')).toBeInTheDocument();
        expect(screen.getByText(/INV-001.*Juan Pérez/)).toBeInTheDocument();
      });
    });

    it('displays invoice financial summary', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('Ver detalles y pagos');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Total Factura')).toBeInTheDocument();
        expect(screen.getByText('Total Pagado')).toBeInTheDocument();
        expect(screen.getByText('Saldo Pendiente')).toBeInTheDocument();
      });
    });

    it('displays payment history for invoice', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('Ver detalles y pagos');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Historial de Pagos')).toBeInTheDocument();
      });
    });

    it('shows empty payment history message when no payments', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-003')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('Ver detalles y pagos');
      await user.click(viewButtons[2]); // INV-003 has no payments

      await waitFor(() => {
        expect(screen.getByText(/No hay pagos registrados/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create Invoice Form', () => {
    it('toggles create invoice form when clicking button', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nueva Factura/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Nueva Factura/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/^Nueva Factura$/)).toBeInTheDocument();
        expect(screen.getByText(/Cliente \*/)).toBeInTheDocument();
      });
    });

    it('calculates IVA (10%) when subtotal changes', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nueva Factura/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Nueva Factura/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/^Nueva Factura$/)).toBeInTheDocument();
      });

      const subtotalInput = screen.getByRole('spinbutton', { name: /Subtotal/i });
      await user.type(subtotalInput, '1000000');

      await waitFor(() => {
        const taxInput = screen.getByRole('spinbutton', { name: /IVA/i });
        expect(taxInput).toHaveValue(100000); // 10% of 1000000
      });
    });

    it('validates required fields on submit', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      const createButton = screen.getByRole('button', { name: /Nueva Factura/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/^Nueva Factura$/)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Crear Factura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Por favor complete los campos requeridos');
      });
    });

    it('creates invoice successfully', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementationOnce((url: string, options: any) => {
        if (url.includes('/api/invoices') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.reject(new Error('Unexpected call'));
      });

      render(<BillingPage />);

      const createButton = screen.getByRole('button', { name: /Nueva Factura/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/^Nueva Factura$/)).toBeInTheDocument();
      });

      // Fill form
      const clientSelect = screen.getByRole('combobox', { name: /Cliente/i });
      await user.click(clientSelect);

      const clientOption = await screen.findByRole('option', { name: /Juan Pérez/i });
      await user.click(clientOption);

      const subtotalInput = screen.getByRole('spinbutton', { name: /Subtotal/i });
      await user.type(subtotalInput, '1000000');

      const submitButton = screen.getByRole('button', { name: /Crear Factura/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Factura creada exitosamente');
      });
    });
  });

  describe('Edge Cases', () => {
    it('shows empty state when no invoices exist', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/invoices')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        if (url.includes('/api/payments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        if (url.includes('/api/clients')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockClients }),
          });
        }
        if (url.includes('/api/work-orders')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockWorkOrders }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText(/No hay facturas registradas aún/i)).toBeInTheDocument();
      });
    });

    it('handles PDF export click', async () => {
      const user = userEvent.setup();
      render(<BillingPage />);

      await waitFor(() => {
        expect(screen.getByText('INV-001')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByTitle('Exportar PDF');
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('Exportación en desarrollo');
      });
    });

    it('displays stats with zero values when no invoices', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/invoices') || url.includes('/api/payments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        if (url.includes('/api/clients') || url.includes('/api/work-orders')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<BillingPage />);

      await waitFor(() => {
        // All stats should show 0
        const zeroValues = screen.getAllByText(/₲\s*0/);
        expect(zeroValues.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
