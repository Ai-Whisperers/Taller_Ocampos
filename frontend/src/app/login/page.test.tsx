import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('LoginPage - QA Automation Testing', () => {
  const mockLogin = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      logout: jest.fn(),
      register: jest.fn(),
    });
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
  });

  describe('Page Layout and Branding', () => {
    it('should render login page with title', () => {
      render(<LoginPage />);

      expect(screen.getByText('Taller Mecánico')).toBeInTheDocument();
      expect(screen.getByText('Ingresa a tu cuenta para continuar')).toBeInTheDocument();
    });

    it('should display wrench icon', () => {
      const { container } = render(<LoginPage />);

      const wrenchIcon = container.querySelector('.lucide-wrench');
      expect(wrenchIcon).toBeInTheDocument();
    });

    it('should have link to register page', () => {
      render(<LoginPage />);

      const registerLink = screen.getByText('¿No tienes cuenta? Regístrate');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Form Fields', () => {
    it('should display email input field', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should display password input field', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/contraseña/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should display submit button', () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /ingresar/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should have proper autocomplete attributes', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should show errors for both empty fields', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /ingresar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
        expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
      });
    });

    it('should not show errors with valid input', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
        expect(screen.queryByText('La contraseña es requerida')).not.toBeInTheDocument();
      });
    });
  });

  describe('Login Functionality', () => {
    it('should call login function with correct credentials', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValueOnce(loginPromise);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Ingresando...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveLogin!();

      await waitFor(() => {
        expect(screen.getByText('Ingresar')).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValueOnce(loginPromise);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveLogin!();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should handle successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle login error', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Login error:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should reset loading state after error', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Ingresar')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('User Interactions', () => {
    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'user@example.com');

      expect(emailInput.value).toBe('user@example.com');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should mask password input', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/contraseña/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should navigate to register page when clicking link', async () => {
      render(<LoginPage />);

      const registerLink = screen.getByText('¿No tienes cuenta? Regístrate');
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  describe('Form Submission', () => {
    it('should submit form when pressing Enter in password field', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/contraseña/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123{Enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should not submit form with invalid data', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should clear errors on valid input', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /ingresar/i });

      // Submit with invalid email
      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Error should clear after typing valid input
      await waitFor(() => {
        expect(screen.queryByText('Email inválido')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    });

    it('should associate error messages with inputs', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /ingresar/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/(inválido|requerida)/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('should have submit button with proper role', () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /ingresar/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
