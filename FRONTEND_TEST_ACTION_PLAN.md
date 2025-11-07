# Frontend Test Automation - Action Plan
## Taller-Ocampos Project

> **Status**: 13/50+ tests implemented (~26% complete)
> **Goal**: Achieve 70% code coverage with comprehensive unit, integration, and component tests

---

## Table of Contents
1. [Current State Assessment](#current-state-assessment)
2. [Gap Analysis](#gap-analysis)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Task Breakdown](#detailed-task-breakdown)
5. [Test Patterns & Examples](#test-patterns--examples)
6. [Success Metrics](#success-metrics)

---

## Current State Assessment

### ✅ **What's Already Done** (13 test files)

#### **Page/Route Tests** (11 files)
- ✅ `src/app/login/page.test.tsx` - Login page
- ✅ `src/app/dashboard/page.test.tsx` - Dashboard (475 lines, comprehensive)
- ✅ `src/app/dashboard/clients/page.test.tsx` - Clients list
- ✅ `src/app/dashboard/clients/page.integration.test.tsx` - Clients integration
- ✅ `src/app/dashboard/settings/page.test.tsx` - Settings page
- ✅ `src/app/dashboard/vehicles/page.test.tsx` - Vehicles page
- ✅ `src/app/dashboard/work-orders/page.test.tsx` - Work orders page
- ✅ `src/app/dashboard/inventory/page.test.tsx` - Inventory page
- ✅ `src/app/dashboard/invoices/page.test.tsx` - Invoices page
- ✅ `src/app/dashboard/payments/page.test.tsx` - Payments page

#### **Component Tests** (2 files)
- ✅ `src/components/ui/Button.test.tsx` - Button component (48 lines, well-structured)
- ✅ `src/components/layout/DashboardLayout.test.tsx` - Layout component

#### **Context Tests** (1 file)
- ✅ `src/contexts/AuthContext.test.tsx` - Authentication context with API calls

### 📊 **Test Quality Analysis**

**Strengths:**
- Excellent page-level test coverage
- Good use of Testing Library best practices
- Proper mocking of API calls and external dependencies
- Well-structured with descriptive test names
- Integration tests exist for critical flows

**Patterns Observed:**
```typescript
// Mock pattern used consistently
jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

// Testing Library render with custom wrapper
render(<Component />);
await waitFor(() => {
  expect(screen.getByText('...')).toBeInTheDocument();
});
```

---

## Gap Analysis

### ❌ **Missing Test Files** (37+ needed)

#### **UI Components** (7 missing)
```
frontend/src/components/ui/
├── Input.test.tsx           ❌ MISSING [HIGH PRIORITY]
├── Label.test.tsx           ❌ MISSING [MEDIUM]
├── Card.test.tsx            ❌ MISSING [HIGH PRIORITY]
├── Table.test.tsx           ❌ MISSING [HIGH PRIORITY]
├── Dialog.test.tsx          ❌ MISSING [HIGH PRIORITY]
├── Select.test.tsx          ❌ MISSING [HIGH PRIORITY]
├── Badge.test.tsx           ❌ MISSING [MEDIUM]
└── Tabs.test.tsx            ❌ MISSING [MEDIUM]
```

#### **Layout Components** (1 missing)
```
frontend/src/components/layout/
└── Sidebar.test.tsx         ❌ MISSING [HIGH PRIORITY]
```

#### **Page Components** (1 missing)
```
frontend/src/app/
└── register/page.test.tsx   ❌ MISSING [HIGH PRIORITY]
```

#### **API & Services** (2 missing)
```
frontend/src/lib/
├── api.test.ts              ❌ MISSING [HIGH PRIORITY]
└── utils.test.ts            ❌ MISSING [MEDIUM]
```

#### **Feature-Specific Components** (Estimated 20-25 missing)
Based on typical React app structure, missing:
- Form components for each module (clients, vehicles, work-orders, etc.)
- Detail view components
- List/table components
- Modal/dialog components
- Custom hooks (if any exist)

---

## Implementation Phases

### **Phase 1: Foundation & High-Priority (Week 1)** ⭐
**Goal**: Test critical UI components and API layer
**Estimated Time**: 8-12 hours

**Tasks:**
1. ✅ Create test patterns documentation
2. ❌ Test UI components: Input, Card, Table, Dialog, Select
3. ❌ Test API service layer (`lib/api.test.ts`)
4. ❌ Test Register page
5. ❌ Test Sidebar component

**Deliverables:**
- 8 new test files
- API integration test suite
- Test patterns guide

---

### **Phase 2: Component Coverage (Week 2)** 🎯
**Goal**: Test remaining UI components and utilities
**Estimated Time**: 6-8 hours

**Tasks:**
1. ❌ Test Label, Badge, Tabs components
2. ❌ Test utils library
3. ❌ Identify and test form components
4. ❌ Add missing integration tests

**Deliverables:**
- 10+ new test files
- Utils test coverage > 80%
- Form component tests

---

### **Phase 3: Deep Coverage (Week 3)** 🔍
**Goal**: Achieve 70% overall coverage
**Estimated Time**: 10-15 hours

**Tasks:**
1. ❌ Identify untested components from coverage report
2. ❌ Add tests for detail views and modals
3. ❌ Test edge cases and error scenarios
4. ❌ Test custom hooks (if any)
5. ❌ Add visual regression tests (optional)

**Deliverables:**
- 15+ new test files
- Coverage report showing 70%+
- Comprehensive test documentation

---

## Detailed Task Breakdown

### **Task 1: Test UI Component - Input** [2 hours]
**File**: `frontend/src/components/ui/Input.test.tsx`

**Test Cases:**
```typescript
describe('Input Component', () => {
  // Basic rendering
  it('renders input with default type text')
  it('renders with custom type (password, email, number)')
  it('renders with placeholder')

  // Controlled component
  it('handles value changes via onChange')
  it('displays initial value')

  // States
  it('can be disabled')
  it('shows error state with error prop')
  it('applies custom className')

  // Accessibility
  it('associates label with input via htmlFor')
  it('supports aria-label')
  it('supports aria-describedby for error messages')

  // User interactions
  it('focuses on input when clicked')
  it('triggers onFocus and onBlur handlers')
  it('allows text input')
});
```

**Example Implementation:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input Component', () => {
  it('renders input with placeholder', () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'Hello');
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
```

---

### **Task 2: Test UI Component - Card** [1.5 hours]
**File**: `frontend/src/components/ui/Card.test.tsx`

**Test Cases:**
```typescript
describe('Card Component', () => {
  // Subcomponents
  it('renders Card with children')
  it('renders CardHeader with title')
  it('renders CardContent with body')
  it('renders CardFooter with actions')
  it('renders CardTitle and CardDescription')

  // Composition
  it('renders full card with all subcomponents')

  // Styling
  it('applies custom className to Card')
  it('applies padding classes correctly')
});
```

---

### **Task 3: Test UI Component - Table** [2 hours]
**File**: `frontend/src/components/ui/Table.test.tsx`

**Test Cases:**
```typescript
describe('Table Component', () => {
  // Structure
  it('renders table with header and body')
  it('renders table rows and cells')
  it('handles empty data')

  // Subcomponents
  it('renders TableHeader with columns')
  it('renders TableBody with rows')
  it('renders TableRow with TableCell')
  it('renders TableHead for header cells')

  // Accessibility
  it('uses semantic HTML table elements')
  it('has proper role attributes')

  // Complex scenarios
  it('renders table with multiple columns and rows')
  it('handles nested content in cells')
});
```

---

### **Task 4: Test UI Component - Dialog** [2 hours]
**File**: `frontend/src/components/ui/Dialog.test.tsx`

**Test Cases:**
```typescript
describe('Dialog Component', () => {
  // Open/Close
  it('renders dialog when open prop is true')
  it('does not render when open is false')
  it('closes when overlay is clicked')
  it('closes when close button is clicked')

  // Subcomponents
  it('renders DialogTrigger to open dialog')
  it('renders DialogContent with children')
  it('renders DialogHeader with title')
  it('renders DialogFooter with actions')

  // Accessibility
  it('traps focus when open')
  it('restores focus when closed')
  it('closes on Escape key')
  it('has proper ARIA attributes')

  // Callbacks
  it('calls onOpenChange when opened')
  it('calls onOpenChange when closed')
});
```

---

### **Task 5: Test UI Component - Select** [2 hours]
**File**: `frontend/src/components/ui/Select.test.tsx`

**Test Cases:**
```typescript
describe('Select Component', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ];

  // Basic rendering
  it('renders select with placeholder')
  it('renders select with options')
  it('displays selected value')

  // Interactions
  it('opens dropdown when clicked')
  it('selects option when clicked')
  it('closes dropdown after selection')
  it('filters options when typing (if searchable)')

  // States
  it('can be disabled')
  it('shows error state')

  // Callbacks
  it('calls onChange with selected value')

  // Accessibility
  it('supports keyboard navigation (Arrow keys)')
  it('selects with Enter key')
  it('closes with Escape key')
});
```

---

### **Task 6: Test API Service Layer** [3 hours]
**File**: `frontend/src/lib/api.test.ts`

**Test Cases:**
```typescript
describe('API Service', () => {
  describe('Request Interceptor', () => {
    it('adds authorization token from localStorage')
    it('sends request without token if not present')
    it('includes Content-Type: application/json')
  });

  describe('Response Interceptor', () => {
    it('returns response on success')

    // Error handling
    it('redirects to /login on 401 Unauthorized')
    it('removes token from localStorage on 401')
    it('shows toast error on 401')
    it('shows toast error on 403 Forbidden')
    it('shows toast error on 404 Not Found')
    it('shows toast error on 500 Server Error')
    it('rejects promise with error')
  });

  describe('API Methods', () => {
    it('makes GET request with correct URL')
    it('makes POST request with data')
    it('makes PUT request with data')
    it('makes DELETE request')
    it('makes PATCH request with data')
  });

  describe('Integration Scenarios', () => {
    it('handles authentication flow correctly')
    it('retries on network error (if implemented)')
    it('cancels pending requests on component unmount')
  });
});
```

**Example Implementation:**
```typescript
import api from './api';
import axios from 'axios';
import { toast } from 'react-hot-toast';

jest.mock('axios');
jest.mock('react-hot-toast');

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => localStorageMock[key]),
        setItem: jest.fn((key, value) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete localStorageMock[key];
        }),
      },
      writable: true,
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('Request Interceptor', () => {
    it('adds authorization token from localStorage', () => {
      localStorageMock['token'] = 'mock-token-123';

      const config = { headers: {} };
      const result = api.interceptors.request.handlers[0].fulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer mock-token-123');
    });
  });

  describe('Response Interceptor - 401 Error', () => {
    it('redirects to /login on 401 Unauthorized', async () => {
      const error = {
        response: { status: 401 },
      };

      try {
        await api.interceptors.response.handlers[0].rejected(error);
      } catch (e) {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(window.location.href).toBe('/login');
        expect(toast.error).toHaveBeenCalledWith('Session expired. Please login again.');
      }
    });
  });
});
```

---

### **Task 7: Test Register Page** [2 hours]
**File**: `frontend/src/app/register/page.test.tsx`

**Test Cases:**
```typescript
describe('Register Page', () => {
  // Rendering
  it('renders register form with all fields')
  it('displays application branding')
  it('has link to login page')

  // Form fields
  it('has name input field')
  it('has email input field')
  it('has password input field')
  it('has confirm password input field')
  it('has phone input field (if exists)')

  // Validation
  it('shows error for invalid email')
  it('shows error for weak password')
  it('shows error when passwords do not match')
  it('shows error for empty required fields')

  // Form submission
  it('submits form with valid data')
  it('shows loading state during submission')
  it('redirects to dashboard on success')
  it('shows error message on API failure')
  it('disables submit button when loading')

  // User interactions
  it('allows typing in all fields')
  it('toggles password visibility')
  it('navigates to login page when clicking link')
});
```

---

### **Task 8: Test Sidebar Component** [1.5 hours]
**File**: `frontend/src/components/layout/Sidebar.test.tsx`

**Test Cases:**
```typescript
describe('Sidebar Component', () => {
  // Navigation links
  it('renders all navigation items')
  it('highlights active route')
  it('navigates to correct page on click')

  // User info
  it('displays logged-in user information')
  it('shows user avatar or initials')

  // Logout
  it('has logout button')
  it('calls logout function when clicked')

  // Responsive
  it('can be collapsed/expanded')
  it('shows icons when collapsed')
  it('shows full text when expanded')

  // Accessibility
  it('has proper navigation landmark')
  it('has accessible button labels')
});
```

---

### **Task 9: Test Utils Library** [1 hour]
**File**: `frontend/src/lib/utils.test.ts`

**Test Cases:**
```typescript
describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges classNames correctly')
    it('handles conditional classNames')
    it('removes falsy values')
  });

  describe('formatCurrency (if exists)', () => {
    it('formats numbers as currency')
    it('handles decimals')
    it('handles negative numbers')
  });

  describe('formatDate (if exists)', () => {
    it('formats dates correctly')
    it('handles different date formats')
  });

  // Add tests for other utility functions
});
```

---

## Test Patterns & Examples

### **Pattern 1: Testing Forms with Validation**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientForm from './ClientForm';

describe('ClientForm - Validation', () => {
  it('shows validation errors on submit with empty fields', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<ClientForm onSubmit={onSubmit} />);

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /save|submit/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Ensure form was not submitted
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<ClientForm onSubmit={onSubmit} />);

    // Fill out form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '123-456-7890');

    // Submit form
    await user.click(screen.getByRole('button', { name: /save|submit/i }));

    // Check form was submitted with correct data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      });
    });
  });
});
```

---

### **Pattern 2: Testing API Integration**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientsPage from './page';
import api from '@/lib/api';

jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('ClientsPage - API Integration', () => {
  it('fetches and displays clients on mount', async () => {
    const mockClients = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    mockApi.get.mockResolvedValueOnce({
      data: { success: true, data: mockClients },
    });

    render(<ClientsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Verify API was called
    expect(mockApi.get).toHaveBeenCalledWith('/clients');
  });

  it('handles API errors gracefully', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));

    render(<ClientsPage />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  it('creates new client via API', async () => {
    const user = userEvent.setup();
    const newClient = { name: 'New Client', email: 'new@example.com' };

    // Mock initial GET
    mockApi.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    // Mock POST
    mockApi.post.mockResolvedValueOnce({
      data: { success: true, data: { id: '3', ...newClient } },
    });

    render(<ClientsPage />);

    // Open form
    await user.click(screen.getByRole('button', { name: /new|add/i }));

    // Fill and submit
    await user.type(screen.getByLabelText(/name/i), newClient.name);
    await user.type(screen.getByLabelText(/email/i), newClient.email);
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Verify API was called
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/clients', newClient);
    });
  });
});
```

---

### **Pattern 3: Testing Modals/Dialogs**

```typescript
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogContent, DialogTrigger } from './dialog';

describe('Dialog - Open/Close Behavior', () => {
  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    );

    // Dialog should not be visible initially
    expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();

    // Click trigger
    await user.click(screen.getByText('Open'));

    // Dialog should now be visible
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
  });

  it('closes dialog when overlay is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    );

    // Dialog should be visible
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();

    // Click overlay (outside dialog)
    const dialog = screen.getByRole('dialog');
    await user.click(dialog.parentElement!); // Click overlay

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
    });
  });

  it('closes dialog when Escape key is pressed', async () => {
    const user = userEvent.setup();

    render(
      <Dialog defaultOpen>
        <DialogContent>Dialog Content</DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Dialog Content')).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
    });
  });
});
```

---

### **Pattern 4: Testing Context/Hooks**

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '@/lib/api';

jest.mock('@/lib/api');

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('provides login function', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { data: { user: mockUser, token: 'mock-token' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('provides logout function', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

---

## Success Metrics

### **Phase 1 (Week 1) - Target Metrics**
- ✅ 21 test files (13 existing + 8 new)
- ✅ UI components coverage: 60%+
- ✅ API layer coverage: 80%+
- ✅ Test execution time: <30 seconds

### **Phase 2 (Week 2) - Target Metrics**
- ✅ 31 test files (21 + 10 new)
- ✅ Utils coverage: 80%+
- ✅ Component coverage: 65%+
- ✅ All critical user flows tested

### **Phase 3 (Week 3) - Target Metrics**
- ✅ 46+ test files (31 + 15 new)
- ✅ **Overall coverage: 70%+**
- ✅ Lines: 70%
- ✅ Branches: 65%
- ✅ Functions: 75%
- ✅ Statements: 70%

### **Quality Metrics (All Phases)**
- ✅ Zero flaky tests
- ✅ All tests pass consistently
- ✅ Tests run in <60 seconds
- ✅ No skipped/disabled tests
- ✅ Meaningful assertions (no shallow tests)

---

## Running Tests

### **Commands**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Dialog"
```

### **Coverage Report**
```bash
# Generate HTML coverage report
npm run test:coverage

# View report
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html # Windows
```

---

## Best Practices Checklist

- ✅ Use Testing Library queries in order of priority (getByRole > getByLabelText > getByPlaceholderText > getByText)
- ✅ Use `userEvent` instead of `fireEvent` for user interactions
- ✅ Use `waitFor` for async operations, not `act`
- ✅ Mock external dependencies (API, router, toast)
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names ("should..." or "it...")
- ✅ Arrange-Act-Assert pattern
- ✅ One assertion concept per test
- ✅ Avoid testing implementation details (state, methods)
- ✅ Test accessibility (ARIA attributes, keyboard navigation)

---

## Next Steps

1. **Review this plan** with team
2. **Set up CI/CD** to run tests on every PR
3. **Start with Phase 1** high-priority tasks
4. **Track progress** using the checklist
5. **Update documentation** as patterns emerge
6. **Celebrate milestones** 🎉

---

## Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Test Coverage Guide](https://istanbul.js.org/)

---

**Last Updated**: 2025-01-07
**Status**: Ready for implementation
**Owner**: QA/Dev Team
