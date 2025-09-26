import { render, screen, userEvent, waitFor } from '../../../tests/utils/test-utils';
import { mockFetch, mockApiResponses } from '../../../tests/utils/test-utils';
import LoginPage from './page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

// Mock AuthContext
const mockLogin = jest.fn();
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: mockLogin,
  logout: jest.fn(),
  loading: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockClear();
    mockPush.mockClear();
  });

  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('displays form validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for short password', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, '123');

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockFetch(mockApiResponses.success({
      user: { id: '1', email: 'admin@test.com', name: 'Admin User' },
      token: 'mock-token',
    }));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123');
    });
  });

  it('handles login success and redirects', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message for invalid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('has link to registration page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /create account/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('has forgot password link', () => {
    render(<LoginPage />);

    const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
    expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123');
    });
  });

  it('clears form after successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  it('focuses email field on page load', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveFocus();
  });

  it('displays remember me checkbox', () => {
    render(<LoginPage />);

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberMeCheckbox).toBeInTheDocument();
  });

  it('handles remember me functionality', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123', true);
    });
  });

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('is accessible with screen readers', () => {
    render(<LoginPage />);

    expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Login form');
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true');
  });

  it('displays proper page title and meta', () => {
    render(<LoginPage />);

    expect(document.title).toContain('Login');
  });
});