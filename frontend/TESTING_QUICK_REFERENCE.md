# Frontend Testing - Quick Reference Guide
## Taller-Ocampos Project

> **Quick Links**: [Action Plan](../FRONTEND_TEST_ACTION_PLAN.md) | [Jest Config](jest.config.js) | [Test Utils](tests/utils/test-utils.tsx)

---

## Commands Cheat Sheet

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific file
npm test -- Input.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="validation"

# Update snapshots
npm test -- -u

# Run tests for changed files only
npm test -- --onlyChanged

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

---

## Test File Structure

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

// Mock external dependencies
jest.mock('@/lib/api');
jest.mock('next/navigation');

describe('ComponentName', () => {
  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Group 1', () => {
    it('should do something specific', async () => {
      // Arrange: Set up test data and mocks
      const mockData = { id: 1, name: 'Test' };

      // Act: Render component and perform actions
      render(<ComponentName data={mockData} />);

      // Assert: Verify expected behavior
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Feature Group 2', () => {
    it('should handle user interactions', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(<ComponentName onClick={handleClick} />);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

---

## Testing Library Queries (Priority Order)

### 1. ✅ **Accessible to Everyone** (Use These First!)

```typescript
// By Role (BEST - most accessible)
screen.getByRole('button', { name: /submit/i })
screen.getByRole('textbox', { name: /username/i })
screen.getByRole('heading', { level: 1 })

// By Label Text (great for forms)
screen.getByLabelText(/email address/i)
screen.getByLabelText('Password')

// By Placeholder
screen.getByPlaceholderText('Enter your name')

// By Text Content
screen.getByText(/welcome back/i)
screen.getByText('Sign in')
```

### 2. ⚠️ **Semantic Queries** (Use When Needed)

```typescript
// By Alt Text (for images)
screen.getByAltText('Profile picture')

// By Title
screen.getByTitle('Close')

// By Display Value (for form inputs with values)
screen.getByDisplayValue('John Doe')
```

### 3. ❌ **Last Resort** (Avoid If Possible)

```typescript
// By Test ID (only when nothing else works)
screen.getByTestId('custom-element')

// By Class Name (implementation detail - DON'T USE)
// By querySelector (implementation detail - DON'T USE)
```

---

## Common Query Variants

```typescript
// Single element (throws error if not found)
getBy...()
queryBy...()  // Returns null if not found (for asserting non-existence)
findBy...()   // Returns promise (for async elements)

// Multiple elements
getAllBy...()
queryAllBy...()
findAllBy...()

// Examples:
screen.getByRole('button')           // Must exist
screen.queryByRole('button')         // May not exist
screen.findByRole('button')          // Will appear (async)
screen.getAllByRole('button')        // Multiple buttons
```

---

## User Event API (Simulate Real User Actions)

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Click
await user.click(element);
await user.dblClick(element);
await user.tripleClick(element);

// Type
await user.type(input, 'Hello World');
await user.type(input, 'fast', { delay: 1 }); // Fast typing
await user.clear(input);

// Keyboard
await user.keyboard('{Enter}');
await user.keyboard('{Escape}');
await user.keyboard('{Tab}');
await user.keyboard('{Shift>}A{/Shift}'); // Shift+A

// Select
await user.selectOptions(select, 'value');
await user.selectOptions(select, ['value1', 'value2']);

// Upload
await user.upload(input, file);

// Hover
await user.hover(element);
await user.unhover(element);

// Tab navigation
await user.tab();        // Next element
await user.tab({ shift: true }); // Previous element

// Copy/Paste
await user.copy();
await user.paste();
```

---

## Assertions Cheat Sheet

### DOM Assertions

```typescript
import { expect } from '@testing-library/react';

// Presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeEmptyDOMElement();

// Text content
expect(element).toHaveTextContent('Hello');
expect(element).toHaveTextContent(/hello/i);

// Attributes
expect(element).toHaveAttribute('type', 'text');
expect(element).toHaveClass('active');
expect(element).toHaveStyle({ color: 'red' });

// Form elements
expect(input).toHaveValue('John');
expect(input).toHaveDisplayValue('John');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();
expect(input).toBeRequired();
expect(input).toBeInvalid();
expect(input).toHaveFocus();

// Accessibility
expect(element).toHaveAccessibleName('Submit');
expect(element).toHaveAccessibleDescription('Submit the form');
```

### Jest Matchers

```typescript
// Basic
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3.5);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3, 5); // floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', value);
expect(object).toMatchObject({ key: 'value' });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledTimes(2);
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenLastCalledWith(arg1);
expect(fn).toHaveReturned();
expect(fn).toHaveReturnedWith(value);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Any matching
expect(value).toEqual(expect.any(Number));
expect(value).toEqual(expect.anything());
expect(string).toEqual(expect.stringContaining('substring'));
expect(string).toEqual(expect.stringMatching(/regex/));
```

---

## Async Testing

### Using waitFor

```typescript
import { waitFor } from '@testing-library/react';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});

// Custom timeout
await waitFor(
  () => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  },
  { timeout: 3000 }
);

// Custom interval
await waitFor(
  () => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  },
  { interval: 100 }
);
```

### Using findBy (Preferred for Async)

```typescript
// findBy automatically waits (combines getBy + waitFor)
const element = await screen.findByText('Loaded');
expect(element).toBeInTheDocument();

// With timeout
const element = await screen.findByText('Loaded', {}, { timeout: 5000 });
```

---

## Mocking Patterns

### Mock API Calls

```typescript
import api from '@/lib/api';

jest.mock('@/lib/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('Component with API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data on mount', async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { success: true, data: [{ id: 1 }] },
    });

    render(<Component />);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/endpoint');
    });

    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });

  it('handles API errors', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('Network error'));

    render(<Component />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Mock Next.js Router

```typescript
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/current-path',
    query: {},
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => new URLSearchParams(),
}));

it('navigates on button click', async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.click(screen.getByRole('button', { name: /next/i }));

  expect(mockPush).toHaveBeenCalledWith('/next-page');
});
```

### Mock Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

it('shows success toast', async () => {
  render(<Component />);

  await user.click(screen.getByRole('button'));

  expect(toast.success).toHaveBeenCalledWith('Operation successful');
});
```

### Mock localStorage

```typescript
let localStorageMock: Record<string, string> = {};

beforeEach(() => {
  localStorageMock = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => localStorageMock[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        localStorageMock = {};
      }),
    },
    writable: true,
  });
});

it('saves to localStorage', () => {
  render(<Component />);

  // Trigger action that saves to localStorage

  expect(window.localStorage.setItem).toHaveBeenCalledWith('key', 'value');
  expect(localStorageMock['key']).toBe('value');
});
```

---

## Testing Forms

```typescript
describe('Form Component', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<Form onSubmit={onSubmit} />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Check for validation errors
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<Form onSubmit={onSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify submission
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<Form onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Check loading state
    expect(screen.getByRole('button', { name: /loading|submitting/i })).toBeDisabled();

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
    });
  });
});
```

---

## Testing Accessibility

```typescript
describe('Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<Component />);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAccessibleName('Submit Form');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Component />);

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await user.keyboard('{Enter}');
    // Verify action triggered
  });

  it('has proper focus management', async () => {
    const user = userEvent.setup();
    render(<Dialog />);

    // Open dialog
    await user.click(screen.getByRole('button', { name: /open/i }));

    // Focus should be trapped in dialog
    const dialog = screen.getByRole('dialog');
    expect(document.activeElement).toBeInTheDocument();

    // Close dialog
    await user.keyboard('{Escape}');

    // Focus should return to trigger
    expect(screen.getByRole('button', { name: /open/i })).toHaveFocus();
  });
});
```

---

## Common Pitfalls & Solutions

### ❌ Don't: Query Implementation Details

```typescript
// Bad - testing implementation
const { container } = render(<Button />);
const button = container.querySelector('.btn-primary');

// Good - testing behavior
const button = screen.getByRole('button', { name: /submit/i });
```

### ❌ Don't: Use act() Directly

```typescript
// Bad - manual act()
act(() => {
  render(<Component />);
});

// Good - Testing Library handles this
render(<Component />);
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### ❌ Don't: Sleep/Wait with Timeouts

```typescript
// Bad - arbitrary timeout
await new Promise((resolve) => setTimeout(resolve, 1000));

// Good - wait for specific condition
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### ❌ Don't: Test Multiple Things in One Test

```typescript
// Bad - testing too much
it('handles form submission', async () => {
  // ... renders form
  // ... validates fields
  // ... shows loading state
  // ... makes API call
  // ... redirects
  // ... shows success message
});

// Good - separate concerns
it('validates form fields on submit')
it('shows loading state during submission')
it('calls API with form data')
it('redirects after successful submission')
it('shows success message')
```

---

## Debugging Tests

```typescript
// Print component HTML
const { debug } = render(<Component />);
debug(); // Prints entire DOM
debug(screen.getByRole('button')); // Prints specific element

// Show available queries
screen.logTestingPlaygroundURL(); // Opens testing playground

// Pause test execution
await screen.findByText('Loading', {}, { timeout: 10000 });

// Use screen.getBy... to see available elements
// This will show what elements exist if query fails
screen.getByRole('nonexistent'); // Shows all roles available
```

---

## Test Coverage Goals

| Category | Target | Priority |
|----------|--------|----------|
| Lines | 70% | High |
| Branches | 65% | High |
| Functions | 75% | Medium |
| Statements | 70% | High |

---

## Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Query Priority](https://testing-library.com/docs/queries/about#priority)
- [User Event API](https://testing-library.com/docs/user-event/intro)

---

**Last Updated**: 2025-01-07
