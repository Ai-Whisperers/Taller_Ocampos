# Testing Documentation
Doc-Type: Technical Guide · Version: 1.0 · Updated: 2025-11-12 · Author: Claude + Gestalt
Doc-Ratio: Toon 40% / Human 60%

## Purpose

This document describes the testing strategy, infrastructure, and patterns for the Taller Ocampos frontend application. It provides guidance for writing effective tests and maintaining high code quality.

---

## Testing Infrastructure

### Core Technologies

- **Jest 30.2.0** – Test runner with enhanced performance
- **Testing Library** – React component testing utilities
- **Mock Service Worker (MSW) 2.12.1** – API mocking (opt-in pattern)
- **jest-axe 10.0.0** – Accessibility testing (WCAG 2.1 AA)
- **@faker-js/faker 10.1.0** – Test data generation
- **Playwright 1.56.1** – End-to-end testing

### Test Organization

```
frontend/
├── src/
│   ├── lib/
│   │   ├── utils.test.ts              # Unit tests
│   │   └── api.test.ts                # API client tests
│   ├── contexts/
│   │   └── AuthContext.test.tsx       # Context tests
│   ├── components/
│   │   └── ui/
│   │       ├── Button.test.tsx        # Component tests
│   │       ├── Input.test.tsx
│   │       └── Dialog.test.tsx
│   └── app/
│       └── dashboard/
│           ├── billing/
│           │   └── page.test.tsx      # Page tests
│           └── clients/
│               └── __tests__/
│                   └── client-vehicle-integration.test.tsx  # Integration tests
└── tests/
    ├── fixtures/                      # Test data factories
    │   ├── clientFactory.ts
    │   ├── vehicleFactory.ts
    │   ├── invoiceFactory.ts
    │   └── index.ts
    ├── mocks/                         # MSW handlers
    │   ├── handlers.ts
    │   ├── server.ts
    │   └── browser.ts
    └── utils/                         # Test utilities
        ├── test-utils.tsx
        ├── form-helpers.ts
        ├── assertion-helpers.ts
        └── accessibility-helpers.ts
```

---

## Test Data Factories

### Overview

Factories generate consistent, realistic test data with Paraguayan context.

### Usage Example

```typescript
import { createClient, createVehicle, createInvoice } from '../../../tests/fixtures';

describe('Client Management', () => {
  it('should display client information', () => {
    const client = createClient({
      name: 'Carlos Mendoza',
      ruc: '80012345-1',
      phone: '0981123456',
    });

    expect(client.address).toContain('Asunción');
  });

  it('should create invoice with Paraguayan currency', () => {
    const invoice = createInvoice({
      total: 1000000, // 1 million guaraníes
      iva: 90909, // 10% IVA
    });

    expect(invoice.subtotal).toBe(909091);
  });
});
```

### Available Factories

- **clientFactory** – Paraguayan clients with RUC validation
- **vehicleFactory** – Vehicles with Paraguayan plates (ABC-1234)
- **workOrderFactory** – Work orders with status transitions
- **invoiceFactory** – Invoices with IVA (10%) calculations
- **paymentFactory** – Payment records with Paraguayan methods
- **inventoryFactory** – Inventory items with Guaraní pricing
- **userFactory** – User accounts with roles

### Factory Overrides

```typescript
// Use default Paraguayan context
const client = createClient();

// Override specific fields
const customClient = createClient({
  name: 'María García',
  email: 'maria@custom.com',
  city: 'Ciudad del Este', // Override default Asunción
});
```

---

## Test Utilities

### Custom Render Function

```typescript
import { render } from '../../../tests/utils/test-utils';

// Automatically wraps components with necessary providers
const { getByRole } = render(<MyComponent />);
```

### Form Helpers

```typescript
import { fillForm, submitForm } from '../../../tests/utils/form-helpers';

it('should submit client form', async () => {
  const { getByRole } = render(<ClientForm />);

  await fillForm(getByRole('form'), {
    name: 'Carlos Mendoza',
    ruc: '80012345-1',
  });

  await submitForm(getByRole('button', { name: /guardar/i }));
});
```

### Assertion Helpers

```typescript
import { expectLoadingState, expectErrorState } from '../../../tests/utils/assertion-helpers';

it('should show loading state', async () => {
  render(<ClientList />);
  expectLoadingState(screen.getByTestId('client-list'));
});
```

### Accessibility Helpers

```typescript
import { expectNoA11yViolations, expectKeyboardAccessible } from '../../../tests/utils/accessibility-helpers';

it('should be accessible', async () => {
  const { container } = render(<Button>Click me</Button>);
  await expectNoA11yViolations(container);

  const button = screen.getByRole('button');
  expectKeyboardAccessible(button);
});
```

---

## Mock Service Worker (MSW)

### Opt-In Pattern

MSW is **not globally enabled** to avoid polyfill complexity. Enable per test:

```typescript
import { server } from '../../../tests/mocks/server';
import { http, HttpResponse } from 'msw';

describe('API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should fetch clients from API', async () => {
    server.use(
      http.get('/api/clients', () => {
        return HttpResponse.json({
          success: true,
          data: [createClient(), createClient()],
        });
      })
    );

    render(<ClientList />);

    await waitFor(() => {
      expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 clients
    });
  });
});
```

### Available Handlers

All API endpoints are pre-configured in `tests/mocks/handlers.ts`:

- `/api/auth/*` – Authentication endpoints
- `/api/clients/*` – Client management
- `/api/vehicles/*` – Vehicle management
- `/api/work-orders/*` – Work orders
- `/api/invoices/*` – Invoicing
- `/api/payments/*` – Payment processing
- `/api/inventory/*` – Inventory management

---

## Testing Patterns

### Unit Tests

Test individual functions in isolation:

```typescript
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats Paraguayan Guaraníes correctly', () => {
    expect(formatCurrency(1000000)).toBe('₲ 1.000.000');
  });

  it('handles zero correctly', () => {
    expect(formatCurrency(0)).toBe('₲ 0');
  });
});
```

### Component Tests

Test UI components with user interactions:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('handles button click', async () => {
  const user = userEvent.setup();
  const handleClick = jest.fn();

  render(<Button onClick={handleClick}>Click me</Button>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Integration Tests

Test complete workflows across multiple components:

```typescript
describe('Client-Vehicle Workflow', () => {
  it('should create client and add vehicles', async () => {
    // Step 1: Create client
    const client = await createClientViaUI();

    // Step 2: Navigate to client details
    await navigateToClient(client.id);

    // Step 3: Add vehicle
    const vehicle = await addVehicleViaUI(client.id);

    // Step 4: Verify relationship
    expect(screen.getByText(vehicle.plate)).toBeInTheDocument();
    expect(screen.getByText(client.name)).toBeInTheDocument();
  });
});
```

### Accessibility Tests

Ensure WCAG 2.1 AA compliance:

```typescript
import { expectNoA11yViolations } from '../../../tests/utils/accessibility-helpers';

it('should have no accessibility violations', async () => {
  const { container } = render(
    <label htmlFor="name">
      Name
      <Input id="name" />
    </label>
  );

  await expectNoA11yViolations(container);
});
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- src/lib/utils.test.ts

# Run E2E tests
npm run test:e2e
```

### Coverage Thresholds

```typescript
// jest.config.js
coverageThreshold: {
  global: {
    lines: 80,
    branches: 75,
    functions: 80,
    statements: 80,
  },
}
```

---

## Best Practices

### DO

✓ Use factories for test data generation
✓ Write descriptive test names (it('should...'))
✓ Test user-facing behavior, not implementation
✓ Use accessibility helpers for all UI tests
✓ Mock API calls to avoid network dependencies
✓ Clean up after tests (clear mocks, timers)
✓ Use `waitFor` for asynchronous operations
✓ Test error states and edge cases

### DON'T

✗ Don't test internal component state
✗ Don't write tests that depend on execution order
✗ Don't mock too much (test real behavior)
✗ Don't skip accessibility testing
✗ Don't hardcode test data (use factories)
✗ Don't test implementation details
✗ Don't forget to test keyboard navigation

---

## Common Issues & Solutions

### Issue: Faker ES Module Errors

**Problem**: `Cannot use import statement outside a module`

**Solution**: Use inline mock data instead of factories in problematic tests:

```typescript
// Instead of:
const invoice = createInvoice();

// Use:
const invoice = {
  id: '1',
  invoiceNumber: 'INV-001',
  total: 1000000,
  // ... rest of fields
};
```

### Issue: Act Warnings

**Problem**: `Warning: An update to Component inside a test was not wrapped in act(...)`

**Solution**: Use `waitFor` for state updates:

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Issue: Multiple Elements Found

**Problem**: `Found multiple elements with the text`

**Solution**: Be more specific with queries:

```typescript
// Instead of:
screen.getByText('Submit');

// Use:
within(screen.getByRole('form')).getByRole('button', { name: /submit/i });
```

---

## Test Statistics

Current test coverage (as of 2025-11-12):

```
test_coverage:
  total_test_files: 20
  total_tests: 413
  passing_tests: 343
  pass_rate: 83_percent
  test_infrastructure:
    factories: 1683_lines
    mocks: 490_lines
    helpers: 708_lines
    accessibility: 28_tests
  components_tested:
    - Button: 16_tests (100% passing)
    - Input: 41_tests (100% passing)
    - Dialog: 44_tests (95% passing)
    - utils: 50_tests (100% passing)
    - Billing_page: 35_tests (66% passing)
```

---

## Contributing

### Adding New Tests

1. Create test file next to source file: `component.test.tsx`
2. Import necessary test utilities
3. Write descriptive test cases
4. Run tests: `npm test`
5. Verify coverage: `npm run test:coverage`
6. Commit with message: `Test: Add tests for [feature]`

### Updating Factories

1. Edit factory file in `tests/fixtures/`
2. Maintain Paraguayan context (RUC, addresses, currency)
3. Update type definitions
4. Run all tests to verify changes

### Modifying MSW Handlers

1. Edit `tests/mocks/handlers.ts`
2. Follow REST API conventions
3. Return realistic response structures
4. Test with multiple components

---

## Resources

- [Testing Library Docs](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [MSW Documentation](https://mswjs.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Faker.js Guide](https://fakerjs.dev/guide/)
