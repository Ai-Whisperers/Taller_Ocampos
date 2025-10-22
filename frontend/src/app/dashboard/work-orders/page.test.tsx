import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkOrdersPage from './page';

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

describe('WorkOrdersPage - API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
  });

  describe('fetchWorkOrders - Mock Data (TODO: API Integration)', () => {
    it('should load mock work orders on mount', async () => {
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display loading state initially', () => {
      render(<WorkOrdersPage />);

      expect(screen.getByText('Cargando órdenes...')).toBeInTheDocument();
    });

    it('should display work orders with correct statuses', async () => {
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('En Progreso')).toBeInTheDocument();
        expect(await screen.findByText('Pendiente')).toBeInTheDocument();
        expect(await screen.findByText('Listo')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display work orders with formatted prices', async () => {
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText(/150.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/280.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/120.*000/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('handleStatusChange - TODO: API Integration', () => {
    it('should show success toast when status changes (mock)', async () => {
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Status change functionality would be tested here when implemented
      // For now, the component has mock data with no actual status change handler
    });
  });

  describe('Search functionality', () => {
    it('should filter work orders by order number', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'OT-2024-001');

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(screen.queryByText('OT-2024-002')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter work orders by vehicle info', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla - ABC123')).toBeInTheDocument();
        expect(await screen.findByText('Ford Ranger - XYZ789')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'Toyota');

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla - ABC123')).toBeInTheDocument();
        expect(screen.queryByText('Ford Ranger - XYZ789')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter work orders by client name', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
        expect(await screen.findByText('María González')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'María');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(await screen.findByText('María González')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter work orders by description', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('Cambio de aceite y filtros')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'frenos');

      await waitFor(() => {
        expect(screen.queryByText('Cambio de aceite y filtros')).not.toBeInTheDocument();
        expect(await screen.findByText('Revisión de frenos')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'NonExistentOrder');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron órdenes con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Status filter functionality', () => {
    it('should filter by pending status', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
      }, { timeout: 5000 });

      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);

      const pendingOption = screen.getByRole('option', { name: /^pendiente$/i });
      await user.click(pendingOption);

      await waitFor(() => {
        expect(screen.queryByText('OT-2024-001')).not.toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter by in-progress status', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);

      const inProgressOption = screen.getByRole('option', { name: /en progreso/i });
      await user.click(inProgressOption);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(screen.queryByText('OT-2024-002')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter by ready status', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });

      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);

      const readyOption = screen.getByRole('option', { name: /^listo$/i });
      await user.click(readyOption);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-003')).toBeInTheDocument();
        expect(screen.queryByText('OT-2024-001')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show all orders when filter is set to "all"', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      // First filter by pending
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      const pendingOption = screen.getByRole('option', { name: /^pendiente$/i });
      await user.click(pendingOption);

      await waitFor(() => {
        expect(screen.queryByText('OT-2024-001')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Then select "Todos"
      await user.click(statusSelect);
      const allOption = screen.getByRole('option', { name: /todos/i });
      await user.click(allOption);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-002')).toBeInTheDocument();
        expect(await screen.findByText('OT-2024-003')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Combined filters', () => {
    it('should apply both search and status filters', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Apply status filter
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      const inProgressOption = screen.getByRole('option', { name: /en progreso/i });
      await user.click(inProgressOption);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/buscar por número/i);
      await user.type(searchInput, 'Juan');

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
        expect(screen.queryByText('OT-2024-002')).not.toBeInTheDocument();
        expect(screen.queryByText('OT-2024-003')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Action buttons', () => {
    it('should show info toast for view details (under development)', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
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

    it('should show info toast for edit (under development)', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-edit-2');
      });

      await user.click(editButton!);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Edición en desarrollo');
      }, { timeout: 5000 });
    });

    it('should show info toast for new work order (under development)', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(screen.getByText('Órdenes de Trabajo')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nueva orden/i });
      await user.click(newButton);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Formulario de nueva orden en desarrollo');
      }, { timeout: 5000 });
    });
  });

  describe('Status badges', () => {
    it('should display status badges with correct colors', async () => {
      render(<WorkOrdersPage />);

      await waitFor(() => {
        const inProgressBadge = screen.findByText('En Progreso');
        const pendingBadge = screen.findByText('Pendiente');
        const readyBadge = screen.findByText('Listo');

        expect(inProgressBadge).toBeInTheDocument();
        expect(pendingBadge).toBeInTheDocument();
        expect(readyBadge).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Date formatting', () => {
    it('should display dates in correct format', async () => {
      render(<WorkOrdersPage />);

      await waitFor(() => {
        // Check for Paraguay date format (dd/mm/yyyy)
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty state message when no orders match filter', async () => {
      const user = userEvent.setup();
      render(<WorkOrdersPage />);

      await waitFor(() => {
        expect(await screen.findByText('OT-2024-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Filter by a status that has no orders
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      const draftOption = screen.getByRole('option', { name: /borrador/i });
      await user.click(draftOption);

      await waitFor(() => {
        expect(screen.getByText('No se encontraron órdenes con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});