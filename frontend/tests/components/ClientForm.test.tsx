import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../../src/styles/theme';
import { ClientForm } from '../../src/components/forms/ClientForm';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('ClientForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all required form fields', () => {
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should validate phone number format', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/phone/i), '123');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone/i), '555-123-4567');
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-123-4567',
        email: 'john.doe@example.com',
        address: '123 Main St',
        paymentTerms: 'COD',
        preferredContact: 'phone',
      });
    });
  });

  it('should populate form when editing existing client', () => {
    const existingClient = {
      id: '1',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '555-987-6543',
      email: 'jane.smith@example.com',
      address: '456 Oak St',
      paymentTerms: 'Net 30' as const,
      preferredContact: 'email' as const,
    };

    render(
      <TestWrapper>
        <ClientForm {...defaultProps} client={existingClient} />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-987-6543')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('456 Oak St')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable form when loading', () => {
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} loading={true} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(screen.getByLabelText(/last name/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('should auto-format phone number input', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} />
      </TestWrapper>
    );

    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '5551234567');

    expect(phoneInput).toHaveValue('(555) 123-4567');
  });

  it('should show loading state on submit button when loading', () => {
    render(
      <TestWrapper>
        <ClientForm {...defaultProps} loading={true} />
      </TestWrapper>
    );

    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });
});