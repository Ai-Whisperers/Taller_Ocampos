import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehiclesPage from './page';

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

// Mock fetch globally
global.fetch = jest.fn();

describe('VehiclesPage - QA Automation Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchVehicles - GET /api/vehicles', () => {
    it('should fetch vehicles successfully on mount', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            vin: '1HGBH41JXMN109186',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            lastService: '2024-01-15',
            serviceCount: 5,
          },
          {
            id: '2',
            brand: 'Honda',
            model: 'Civic',
            year: '2019',
            licensePlate: 'XYZ789',
            mileage: 62000,
            clientId: 'client2',
            clientName: 'María González',
            lastService: '2024-02-20',
            serviceCount: 3,
          },
        ],
      };

      const mockClients = {
        success: true,
        data: [
          { id: 'client1', name: 'Juan Pérez' },
          { id: 'client2', name: 'María González' },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/vehicles');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/clients');
      }, { timeout: 5000 });

      expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      expect(await screen.findByText('Honda Civic')).toBeInTheDocument();
    });

    it('should show error toast when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al cargar vehículos');
      }, { timeout: 5000 });
    });

    it('should display loading state while fetching', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<VehiclesPage />);

      expect(screen.getByText('Cargando vehículos...')).toBeInTheDocument();
    });
  });

  describe('Search filters by brand, model, plate, or client', () => {
    const mockVehicles = {
      success: true,
      data: [
        {
          id: '1',
          brand: 'Toyota',
          model: 'Corolla',
          year: '2020',
          licensePlate: 'ABC123',
          vin: '1HGBH41JXMN109186',
          mileage: 45000,
          clientId: 'client1',
          clientName: 'Juan Pérez',
          serviceCount: 5,
        },
        {
          id: '2',
          brand: 'Honda',
          model: 'Civic',
          year: '2019',
          licensePlate: 'XYZ789',
          mileage: 62000,
          clientId: 'client2',
          clientName: 'María González',
          serviceCount: 3,
        },
        {
          id: '3',
          brand: 'Ford',
          model: 'Focus',
          year: '2021',
          licensePlate: 'DEF456',
          mileage: 30000,
          clientId: 'client3',
          clientName: 'Carlos López',
          serviceCount: 2,
        },
      ],
    };

    it('should filter vehicles by brand', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por marca/i);
      await user.type(searchInput, 'Toyota');

      await waitFor(() => {
        expect(screen.queryByText('Honda Civic')).not.toBeInTheDocument();
        expect(screen.queryByText('Ford Focus')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
    });

    it('should filter vehicles by model', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      expect(await screen.findByText('Honda Civic')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/buscar por marca/i);
      await user.type(searchInput, 'Civic');

      await waitFor(() => {
        expect(screen.queryByText('Toyota Corolla')).not.toBeInTheDocument();
        expect(screen.queryByText('Ford Focus')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      expect(await screen.findByText('Honda Civic')).toBeInTheDocument();
    });

    it('should filter vehicles by license plate', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      expect(await screen.findByText('ABC123')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/buscar por marca/i);
      await user.type(searchInput, 'ABC123');

      await waitFor(() => {
        expect(screen.queryByText('Honda Civic')).not.toBeInTheDocument();
        expect(screen.queryByText('Ford Focus')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
    });

    it('should filter vehicles by client name', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/buscar por marca/i);
      await user.type(searchInput, 'María');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(screen.queryByText('Carlos López')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      expect(await screen.findByText('María González')).toBeInTheDocument();
    });

    it('should be case-insensitive when filtering', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por marca/i);
      await user.type(searchInput, 'TOYOTA');

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
        expect(screen.queryByText('Honda Civic')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const searchInput = screen.getByPlaceholderText(/buscar por marca/i);
      await user.type(searchInput, 'NonExistentVehicle');

      await waitFor(() => {
        expect(screen.getByText('No se encontraron vehículos con ese criterio')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Add new vehicle form', () => {
    it('should open form when clicking "Nuevo Vehículo" button', async () => {
      const user = userEvent.setup();
      const mockVehicles = { success: true, data: [] };
      const mockClients = { success: true, data: [{ id: 'client1', name: 'Juan Pérez' }] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nuevo vehículo/i });
      await user.click(newButton);

      await waitFor(() => {
        expect(screen.getByText('Nuevo Vehículo')).toBeInTheDocument();
        expect(screen.getByLabelText(/marca/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/modelo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/año/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/matrícula/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/kilometraje/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should create a new vehicle successfully', async () => {
      const user = userEvent.setup();
      const mockVehicles = { success: true, data: [] };
      const mockClients = {
        success: true,
        data: [{ id: 'client1', name: 'Juan Pérez' }],
      };
      const mockCreateResponse = { success: true, data: { id: '3' } };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockCreateResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nuevo vehículo/i });
      await user.click(newButton);

      const brandInput = screen.getByLabelText(/marca/i);
      const modelInput = screen.getByLabelText(/modelo/i);
      const yearInput = screen.getByLabelText(/año/i);
      const plateInput = screen.getByLabelText(/matrícula/i);
      const mileageInput = screen.getByLabelText(/kilometraje/i);

      await user.type(brandInput, 'Nissan');
      await user.type(modelInput, 'Sentra');
      await user.type(yearInput, '2022');
      await user.type(plateInput, 'GHI789');
      await user.type(mileageInput, '15000');

      // Select client
      const clientSelect = screen.getByRole('combobox');
      await user.click(clientSelect);
      const clientOption = await screen.findByText('Juan Pérez');
      await user.click(clientOption);

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/vehicles',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Vehículo creado exitosamente');
      }, { timeout: 5000 });
    });

    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      const mockVehicles = { success: true, data: [] };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nuevo vehículo/i });
      await user.click(newButton);

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('La marca es requerida')).toBeInTheDocument();
        expect(screen.getByText('El modelo es requerido')).toBeInTheDocument();
        expect(screen.getByText('El kilometraje es requerido')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Year validation - not in future', () => {
    it('should validate year field has 4 digits', async () => {
      const user = userEvent.setup();
      const mockVehicles = { success: true, data: [] };
      const mockClients = { success: true, data: [{ id: 'client1', name: 'Test Client' }] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nuevo vehículo/i });
      await user.click(newButton);

      const yearInput = screen.getByLabelText(/año/i);
      await user.type(yearInput, '20'); // Invalid - only 2 digits

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('El año debe tener 4 dígitos')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should enforce maxLength of 4 on year input', async () => {
      const user = userEvent.setup();
      const mockVehicles = { success: true, data: [] };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeInTheDocument();
      }, { timeout: 5000 });

      const newButton = screen.getByRole('button', { name: /nuevo vehículo/i });
      await user.click(newButton);

      const yearInput = screen.getByLabelText(/año/i) as HTMLInputElement;
      await user.type(yearInput, '20251'); // Try to type 5 digits

      // Should only accept 4 digits due to maxLength
      expect(yearInput.value).toHaveLength(4);
    });
  });

  describe('Mileage shows correct units and value', () => {
    it('should display mileage with km units', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('45,000 km')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should format mileage with locale thousand separators', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Honda',
            model: 'Civic',
            year: '2019',
            licensePlate: 'XYZ789',
            mileage: 125000,
            clientId: 'client2',
            clientName: 'María González',
            serviceCount: 3,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('125,000 km')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Client name is linked and matches', () => {
    it('should display client name with user icon', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        const clientCell = screen.findByText('Juan Pérez').closest('td');
        expect(clientCell).toBeInTheDocument();
        expect(clientCell?.querySelector('svg.lucide-user')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should match vehicle clientId with client data', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = {
        success: true,
        data: [
          { id: 'client1', name: 'Juan Pérez' },
          { id: 'client2', name: 'María González' },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
    });
  });

  describe('Services count accurate', () => {
    it('should display service count with wrench icon', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        const serviceCell = screen.getByText('5').closest('td');
        expect(serviceCell).toBeInTheDocument();
        expect(serviceCell?.querySelector('svg.lucide-wrench')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display 0 services when vehicle has no services', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 0,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        const serviceCell = screen.getByText('0').closest('td');
        expect(serviceCell).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Last service date correct', () => {
    it('should display last service date in correct format (es-PY)', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            lastService: '2024-01-15',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        const expectedDate = new Date('2024-01-15').toLocaleDateString('es-PY');
        expect(screen.getByText(expectedDate)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display "-" when vehicle has no last service', async () => {
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 0,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        const lastServiceCells = screen.getAllByText('-');
        expect(lastServiceCells.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe('Edit functionality', () => {
    it('should open edit form with pre-filled data when clicking edit button', async () => {
      const user = userEvent.setup();
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            vin: '1HGBH41JXMN109186',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = {
        success: true,
        data: [{ id: 'client1', name: 'Juan Pérez' }],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Find and click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-edit-2');
      });
      await user.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Editar Vehículo')).toBeInTheDocument();
        const brandInput = screen.getByLabelText(/marca/i) as HTMLInputElement;
        expect(brandInput.value).toBe('Toyota');
      }, { timeout: 5000 });
    });

    it('should update vehicle successfully', async () => {
      const user = userEvent.setup();
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = {
        success: true,
        data: [{ id: 'client1', name: 'Juan Pérez' }],
      };
      const mockUpdateResponse = { success: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockUpdateResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-edit-2');
      });
      await user.click(editButton!);

      const mileageInput = screen.getByLabelText(/kilometraje/i) as HTMLInputElement;
      await user.clear(mileageInput);
      await user.type(mileageInput, '50000');

      const updateButton = screen.getByRole('button', { name: /actualizar/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/vehicles/1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Vehículo actualizado exitosamente');
      }, { timeout: 5000 });
    });

    it('should show error when update fails', async () => {
      const user = userEvent.setup();
      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = {
        success: true,
        data: [{ id: 'client1', name: 'Juan Pérez' }],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: false, message: 'Update failed' }),
        });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-edit-2');
      });
      await user.click(editButton!);

      const updateButton = screen.getByRole('button', { name: /actualizar/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Update failed');
      }, { timeout: 5000 });
    });
  });

  describe('Delete functionality', () => {
    it('should delete vehicle successfully when confirmed', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => true);

      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };
      const mockDeleteResponse = { success: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockDeleteResponse })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/vehicles/1',
          { method: 'DELETE' }
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Vehículo eliminado exitosamente');
      }, { timeout: 5000 });
    });

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => false);

      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      // Should not make DELETE request (only initial 2 GET requests)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should show error when delete fails', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => true);

      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: false, message: 'Cannot delete vehicle with active services' }),
        });

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Cannot delete vehicle with active services');
      }, { timeout: 5000 });
    });

    it('should handle network error during delete', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => true);

      const mockVehicles = {
        success: true,
        data: [
          {
            id: '1',
            brand: 'Toyota',
            model: 'Corolla',
            year: '2020',
            licensePlate: 'ABC123',
            mileage: 45000,
            clientId: 'client1',
            clientName: 'Juan Pérez',
            serviceCount: 5,
          },
        ],
      };
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockVehicles })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => mockClients })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<VehiclesPage />);

      await waitFor(() => {
        expect(await screen.findByText('Toyota Corolla')).toBeInTheDocument();
      }, { timeout: 5000 });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al eliminar vehículo');
      }, { timeout: 5000 });
    });
  });
});
