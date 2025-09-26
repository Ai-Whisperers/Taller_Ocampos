import { render, screen, userEvent } from '../../../tests/utils/test-utils';
import { DashboardLayout } from './DashboardLayout';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/dashboard',
  }),
  usePathname: () => '/dashboard',
}));

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('DashboardLayout', () => {
  const mockChildren = <div data-testid="dashboard-content">Dashboard Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard layout with children', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // sidebar
  });

  it('displays user information in header', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows navigation menu items', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /clients/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /vehicles/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /work orders/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /invoices/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /payments/i })).toBeInTheDocument();
  });

  it('handles logout functionality', async () => {
    const user = userEvent.setup();
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
  });

  it('shows user role badge', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('renders with staff user role', () => {
    const staffContext = {
      ...mockAuthContext,
      user: {
        ...mockAuthContext.user,
        role: 'STAFF',
      },
    };

    jest.mock('../../contexts/AuthContext', () => ({
      useAuth: () => staffContext,
    }));

    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText('STAFF')).toBeInTheDocument();
  });

  it('toggles sidebar visibility on mobile', async () => {
    const user = userEvent.setup();

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(menuToggle);

    // Sidebar should be visible after toggle
    expect(screen.getByRole('navigation')).toHaveClass('open');
  });

  it('highlights active navigation item', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('active');
  });

  it('shows notification indicator when there are notifications', () => {
    const contextWithNotifications = {
      ...mockAuthContext,
      notifications: [
        { id: '1', message: 'New work order', read: false },
      ],
    };

    jest.mock('../../contexts/AuthContext', () => ({
      useAuth: () => contextWithNotifications,
    }));

    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    const firstLink = screen.getByRole('link', { name: /dashboard/i });
    await user.tab();

    expect(firstLink).toHaveFocus();
  });

  it('displays loading state when user is loading', () => {
    const loadingContext = {
      ...mockAuthContext,
      loading: true,
      user: null,
    };

    jest.mock('../../contexts/AuthContext', () => ({
      useAuth: () => loadingContext,
    }));

    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('redirects unauthenticated users', () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: false,
      user: null,
    };

    jest.mock('../../contexts/AuthContext', () => ({
      useAuth: () => unauthenticatedContext,
    }));

    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
  });

  it('handles responsive design breakpoints', () => {
    // Desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const { rerender } = render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByRole('navigation')).toHaveClass('desktop');

    // Mobile
    Object.defineProperty(window, 'innerWidth', {
      value: 600,
    });

    rerender(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByRole('navigation')).toHaveClass('mobile');
  });

  it('supports theme switching', async () => {
    const user = userEvent.setup();
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    await user.click(themeToggle);

    expect(document.documentElement).toHaveClass('dark');
  });

  it('displays breadcrumb navigation', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('handles accessibility requirements', () => {
    render(<DashboardLayout>{mockChildren}</DashboardLayout>);

    // Check for proper ARIA labels
    expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Site header');
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content');

    // Check for skip link
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeInTheDocument();
  });
});