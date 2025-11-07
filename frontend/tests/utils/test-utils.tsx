import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Mock AuthContext for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Test data generators
export const testData = {
  user: {
    admin: {
      id: '1',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
      phone: '1234567890',
    },
    staff: {
      id: '2',
      email: 'staff@test.com',
      name: 'Staff User',
      role: 'STAFF',
      phone: '0987654321',
    },
  },
  client: {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
  },
  vehicle: {
    id: '1',
    clientId: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'ABC123',
    vin: '1234567890',
    color: 'Blue',
    mileage: 15000,
  },
  workOrder: {
    id: '1',
    orderNumber: 'WO-2024-001',
    clientId: '1',
    vehicleId: '1',
    status: 'IN_PROGRESS',
    description: 'Oil change and tire rotation',
    estimatedCost: 150.00,
    actualCost: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({
    success: true,
    data,
  }),
  error: (message: string, statusCode: number = 400) => ({
    success: false,
    message,
    statusCode,
  }),
  paginated: (data: any[], page: number = 1, limit: number = 10, total: number = 100) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }),
};

// Form testing utilities
export const fillForm = async (
  container: HTMLElement,
  formData: Record<string, string>
) => {
  const user = userEvent.setup();

  for (const [name, value] of Object.entries(formData)) {
    const input = container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
};

// Wait utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Local storage mock
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

// Setup local storage mock (use in test files)
export const setupLocalStorageMock = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
  });
};

// Mock fetch
export const mockFetch = (response: any, status: number = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    } as Response)
  );
};