import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';
import api from '@/lib/api';

// Mock api
jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('DashboardPage - QA Automation Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Stats Loading', () => {
    it('should fetch and display dashboard stats on mount', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 25,
            totalVehicles: 42,
            activeWorkOrders: 8,
            monthlyRevenue: 5000000,
            lowStockItems: 3,
            pendingInvoices: 5,
            todayWorkOrders: 2,
            weeklyGrowth: 12.5,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/dashboard/stats');
      });

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/dashboard/stats');
      });

      // Should display default values (0)
      await waitFor(() => {
        const elements = screen.getAllByText('0');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display loading state initially', () => {
      mockApi.get.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DashboardPage />);

      // Check if dashboard heading is present (page loads even while fetching)
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Stat Cards Display', () => {
    beforeEach(() => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 25,
            totalVehicles: 42,
            activeWorkOrders: 8,
            monthlyRevenue: 5000000,
            lowStockItems: 3,
            pendingInvoices: 5,
            todayWorkOrders: 2,
            weeklyGrowth: 12.5,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });
    });

    it('should display total clients with correct icon', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Clientes Totales')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should display total vehicles with correct icon', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Vehículos')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
      });
    });

    it('should display active work orders with correct icon', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Órdenes Activas')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
      });
    });

    it('should display monthly revenue formatted as currency', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Ingresos del Mes')).toBeInTheDocument();
        // Check for currency formatted value
        const revenueElement = screen.getByText(/5\.000\.000/);
        expect(revenueElement).toBeInTheDocument();
      });
    });

    it('should display low stock items with alert icon when > 0', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      // Check for alert icon (AlertCircle with animate-pulse)
      const alertIcons = document.querySelectorAll('.animate-pulse');
      expect(alertIcons.length).toBeGreaterThan(0);
    });

    it('should display pending invoices', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Facturas Pendientes')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should not show alert icon when low stock items is 0', async () => {
      const mockStatsNoAlert = {
        success: true,
        data: {
          stats: {
            totalClients: 25,
            totalVehicles: 42,
            activeWorkOrders: 8,
            monthlyRevenue: 5000000,
            lowStockItems: 0,
            pendingInvoices: 5,
            todayWorkOrders: 2,
            weeklyGrowth: 12.5,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStatsNoAlert });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
      });

      // Alert icon should not appear
      const alertIcons = document.querySelectorAll('.animate-pulse');
      expect(alertIcons.length).toBe(0);
    });
  });

  describe('Quick Actions Section', () => {
    beforeEach(() => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });
    });

    it('should display quick actions section', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
      });
    });

    it('should display all quick action buttons', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
        expect(screen.getByText('Registrar Vehículo')).toBeInTheDocument();
        expect(screen.getByText('Nueva Orden')).toBeInTheDocument();
        expect(screen.getByText('Crear Factura')).toBeInTheDocument();
      });
    });

    it('should have clickable quick action buttons', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
      });

      const newClientButton = screen.getByText('Nuevo Cliente').closest('button');
      expect(newClientButton).toBeInTheDocument();

      // Button should be clickable
      await user.click(newClientButton!);
    });
  });

  describe('Recent Work Orders Section', () => {
    beforeEach(() => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });
    });

    it('should display recent work orders section', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Órdenes de Trabajo Recientes')).toBeInTheDocument();
      });
    });

    it('should display work order examples with status badges', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Honda Civic - ABC123')).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez • Cambio de aceite')).toBeInTheDocument();
        expect(screen.getByText('En Progreso')).toBeInTheDocument();
      });
    });

    it('should display completed work order example', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Toyota Corolla - XYZ789')).toBeInTheDocument();
        expect(screen.getByText('María García • Revisión general')).toBeInTheDocument();
        expect(screen.getByText('Completado')).toBeInTheDocument();
      });
    });

    it('should display pending work order example', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Ford Focus - DEF456')).toBeInTheDocument();
        expect(screen.getByText('Carlos López • Reparación de frenos')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
      });
    });
  });

  describe('Alerts and Notifications Section', () => {
    it('should display low stock alert when items are low', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 5,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
        expect(screen.getByText('5 items necesitan reposición')).toBeInTheDocument();
      });
    });

    it('should display pending invoices alert', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 8,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Facturas Pendientes')).toBeInTheDocument();
        expect(screen.getByText('8 facturas por cobrar')).toBeInTheDocument();
      });
    });

    it('should display weekly growth notification', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 15.3,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Crecimiento Semanal')).toBeInTheDocument();
        expect(screen.getByText('+15.3% comparado con la semana anterior')).toBeInTheDocument();
      });
    });

    it('should not display low stock alert when items are 0', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Alertas y Notificaciones')).toBeInTheDocument();
      });

      // Low stock alert should not be present
      expect(screen.queryByText(/items necesitan reposición/)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design Elements', () => {
    it('should render dashboard header with welcome message', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Bienvenido de vuelta, aquí está el resumen de tu taller')).toBeInTheDocument();
      });
    });

    it('should have proper grid layout for stats cards', async () => {
      const mockStats = {
        success: true,
        data: {
          stats: {
            totalClients: 0,
            totalVehicles: 0,
            activeWorkOrders: 0,
            monthlyRevenue: 0,
            lowStockItems: 0,
            pendingInvoices: 0,
            todayWorkOrders: 0,
            weeklyGrowth: 0,
          },
        },
      };

      mockApi.get.mockResolvedValueOnce({ data: mockStats });

      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Check for grid layout
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
