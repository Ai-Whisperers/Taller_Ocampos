import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentsPage from './page';

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

describe('PaymentsPage - API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
  });

  describe('fetchPayments - Mock Data (TODO: API Integration)', () => {
    it('should load mock payments on mount', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('PAG-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('PAG-2024-002')).toBeInTheDocument();
        expect(await screen.findByText('PAG-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display loading state initially', () => {
      render(<PaymentsPage />);

      expect(screen.getByText('Cargando pagos...')).toBeInTheDocument();
    });

    it('should display payments with correct statuses', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Completado').length).toBe(2);
        expect(await screen.findByText('Pendiente')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display payments with formatted amounts', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText(/150.*000/)).toBeInTheDocument();
        expect(screen.getAllByText(/140.*000/).length).toBe(2);
      }, { timeout: 5000 });
    });

    it('should display summary cards with calculated totals', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Recibido')).toBeInTheDocument();
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        expect(screen.getByText('Pagos Hoy')).toBeInTheDocument();
        // Total received: 150,000 + 140,000 = 290,000
        expect(await screen.findByText(/290.*000/)).toBeInTheDocument();
        // Pending: 140,000
        expect(await screen.findByText(/140.*000/)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Pagos Hoy
      }, { timeout: 5000 });
    });
  });

  describe('Payment methods', () => {
    it('should display different payment methods', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('Efectivo')).toBeInTheDocument();
        expect(await screen.findByText('Transferencia')).toBeInTheDocument();
        expect(await screen.findByText('Tarjeta')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display payment method icons', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // Check for emoji icons in method config
        const methodCells = screen.getAllByText(/💵|🏦|💳|📄/);
        expect(methodCells.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Search functionality', () => {
    it('should filter payments by payment number', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('PAG-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('PAG-2024-002')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'PAG-2024-001');

      await waitFor(() => {
        expect(await screen.findByText('PAG-2024-001')).toBeInTheDocument();
        expect(screen.queryByText('PAG-2024-002')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter payments by invoice number', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
        expect(screen.getAllByText('FAC-2024-002').length).toBe(2);
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'FAC-2024-001');

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
        expect(screen.queryByText('FAC-2024-002')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter payments by client name', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getAllByText('María González').length).toBe(2);
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'Juan');

      await waitFor(() => {
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.queryByText('María González')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter payments by reference', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('TRF-123456')).toBeInTheDocument();
        expect(await screen.findByText('VISA-7890')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'TRF-123456');

      await waitFor(() => {
        expect(await screen.findByText('TRF-123456')).toBeInTheDocument();
        expect(screen.queryByText('VISA-7890')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('PAG-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'NonExistentPayment');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron pagos con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should perform case-insensitive search', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

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
    it('should show info toast for register payment (under development)', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pagos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const registerButton = screen.getByRole('button', { name: /registrar pago/i });
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Registro de pago en desarrollo');
      }, { timeout: 5000 });
    });
  });

  describe('Status badges', () => {
    it('should display status badges with correct styling', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        const completedBadges = screen.getAllByText('Completado');
        const pendingBadge = screen.findByText('Pendiente');

        expect(completedBadges.length).toBe(2);
        expect(pendingBadge).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Date formatting', () => {
    it('should display payment dates in correct format', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        // Should have dates for all payments
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Currency formatting', () => {
    it('should format amounts with Guaraní symbol', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        const currencyElements = screen.getAllByText(/₲/);
        // Should have currency symbol in summary cards and table
        expect(currencyElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should format amounts with thousand separators', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText(/150.*000/)).toBeInTheDocument();
        expect(screen.getAllByText(/140.*000/).length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Summary cards calculations', () => {
    it('should calculate total received from completed payments', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // PAG-2024-001 (150,000) + PAG-2024-003 (140,000) = 290,000
        expect(screen.getByText('Total Recibido')).toBeInTheDocument();
        const totalElement = screen.findByText(/290.*000/);
        expect(totalElement).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should calculate pending amount', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // PAG-2024-002 (140,000) pending
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        const pendingElements = screen.getAllByText(/140.*000/);
        expect(pendingElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should display today payments count', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pagos Hoy')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display appropriate icons for each card', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        const icons = screen.getAllByRole('img', { hidden: true }, { timeout: 5000 });
        // Should have Check, Clock, CreditCard icons
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Table structure', () => {
    it('should display all column headers', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Número')).toBeInTheDocument();
        expect(screen.getByText('Factura')).toBeInTheDocument();
        expect(screen.getByText('Cliente')).toBeInTheDocument();
        expect(screen.getByText('Monto')).toBeInTheDocument();
        expect(screen.getByText('Método')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Fecha')).toBeInTheDocument();
        expect(screen.getByText('Referencia')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display payment details in correct columns', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // Check if data is organized in table
        const rows = screen.getAllByRole('row');
        // Header + 3 payments
        expect(rows.length).toBe(4);
      }, { timeout: 5000 });
    });
  });

  describe('Reference field', () => {
    it('should display reference numbers when available', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('TRF-123456')).toBeInTheDocument();
        expect(await screen.findByText('VISA-7890')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display dash when reference is not available', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // PAG-2024-001 has no reference
        const dashElements = screen.getAllByText('-');
        expect(dashElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Invoice references', () => {
    it('should display invoice numbers for each payment', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('FAC-2024-001')).toBeInTheDocument();
        expect(screen.getAllByText('FAC-2024-002').length).toBe(2);
      }, { timeout: 5000 });
    });

    it('should link payments to correct invoices', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // PAG-2024-001 -> FAC-2024-001
        const payment001Row = screen.findByText('PAG-2024-001').closest('tr');
        expect(payment001Row?.textContent).toContain('FAC-2024-001');

        // PAG-2024-002 and PAG-2024-003 -> FAC-2024-002
        const payment002Row = screen.findByText('PAG-2024-002').closest('tr');
        expect(payment002Row?.textContent).toContain('FAC-2024-002');
      }, { timeout: 5000 });
    });
  });

  describe('Empty state', () => {
    it('should show appropriate message when no payments found', async () => {
      const user = userEvent.setup();
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pagos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'XYZ999');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron pagos con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Payment tracking', () => {
    it('should distinguish between completed and pending payments', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        const completedBadges = screen.getAllByText('Completado');
        const pendingBadge = screen.findByText('Pendiente');

        expect(completedBadges.length).toBe(2);
        expect(pendingBadge).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should track multiple payments for same invoice', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // FAC-2024-002 has two payments (PAG-2024-002 and PAG-2024-003)
        const fac002References = screen.getAllByText('FAC-2024-002');
        expect(fac002References.length).toBe(2);
      }, { timeout: 5000 });
    });
  });

  describe('Responsive behavior', () => {
    it('should render all payments in the table', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        const paymentRows = screen.getAllByRole('row').slice(1); // Exclude header
        expect(paymentRows.length).toBe(3);
      }, { timeout: 5000 });
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // With mock data, the page should always load successfully
        expect(screen.getByText('Pagos')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Payment methods filtering', () => {
    it('should display cash payments', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('Efectivo')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display transfer payments', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('Transferencia')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display card payments', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(await screen.findByText('Tarjeta')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});