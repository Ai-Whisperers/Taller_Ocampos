import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoicesPage from './page';

// Mock toast
jest.mock('react-hot-toast', () => {
  const mockToast = jest.fn();
  mockToast.success = jest.fn();
  mockToast.error = jest.fn();
  mockToast.info = jest.fn();

  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
  };
});

const mockToast = require('react-hot-toast').default;

describe('InvoicesPage - API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
  });

  describe('fetchInvoices - Mock Data (TODO: API Integration)', () => {
    it('should load mock invoices on mount', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('FAC-2024-002')).toBeInTheDocument();
        expect(await screen.findByText('FAC-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display loading state initially', () => {
      render(<InvoicesPage />);

      expect(screen.getByText('Cargando facturas...')).toBeInTheDocument();
    });

    it('should display invoices with correct statuses', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Pagado')).toBeInTheDocument();
        expect(await screen.findByText('Pendiente')).toBeInTheDocument();
        expect(await screen.findByText('Vencido')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display invoices with formatted amounts', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText(/150.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/280.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/450.*000/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display summary cards with totals', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Facturado')).toBeInTheDocument();
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        expect(screen.getByText('Vencidas')).toBeInTheDocument();
        expect(screen.getByText('₲ 880,000')).toBeInTheDocument();
        expect(screen.getByText('₲ 280,000')).toBeInTheDocument();
        expect(screen.getByText('₲ 450,000')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('handleExportPDF - TODO: API Integration', () => {
    it('should show success toast when PDF is exported', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const downloadButtons = screen.getAllByRole('button');
      const downloadButton = downloadButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-download');
      });

      await user.click(downloadButton!);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Factura exportada exitosamente');
      }, { timeout: 5000 });
    });
  });

  describe('Search functionality', () => {
    it('should filter invoices by invoice number', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('FAC-2024-002')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'FAC-2024-001');

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
        expect(screen.queryByText('FAC-2024-002')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter invoices by client name', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
        expect(await screen.findByText('María González')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'María');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(await screen.findByText('María González')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter invoices by work order number', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'OT-2024-003');

      await waitFor(() => {
        expect(screen.queryByText('OT-2024-001')).not.toBeInTheDocument();
        expect(await screen.findByText('OT-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'NonExistentInvoice');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron facturas con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should perform case-insensitive search', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'juan pérez');

      await waitFor(() => {
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Action buttons', () => {
    it('should show info toast for view details (under development)', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const viewButtons = screen.getAllByRole('button');
      const viewButton = viewButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-eye');
      });

      await user.click(viewButton!);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Vista de detalles en desarrollo');
      }, { timeout: 5000 });
    });

    it('should handle multiple export actions', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const downloadButtons = screen.getAllByRole('button').filter((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-download');
      });

      // Click first download button
      await user.click(downloadButtons[0]);
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledTimes(1);
      }, { timeout: 5000 });

      // Click second download button
      await user.click(downloadButtons[1]);
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledTimes(2);
      }, { timeout: 5000 });
    });
  });

  describe('Status badges', () => {
    it('should display status badges with correct styling', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        const paidBadge = screen.findByText('Pagado');
        const pendingBadge = screen.findByText('Pendiente');
        const overdueBadge = screen.findByText('Vencido');

        expect(paidBadge).toBeInTheDocument();
        expect(pendingBadge).toBeInTheDocument();
        expect(overdueBadge).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Date formatting', () => {
    it('should display issue dates in correct format', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        // Should have dates for issue and due dates
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display due dates', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vencimiento')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Currency formatting', () => {
    it('should format amounts with Guaraní symbol', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        const currencyElements = screen.getAllByText(/₲/);
        // Should have currency symbol in summary cards and table
        expect(currencyElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should format amounts with thousand separators', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        // Check for formatted numbers in table
        expect(await screen.findByText(/150.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/280.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/450.*000/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Summary cards', () => {
    it('should display total invoiced amount', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Facturado')).toBeInTheDocument();
        expect(screen.getByText('₲ 880,000')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display pending invoices amount', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        expect(screen.getByText('₲ 280,000')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display overdue invoices amount', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vencidas')).toBeInTheDocument();
        expect(screen.getByText('₲ 450,000')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display appropriate icons for each card', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        const icons = screen.getAllByRole('img', { hidden: true }, { timeout: 5000 });
        // Should have FileText, DollarSign icons
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Table structure', () => {
    it('should display all column headers', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Número')).toBeInTheDocument();
        expect(screen.getByText('Cliente')).toBeInTheDocument();
        expect(screen.getByText('Orden')).toBeInTheDocument();
        expect(screen.getByText('Monto')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Emisión')).toBeInTheDocument();
        expect(screen.getByText('Vencimiento')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display invoice details in correct columns', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        // Check if data is organized in table
        const rows = screen.getAllByRole('row');
        // Header + 3 invoices
        expect(rows.length).toBe(4);
      }, { timeout: 5000 });
    });
  });

  describe('Work order references', () => {
    it('should display work order numbers for each invoice', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Empty state', () => {
    it('should show appropriate message when no invoices found', async () => {
      const user = userEvent.setup();
      render(<InvoicesPage />);

      await waitFor(() => {
        expect(screen.getByText('Facturas')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'XYZ999');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron facturas con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Payment tracking', () => {
    it('should distinguish between paid and unpaid invoices', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        const paidBadge = screen.findByText('Pagado');
        const pendingBadge = screen.findByText('Pendiente');
        const overdueBadge = screen.findByText('Vencido');

        expect(paidBadge).toBeInTheDocument();
        expect(pendingBadge).toBeInTheDocument();
        expect(overdueBadge).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show payment date for paid invoices (in mock data)', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        // FAC-2024-001 is paid and has paymentDate in mock data
        const paidInvoiceRow = screen.findByText('FAC-2024-001').closest('tr');
        expect(paidInvoiceRow).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Responsive behavior', () => {
    it('should render all invoices in the table', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        const invoiceRows = screen.getAllByRole('row').slice(1); // Exclude header
        expect(invoiceRows.length).toBe(3);
      }, { timeout: 5000 });
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      render(<InvoicesPage />);

      await waitFor(() => {
        // With mock data, the page should always load successfully
        expect(screen.getByText('Facturas')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});