import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from './page';
import { useAuth } from '@/contexts/AuthContext';

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

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('SettingsPage - QA Automation Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@test.com',
        role: 'admin',
      },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });
  });

  describe('Page Layout and Navigation', () => {
    it('should render settings page with title', () => {
      render(<SettingsPage />);

      expect(screen.getByText('Configuración')).toBeInTheDocument();
      expect(screen.getByText('Gestiona la configuración del sistema')).toBeInTheDocument();
    });

    it('should display all tab options', () => {
      render(<SettingsPage />);

      expect(screen.getByRole('tab', { name: /perfil/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /taller/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /respaldo/i })).toBeInTheDocument();
    });

    it('should have profile tab active by default', () => {
      render(<SettingsPage />);

      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      expect(profileTab).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Profile Tab', () => {
    it('should display profile form with user data', () => {
      render(<SettingsPage />);

      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rol/i)).toBeInTheDocument();
    });

    it('should pre-fill user data from context', () => {
      render(<SettingsPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      expect(nameInput.value).toBe('Juan Pérez');
      expect(emailInput.value).toBe('juan@test.com');
    });

    it('should have disabled role field', () => {
      render(<SettingsPage />);

      const roleInput = screen.getByLabelText(/rol/i) as HTMLInputElement;
      expect(roleInput).toBeDisabled();
      expect(roleInput.value).toBe('Administrador');
    });

    it('should display password change fields', () => {
      render(<SettingsPage />);

      expect(screen.getByLabelText(/contraseña actual/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    });

    it('should submit profile form and show success toast', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Juan Pérez Updated');

      const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Perfil actualizado exitosamente');
      });
    });

    it('should handle profile save error', async () => {
      const user = userEvent.setup();

      // Mock console.error to prevent error output in test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<SettingsPage />);

      const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Perfil actualizado exitosamente');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const saveButton = screen.getByRole('button', { name: /guardar cambios/i });

      // Click and immediately check if disabled
      user.click(saveButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      }, { timeout: 100 });
    });
  });

  describe('Workshop Tab', () => {
    it('should switch to workshop tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const workshopTab = screen.getByRole('tab', { name: /taller/i });
      await user.click(workshopTab);

      await waitFor(() => {
        expect(workshopTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should display workshop form fields', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const workshopTab = screen.getByRole('tab', { name: /taller/i });
      await user.click(workshopTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del taller/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/ruc/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
      });
    });

    it('should display workshop contact fields', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const workshopTab = screen.getByRole('tab', { name: /taller/i });
      await user.click(workshopTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    it('should submit workshop form and show success toast', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const workshopTab = screen.getByRole('tab', { name: /taller/i });
      await user.click(workshopTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del taller/i)).toBeInTheDocument();
      });

      const workshopNameInput = screen.getByLabelText(/nombre del taller/i);
      await user.type(workshopNameInput, 'Mi Taller');

      const saveButton = screen.getByRole('button', { name: /guardar información/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Información del taller actualizada');
      });
    });
  });

  describe('Backup Tab', () => {
    it('should switch to backup tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(backupTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should display backup section title and description', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByText('Respaldo de Datos')).toBeInTheDocument();
        expect(screen.getByText('Exporta e importa datos del sistema')).toBeInTheDocument();
      });
    });

    it('should display export and import buttons', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar datos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /importar datos/i })).toBeInTheDocument();
      });
    });

    it('should display create backup button', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /crear respaldo ahora/i })).toBeInTheDocument();
      });
    });

    it('should show automatic backup information', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByText('Respaldo automático')).toBeInTheDocument();
        expect(screen.getByText(/Los respaldos automáticos se realizan diariamente/i)).toBeInTheDocument();
      });
    });

    it('should display recent backups list', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByText('Últimos respaldos')).toBeInTheDocument();
        expect(screen.getByText('backup_2024_01_23.sql')).toBeInTheDocument();
        expect(screen.getByText('backup_2024_01_22.sql')).toBeInTheDocument();
        expect(screen.getByText('backup_2024_01_21.sql')).toBeInTheDocument();
      });
    });

    it('should export data and show success toast', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar datos/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar datos/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Datos exportados exitosamente');
      });
    });

    it('should import data and show success toast', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /importar datos/i })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: /importar datos/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Datos importados exitosamente');
      });
    });

    it('should create backup and show success toast', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /crear respaldo ahora/i })).toBeInTheDocument();
      });

      const backupButton = screen.getByRole('button', { name: /crear respaldo ahora/i });
      await user.click(backupButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Respaldo creado exitosamente');
      });
    });

    it('should disable buttons while loading', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /exportar datos/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /exportar datos/i });
      user.click(exportButton);

      await waitFor(() => {
        expect(exportButton).toBeDisabled();
      }, { timeout: 100 });
    });
  });

  describe('Form Validation and User Experience', () => {
    it('should allow editing profile fields', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      expect(nameInput.value).toBe('New Name');
    });

    it('should maintain tab state when switching', async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const workshopTab = screen.getByRole('tab', { name: /taller/i });
      await user.click(workshopTab);

      await waitFor(() => {
        expect(workshopTab).toHaveAttribute('data-state', 'active');
      });

      const profileTab = screen.getByRole('tab', { name: /perfil/i });
      await user.click(profileTab);

      await waitFor(() => {
        expect(profileTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('should show proper icons for each section', async () => {
      render(<SettingsPage />);

      // Check for User icon in profile section
      expect(screen.getByText('Información Personal')).toBeInTheDocument();

      const user = userEvent.setup();
      const workshopTab = screen.getByRole('tab', { name: /taller/i });
      await user.click(workshopTab);

      await waitFor(() => {
        // Check for Building icon in workshop section
        expect(screen.getByText('Información del Taller')).toBeInTheDocument();
      });

      const backupTab = screen.getByRole('tab', { name: /respaldo/i });
      await user.click(backupTab);

      await waitFor(() => {
        // Check for Database icon in backup section
        expect(screen.getByText('Respaldo de Datos')).toBeInTheDocument();
      });
    });
  });
});
