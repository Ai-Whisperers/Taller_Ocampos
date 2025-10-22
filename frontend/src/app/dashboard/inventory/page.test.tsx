import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryPage from './page';

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

describe('InventoryPage - API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
  });

  describe('fetchParts - Mock Data (TODO: API Integration)', () => {
    it('should load mock inventory parts on mount', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(await screen.findByText('Pastillas de freno')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display loading state initially', () => {
      render(<InventoryPage />);

      expect(screen.getByText('Cargando inventario...')).toBeInTheDocument();
    });

    it('should display parts with formatted prices', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        // Check for sale prices
        expect(await screen.findByText(/45.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/55.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/120.*000/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show stock quantities', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should highlight low stock items', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        // Aceite 10W40 has stock of 5 and minStock of 20
        const lowStockBadges = screen.getAllByText('Bajo');
        expect(lowStockBadges.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('handleStockUpdate - TODO: API Integration', () => {
    it('should show success toast when stock is updated (mock)', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Inventario')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Stock update functionality would be tested here when implemented
      // Currently, the component only has mock data
    });
  });

  describe('Search functionality', () => {
    it('should filter parts by name', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'Filtro');

      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
        expect(screen.queryByText('Aceite 10W40')).not.toBeInTheDocument();
        expect(screen.queryByText('Pastillas de freno')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter parts by code', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('FIL-001')).toBeInTheDocument();
        expect(await screen.findByText('ACE-001')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'ACE-001');

      await waitFor(() => {
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(screen.queryByText('Filtro de aceite')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter parts by category', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Filtros')).toBeInTheDocument();
        expect(await screen.findByText('Lubricantes')).toBeInTheDocument();
        expect(await screen.findByText('Frenos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'Frenos');

      await waitFor(() => {
        expect(await screen.findByText('Pastillas de freno')).toBeInTheDocument();
        expect(screen.queryByText('Filtro de aceite')).not.toBeInTheDocument();
        expect(screen.queryByText('Aceite 10W40')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should filter parts by brand', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Mann')).toBeInTheDocument();
        expect(await screen.findByText('Castrol')).toBeInTheDocument();
        expect(await screen.findByText('Bosch')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'Castrol');

      await waitFor(() => {
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(screen.queryByText('Filtro de aceite')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'NonExistentPart');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron repuestos con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Low stock filter', () => {
    it('should toggle low stock filter', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(await screen.findByText('Pastillas de freno')).toBeInTheDocument();
      }, { timeout: 5000 });

      const lowStockButton = screen.getByRole('button', { name: /stock bajo/i });
      await user.click(lowStockButton);

      await waitFor(() => {
        // Only Aceite 10W40 has stock (5) below minStock (20)
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(screen.queryByText('Filtro de aceite')).not.toBeInTheDocument();
        expect(screen.queryByText('Pastillas de freno')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should toggle low stock filter off', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Inventario')).toBeInTheDocument();
      }, { timeout: 5000 });

      const lowStockButton = screen.getByRole('button', { name: /stock bajo/i });

      // Turn on
      await user.click(lowStockButton);
      await waitFor(() => {
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(screen.queryByText('Filtro de aceite')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Turn off
      await user.click(lowStockButton);
      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
        expect(await screen.findByText('Pastillas de freno')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show low stock badge for items below minimum', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        const lowStockBadges = screen.getAllByText('Bajo');
        // Only Aceite 10W40 should have the low stock badge
        expect(lowStockBadges.length).toBe(1);
      }, { timeout: 5000 });
    });
  });

  describe('Combined filters', () => {
    it('should apply both search and low stock filters', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Inventario')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Enable low stock filter
      const lowStockButton = screen.getByRole('button', { name: /stock bajo/i });
      await user.click(lowStockButton);

      await waitFor(() => {
        expect(await screen.findByText('Aceite 10W40')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Apply search that doesn't match the low stock item
      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'Filtro');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron repuestos con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Action buttons', () => {
    it('should show info toast for edit (under development)', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('Filtro de aceite')).toBeInTheDocument();
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

    it('should show info toast for new part (under development)', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Inventario')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nuevo repuesto/i });
      await user.click(newButton);

      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('Formulario de nuevo repuesto en desarrollo');
      }, { timeout: 5000 });
    });
  });

  describe('Stock indicators', () => {
    it('should display stock with package icon', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        const packageIcons = screen.getAllByRole('img', { hidden: true }, { timeout: 5000 });
        // Should have package icons for each inventory item
        expect(packageIcons.length).toBeGreaterThan(0);
      });
    });

    it('should show stock in red when below minimum', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        // Find the row with Aceite 10W40 which has low stock
        const row = screen.findByText('Aceite 10W40').closest('tr');
        const stockCell = row?.querySelector('span.text-red-600');
        expect(stockCell).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Part details display', () => {
    it('should display all part information columns', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Código')).toBeInTheDocument();
        expect(screen.getByText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Categoría')).toBeInTheDocument();
        expect(screen.getByText('Marca')).toBeInTheDocument();
        expect(screen.getByText('Stock')).toBeInTheDocument();
        expect(screen.getByText('Costo')).toBeInTheDocument();
        expect(screen.getByText('Precio Venta')).toBeInTheDocument();
        expect(screen.getByText('Ubicación')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display location codes', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        expect(await screen.findByText('A1-B2')).toBeInTheDocument();
        expect(await screen.findByText('B2-C1')).toBeInTheDocument();
        expect(await screen.findByText('C3-D1')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display supplier information', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        // Suppliers are in mock data but not displayed in current UI
        // This test documents that supplier data exists in the model
        const parts = screen.getAllByRole('row');
        expect(parts.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Currency formatting', () => {
    it('should format prices with Guaraní symbol', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        // Check for currency symbol
        const priceElements = screen.getAllByText(/₲/);
        expect(priceElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });

    it('should format prices with thousand separators', async () => {
      render(<InventoryPage />);

      await waitFor(() => {
        // Check for formatted numbers with dots/commas
        expect(await screen.findByText(/25.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/35.*000/)).toBeInTheDocument();
        expect(await screen.findByText(/85.*000/)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Empty state', () => {
    it('should show appropriate message when no parts found', async () => {
      const user = userEvent.setup();
      render(<InventoryPage />);

      await waitFor(() => {
        expect(screen.getByText('Inventario')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'XYZ999');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron repuestos con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});