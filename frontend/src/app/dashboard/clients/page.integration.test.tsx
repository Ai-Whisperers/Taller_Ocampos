import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientsPage from './page';
import { toast } from 'react-hot-toast';

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: jest.fn(),
  default: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Clients Page - Automated Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Add New Client - Opens Form', () => {
    it('should open form when clicking "Nuevo Cliente" button', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
      });

      // Click "Nuevo Cliente" button (find by role and text content)
      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find(btn => btn.textContent?.includes('Nuevo'));
      expect(newButton).toBeInTheDocument();

      await user.click(newButton!);

      // Verify form is open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // Use getAllByText and check the one in dialog
        const titles = screen.getAllByText('Nuevo Cliente');
        expect(titles.length).toBeGreaterThan(0);
      });

      // Verify all form fields are present
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();

      // Verify action buttons
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('should have empty form fields when opening new client dialog', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find(btn => btn.textContent?.includes('Nuevo'));
      await user.click(newButton!);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nombre completo/i) as HTMLInputElement;
        const phoneInput = screen.getByLabelText(/teléfono/i) as HTMLInputElement;
        const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
        const addressInput = screen.getByLabelText(/dirección/i) as HTMLInputElement;

        expect(nameInput.value).toBe('');
        expect(phoneInput.value).toBe('');
        expect(emailInput.value).toBe('');
        expect(addressInput.value).toBe('');
      });
    });

    it('should close form when clicking cancel button', async () => {
      const user = userEvent.setup();
      const mockClients = { success: true, data: [] };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes')).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const newButton = buttons.find(btn => btn.textContent?.includes('Nuevo'));
      await user.click(newButton!);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Client - Opens with Correct Data', () => {
    it('should open edit form with client data when clicking edit button', async () => {
      const user = userEvent.setup();
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción, Paraguay',
            vehicleCount: 2,
            lastVisit: '2024-01-15',
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

      // Find and click edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-edit-2');
      });

      await user.click(editButton!);

      // Verify form opens with dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
      });

      // Verify form is populated with correct data
      const nameInput = screen.getByLabelText(/nombre completo/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/teléfono/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const addressInput = screen.getByLabelText(/dirección/i) as HTMLInputElement;

      expect(nameInput.value).toBe('Juan Pérez');
      expect(phoneInput.value).toBe('0981234567');
      expect(emailInput.value).toBe('juan@test.com');
      expect(addressInput.value).toBe('Asunción, Paraguay');

      // Verify update button is present
      expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    });

    it('should allow editing client data and submit', async () => {
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

      const mockUpdateResponse = { success: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => mockClients })
        .mockResolvedValueOnce({ json: async () => mockUpdateResponse })
        .mockResolvedValueOnce({ json: async () => mockClients });

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

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Edit the phone number
      const phoneInput = screen.getByLabelText(/teléfono/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '0987654321');

      // Submit form
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
    });
  });

  describe('Delete Client - Confirmation and Deletion', () => {
    it('should show confirmation dialog when clicking delete button', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm');
      confirmSpy.mockReturnValue(false);

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

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg.text-red-500');
        return svg?.classList.contains('lucide-trash-2');
      });

      await user.click(deleteButton!);

      expect(confirmSpy).toHaveBeenCalledWith('¿Está seguro de eliminar este cliente?');

      confirmSpy.mockRestore();
    });

    it('should NOT delete client when user cancels confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm');
      confirmSpy.mockReturnValue(false);

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

      // Verify DELETE request was NOT made
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial GET

      confirmSpy.mockRestore();
    });

    it('should delete client correctly when user confirms', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm');
      confirmSpy.mockReturnValue(true);

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
        expect(toast).toHaveBeenCalledWith('Cliente eliminado exitosamente');
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Vehicles Count - Matches Actual Vehicles', () => {
    it('should display correct vehicle count for each client', async () => {
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Juan Pérez',
            phone: '0981234567',
            email: 'juan@test.com',
            address: 'Asunción',
            vehicleCount: 3,
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
          {
            id: '3',
            name: 'Carlos López',
            phone: '0991234567',
            email: 'carlos@test.com',
            address: 'San Lorenzo',
            vehicleCount: 0,
            lastVisit: null,
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
        expect(screen.getByText('Carlos López')).toBeInTheDocument();
      });

      // Verify vehicle counts are displayed correctly
      const juanRow = screen.getByText('Juan Pérez').closest('tr');
      const mariaRow = screen.getByText('María González').closest('tr');
      const carlosRow = screen.getByText('Carlos López').closest('tr');

      expect(juanRow?.textContent).toContain('3');
      expect(mariaRow?.textContent).toContain('1');
      expect(carlosRow?.textContent).toContain('0');
    });

    it('should display vehicle icon next to count', async () => {
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

      const row = screen.getByText('Juan Pérez').closest('tr');
      const carIcon = row?.querySelector('svg.lucide-car');

      expect(carIcon).toBeInTheDocument();
    });
  });

  describe('Actions Per Client - View/Edit/Delete Work', () => {
    it('should have all three action buttons for each client', async () => {
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

      // Get all rows (excluding header)
      const rows = screen.getAllByRole('row').slice(1);

      expect(rows.length).toBe(2);

      rows.forEach((row) => {
        // Check for view button (Eye icon)
        const viewButton = row.querySelector('svg.lucide-eye');
        expect(viewButton).toBeInTheDocument();

        // Check for edit button (Edit2 icon)
        const editButton = row.querySelector('svg.lucide-edit-2');
        expect(editButton).toBeInTheDocument();

        // Check for delete button (Trash2 icon with red color)
        const deleteButton = row.querySelector('svg.lucide-trash-2.text-red-500');
        expect(deleteButton).toBeInTheDocument();
      });
    });

    it('should trigger view action when clicking view button', async () => {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button');
      const viewButton = viewButtons.find((btn) => {
        const svg = btn.querySelector('svg.lucide-eye');
        return svg !== null;
      });

      await user.click(viewButton!);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith('Vista de detalles en desarrollo');
      });
    });

    it('should trigger edit action when clicking edit button', async () => {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find((btn) => {
        const svg = btn.querySelector('svg.lucide-edit-2');
        return svg !== null;
      });

      await user.click(editButton!);

      await waitFor(() => {
        expect(screen.getByText('Editar Cliente')).toBeInTheDocument();
      });
    });

    it('should trigger delete action when clicking delete button', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.spyOn(window, 'confirm');
      confirmSpy.mockReturnValue(false);

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
        const svg = btn.querySelector('svg.lucide-trash-2.text-red-500');
        return svg !== null;
      });

      await user.click(deleteButton!);

      expect(confirmSpy).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Last Visit - Format is Correct', () => {
    it('should display last visit date in correct format (dd/mm/yyyy)', async () => {
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
            lastVisit: '2024-12-25',
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

      // Check for date pattern (dd/mm/yyyy) in Paraguay locale
      const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}/;
      const dates = screen.getAllByText(datePattern);

      expect(dates.length).toBeGreaterThan(0);

      // Verify specific dates are formatted correctly
      const juanRow = screen.getByText('Juan Pérez').closest('tr');
      const mariaRow = screen.getByText('María González').closest('tr');

      expect(juanRow?.textContent).toMatch(/15\/1\/2024|15\/01\/2024/);
      expect(mariaRow?.textContent).toMatch(/25\/12\/2024/);
    });

    it('should display dash when lastVisit is null or undefined', async () => {
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Carlos López',
            phone: '0991234567',
            email: 'carlos@test.com',
            address: 'San Lorenzo',
            vehicleCount: 0,
            lastVisit: null,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Carlos López')).toBeInTheDocument();
      });

      const row = screen.getByText('Carlos López').closest('tr');

      // Check for dash in the last visit column
      expect(row?.textContent).toContain('-');
    });

    it('should use Paraguay locale for date formatting', async () => {
      const mockClients = {
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Client',
            phone: '0981234567',
            email: 'test@test.com',
            address: 'Test',
            vehicleCount: 1,
            lastVisit: '2024-03-01',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Client')).toBeInTheDocument();
      });

      // Verify the date uses es-PY locale format
      const row = screen.getByText('Test Client').closest('tr');

      // es-PY locale typically formats as dd/mm/yyyy
      expect(row?.textContent).toMatch(/1\/3\/2024|01\/03\/2024/);
    });
  });

  describe('Search Filters - Name/Phone/Email', () => {
    it('should filter clients by name correctly', async () => {
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

    it('should filter clients by phone correctly', async () => {
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
      await user.type(searchInput, '0987654321');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(screen.getByText('María González')).toBeInTheDocument();
      });
    });

    it('should filter clients by email correctly', async () => {
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
      await user.type(searchInput, 'maria@test.com');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(screen.getByText('María González')).toBeInTheDocument();
      });
    });

    it('should perform case-insensitive search', async () => {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);

      // Search with lowercase
      await user.type(searchInput, 'juan pérez');

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Clear and search with uppercase
      await user.clear(searchInput);
      await user.type(searchInput, 'JUAN PÉREZ');

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });

    it('should show "no results" message when search has no matches', async () => {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockClients,
      });

      render(<ClientsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      await user.type(searchInput, 'NonExistentClient');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(screen.getByText('No se encontraron clientes con ese criterio')).toBeInTheDocument();
      });
    });

    it('should clear search and show all clients when input is cleared', async () => {
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

      // Filter to one client
      await user.type(searchInput, 'Juan');

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.queryByText('María González')).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María González')).toBeInTheDocument();
      });
    });
  });
});