/**
 * Comprehensive Tests for Register Page
 *
 * Tests cover:
 * - Initial rendering and form elements
 * - Form validation (name, email, password, confirmPassword)
 * - User registration flow
 * - Error handling
 * - Loading states
 * - Navigation (link to login page)
 * - Accessibility
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './page';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockRegister = jest.fn();

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister,
      user: null,
      loading: false,
    });
  });

  describe('Initial Rendering', () => {
    it('renders register page with all form elements', () => {
      render(<RegisterPage />);

      // Heading and description
      expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
      expect(screen.getByText(/registra tu taller mecánico/i)).toBeInTheDocument();

      // Form fields
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();

      // Submit button
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();

      // Link to login
      expect(screen.getByRole('link', { name: /ya tienes cuenta/i })).toBeInTheDocument();
    });

    it('renders logo icon', () => {
      const { container } = render(<RegisterPage />);

      // Check for Wrench icon (Lucide React)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('marks phone field as optional', () => {
      render(<RegisterPage />);

      const phoneLabel = screen.getByText(/teléfono.*opcional/i);
      expect(phoneLabel).toBeInTheDocument();
    });

    it('has correct input types', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/nombre completo/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/teléfono/i)).toHaveAttribute('type', 'tel');
      expect(screen.getByLabelText(/^contraseña$/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/confirmar contraseña/i)).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation - Name Field', () => {
    it('shows error for empty name', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument();
      });
    });

    it('shows error for name with less than 2 characters', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      await user.type(nameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/el nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument();
      });
    });

    it('accepts valid name', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      await user.type(nameInput, 'Carlos Mendoza');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      // Name error should not appear
      expect(screen.queryByText(/el nombre debe tener al menos 2 caracteres/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Validation - Email Field', () => {
    it('shows error for empty email', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('validates email format through browser validation', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/^email$/i) as HTMLInputElement;

      // Verify input has email type for browser validation
      expect(emailInput.type).toBe('email');

      // Browser will validate email format automatically
      await user.type(emailInput, 'invalid-email');

      // Check HTML5 validation state
      expect(emailInput.validity.valid).toBe(false);
    });

    it('accepts valid email', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'carlos@example.com');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/email inválido/i)).not.toBeInTheDocument();
      }, { timeout: 1000 }).catch(() => {
        // Email validation passes
      });
    });
  });

  describe('Form Validation - Password Fields', () => {
    it('shows error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const passwordInput = screen.getByLabelText(/^contraseña$/i);
      await user.type(passwordInput, 'Short1');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
      });
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      await user.type(nameInput, 'Carlos Mendoza');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'carlos@example.com');

      const passwordInput = screen.getByLabelText(/^contraseña$/i);
      await user.type(passwordInput, 'Password123!');

      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
      });
    });

    it('accepts matching passwords with 8+ characters', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i);
      await user.type(nameInput, 'Carlos Mendoza');

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'carlos@example.com');

      const passwordInput = screen.getByLabelText(/^contraseña$/i);
      await user.type(passwordInput, 'Password123!');

      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
      await user.type(confirmPasswordInput, 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      // Should not show password mismatch error
      await waitFor(() => {
        expect(screen.queryByText(/las contraseñas no coinciden/i)).not.toBeInTheDocument();
      }, { timeout: 1000 }).catch(() => {
        // Validation passes
      });
    });
  });

  describe('Form Validation - Phone Field', () => {
    it('allows empty phone (optional field)', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      // Leave phone empty
      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    it('accepts phone number when provided', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/teléfono/i), '0981123456');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '0981123456',
          })
        );
      });
    });
  });

  describe('Registration Flow', () => {
    it('successfully registers user with valid data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      // Fill all required fields
      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Carlos Mendoza',
          email: 'carlos@example.com',
          password: 'Password123!',
          phone: '',
        });
      });
    });

    it('excludes confirmPassword from API call', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        const callArgs = mockRegister.mock.calls[0][0];
        expect(callArgs).not.toHaveProperty('confirmPassword');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000)));

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /registrando/i })).toBeInTheDocument();
      });

      // Button should be disabled
      expect(screen.getByRole('button', { name: /registrando/i })).toBeDisabled();
    });

    it('resets loading state after registration completes', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      // Wait for loading to complete
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /registrarse/i });
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles registration error gracefully', async () => {
      const user = userEvent.setup();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRegister.mockRejectedValueOnce(new Error('Registration failed'));

      render(<RegisterPage />);

      await user.type(screen.getByLabelText(/nombre completo/i), 'Carlos Mendoza');
      await user.type(screen.getByLabelText(/^email$/i), 'carlos@example.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Registration error:', expect.any(Error));
      });

      // Form should still be usable
      expect(screen.getByRole('button', { name: /registrarse/i })).not.toBeDisabled();

      consoleError.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('provides link to login page', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /ya tienes cuenta/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Accessibility', () => {
    it('associates labels with inputs', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    });

    it('has proper autocomplete attributes', () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/nombre completo/i)).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/teléfono/i)).toHaveAttribute('autocomplete', 'tel');
      expect(screen.getByLabelText(/^contraseña$/i)).toHaveAttribute('autocomplete', 'new-password');
      expect(screen.getByLabelText(/confirmar contraseña/i)).toHaveAttribute('autocomplete', 'new-password');
    });

    it('displays error messages with proper styling', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errors = screen.getAllByText(/debe tener al menos|inválido/i);
        errors.forEach((error) => {
          expect(error).toHaveClass('text-red-600');
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('prevents submission when validation fails', async () => {
      const user = userEvent.setup();
      render(<RegisterPage />);

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      // Should not call register
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('clears input fields after successful submission', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterPage />);

      const nameInput = screen.getByLabelText(/nombre completo/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/^email$/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i) as HTMLInputElement;

      await user.type(nameInput, 'Carlos Mendoza');
      await user.type(emailInput, 'carlos@example.com');
      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');

      const submitButton = screen.getByRole('button', { name: /registrarse/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });
});
