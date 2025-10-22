import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientsPage from './page';

// Mock toast
const mockToast = jest.fn();
mockToast.success = jest.fn();
mockToast.error = jest.fn();
mockToast.info = jest.fn();

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  toast: mockToast,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('ClientsPage - API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
  });

  describe('fetchClients - GET /api/clients', () => {
    it('should fetch clients successfully on mount', async () => {
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
            lastVisit: '2024-01-15',
          },
          {
            id: '2',
            name: 'María González',
            phone: '0987654321',
            email: 'maria@test.com',
            address: 'Luque',
            vehicleCount: 1,
            lastVisit: '2024-01-20',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/clients');
      });

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María González')).toBeInTheDocument();
      });
    });

    it('should show error toast when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<ClientsPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al cargar clientes');
      });
    });

    it('should show error toast when API returns success: false', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false }),
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al cargar clientes');
      });
    });

    it('should display loading state while fetching', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ClientsPage />);

      expect(screen.getByText('Cargando clientes...')).toBeInTheDocument();
    });
  });

  describe('createClient - POST /api/clients', () => {
    it('should create a new client successfully', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };
      const mockCreateResponse = { success: true, data: { id: '3' } };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({ json: async () => mockCreateResponse })
        .mockResolvedValueOnce({ json: async () => mockClients });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
      });

      // Open dialog
      const newButton = screen.getByRole('button', { name: /nuevo cliente/i });
      await user.click(newButton);

      // Fill form
      const nameInput = screen.getByLabelText(/nombre completo/i);
      const phoneInput = screen.getByLabelText(/teléfono/i);
      const emailInput = screen.getByLabelText(/email/i);
      const addressInput = screen.getByLabelText(/dirección/i);

      await user.type(nameInput, 'Carlos López');
      await user.type(phoneInput, '0991234567');
      await user.type(emailInput, 'carlos@test.com');
      await user.type(addressInput, 'San Lorenzo');

      // Submit
      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/clients',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Carlos López',
              phone: '0991234567',
              email: 'carlos@test.com',
              address: 'San Lorenzo',
            }),
          }
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Cliente creado exitosamente');
      });
    });

    it('should show error when create fails', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({
          json: async () => ({ success: false, message: 'Email already exists' }),
        });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
      });

      const newButton = screen.getByRole('button', { name: /nuevo cliente/i });
      await user.click(newButton);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      const phoneInput = screen.getByLabelText(/teléfono/i);
      const addressInput = screen.getByLabelText(/dirección/i);

      await user.type(nameInput, 'Test User');
      await user.type(phoneInput, '0991234567');
      await user.type(addressInput, 'Test Address');

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Email already exists');
      });
    });

    it('should handle network error during create', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
      });

      const newButton = screen.getByRole('button', { name: /nuevo cliente/i });
      await user.click(newButton);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      const phoneInput = screen.getByLabelText(/teléfono/i);
      const addressInput = screen.getByLabelText(/dirección/i);

      await user.type(nameInput, 'Test User');
      await user.type(phoneInput, '0991234567');
      await user.type(addressInput, 'Test Address');

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al guardar cliente');
      });
    });
  });

  describe('updateClient - PUT /api/clients/:id', () => {
    it('should update an existing client successfully', async () => {
      const user = userEvent.setup();
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
            lastVisit: '2024-01-15',
          },
        ],
      };
      const mockUpdateResponse = { success: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({ json: async () => mockUpdateResponse })
        .mockResolvedValueOnce({ json: async () => mockClients });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-edit-2');
      });
      await user.click(editButton!);

      // Update name
      const nameInput = screen.getByLabelText(/nombre completo/i) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Juan Pérez Updated');

      // Submit
      const updateButton = screen.getByRole('button', { name: /actualizar/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/clients/1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Cliente actualizado exitosamente');
      });
    });

    it('should show error when update fails', async () => {
      const user = userEvent.setup();
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({
          json: async () => ({ success: false, message: 'Update failed' }),
        });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

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
      });
    });
  });

  describe('deleteClient - DELETE /api/clients/:id', () => {
    it('should delete a client successfully', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => true);

      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
          },
        ],
      };
      const mockDeleteResponse = { success: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({ json: async () => mockDeleteResponse })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/clients/1',
          { method: 'DELETE' }
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Cliente eliminado exitosamente');
      });
    });

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => false);

      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      // Should not make DELETE request
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial GET
    });

    it('should show error when delete fails', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => true);

      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({
          json: async () => ({ success: false, message: 'Cannot delete client with vehicles' }),
        });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Cannot delete client with vehicles');
      });
    });

    it('should handle network error during delete', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn(() => true);

      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });
      await user.click(deleteButton!);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Error al eliminar cliente');
      });
    });
  });

  describe('Search and Filter functionality', () => {
    it('should filter clients based on search term', async () => {
      const user = userEvent.setup();
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 2,
          },
          {
            id: '2',
            name: 'María González',
            phone: '0987654321',
            email: 'maria@test.com',
            address: 'Luque',
            vehicleCount: 1,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María González')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'Juan');

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.queryByText('María González')).not.toBeInTheDocument();
      });
    });
  });
});