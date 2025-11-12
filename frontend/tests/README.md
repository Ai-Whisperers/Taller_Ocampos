# Test Organization

This directory contains all centralized tests for the Taller Ocampos frontend application.

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
├── fixtures/               # Test data factories
├── integration/            # Integration tests
├── mocks/                  # Mock Service Worker (MSW) handlers
├── utils/                  # Test utilities and helpers
└── README.md              # This file
```

## Test Categories

### E2E Tests (`tests/e2e/`)

End-to-end tests that run in a real browser using Playwright. These test complete user workflows from login to data manipulation.

**Files:**
- `api-contract.spec.ts` - API contract validation
- `critical-path-smoke.spec.ts` - Fast smoke tests (< 5 min)
- `enhanced-scenarios.spec.ts` - Complex workflow scenarios
- `auth.spec.ts` - Authentication flows
- `client-management.spec.ts` - Client CRUD operations
- `inventory.spec.ts` - Inventory management
- `invoice-payment.spec.ts` - Invoice and payment flows
- `work-order.spec.ts` - Work order lifecycle

**Run with:**
```bash
npm run test:e2e
npm run test:e2e:ui        # With Playwright UI
npm run test:e2e:headed    # With visible browser
```

### Integration Tests (`tests/integration/`)

Integration tests that verify multi-component workflows and data flow across the application. These use mocked APIs to test component integration without requiring a live backend.

**Files:**
- `client-vehicle-integration.test.tsx` - Client-vehicle relationship workflows
- `clients-page-integration.test.tsx` - Clients page complete integration
- `dashboard-overview-integration.test.tsx` - Dashboard metrics and real-time updates
- `inventory-workorder-integration.test.tsx` - Inventory reservation and deduction
- `invoice-payment-integration.test.tsx` - Invoice generation and payment processing
- `work-order-lifecycle-integration.test.tsx` - Work order status transitions

**Run with:**
```bash
npm run test:integration
```

### Test Fixtures (`tests/fixtures/`)

Factory functions that generate consistent, realistic test data with Paraguayan business context.

**Available Factories:**
- `clientFactory.ts` - Client data with RUC validation
- `vehicleFactory.ts` - Vehicles with Paraguayan plates (ABC-1234)
- `workOrderFactory.ts` - Work orders with status transitions
- `invoiceFactory.ts` - Invoices with IVA (10%) calculations
- `paymentFactory.ts` - Payment records
- `inventoryFactory.ts` - Inventory items with Guaraní pricing
- `userFactory.ts` - User accounts with roles

**Usage:**
```typescript
import { createClient, createVehicle, createInvoice } from '../../../tests/fixtures';

const client = createClient({ name: 'Carlos Mendoza' });
const invoice = createInvoice({ total: 1000000 });
```

### Mock Service Worker (`tests/mocks/`)

MSW handlers for mocking API requests in tests. Uses opt-in pattern to avoid global polyfill complexity.

**Files:**
- `handlers.ts` - All API endpoint handlers
- `server.ts` - MSW server for Node (Jest)
- `browser.ts` - MSW browser setup (if needed)

**Usage:**
```typescript
import { server } from '../../../tests/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('should fetch data', async () => {
  server.use(
    http.get('/api/clients', () => {
      return HttpResponse.json({
        success: true,
        data: [createClient()],
      });
    })
  );
  // ... test code
});
```

### Test Utilities (`tests/utils/`)

Reusable test helpers and custom render functions.

**Files:**
- `test-utils.tsx` - Custom render with providers
- `form-helpers.ts` - Form filling and submission utilities
- `assertion-helpers.ts` - Common assertions (loading, error states)
- `accessibility-helpers.ts` - WCAG 2.1 AA compliance testing

**Usage:**
```typescript
import { render } from '../../../tests/utils/test-utils';
import { fillForm, submitForm } from '../../../tests/utils/form-helpers';
import { expectNoA11yViolations } from '../../../tests/utils/accessibility-helpers';

const { getByRole } = render(<MyComponent />);
await fillForm(getByRole('form'), { name: 'Test' });
await expectNoA11yViolations(container);
```

## Unit and Component Tests

Unit tests and component tests remain co-located with their source files for easier discovery:

- `src/lib/*.test.ts` - Unit tests for utilities and API clients
- `src/components/ui/*.test.tsx` - Component tests for UI elements
- `src/contexts/*.test.tsx` - Context provider tests
- `src/app/**/page.test.tsx` - Page component tests (not integration)

**Rationale:** Co-location makes it easier to find and update tests when modifying the source code. Integration tests are centralized because they test workflows across multiple files.

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
testMatch: [
  '**/__tests__/**/*.{js,jsx,ts,tsx}',     // All files in __tests__ dirs
  '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',  // All .test.* and .spec.* files
  '!**/tests/e2e/**',                       // Exclude E2E (use Playwright)
  '!**/tests-examples/**',                  // Exclude examples
  '!**/tests/*.spec.ts',                    // Exclude root-level specs
],
```

This configuration:
- ✓ Picks up all `.test.tsx` files in `tests/integration/`
- ✓ Picks up all `.test.tsx` files in `src/` (co-located tests)
- ✗ Excludes `.spec.ts` files in `tests/e2e/` (run with Playwright)

### Coverage Thresholds

```javascript
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## Running Tests

```bash
# All Jest tests (unit + component + integration)
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Only unit tests
npm run test:unit

# Only integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# CI optimized
npm run test:ci
```

## Best Practices

### DO

✓ Use test factories for data generation
✓ Keep integration tests in `tests/integration/`
✓ Keep unit/component tests co-located with source
✓ Use MSW for API mocking
✓ Test user-facing behavior, not implementation
✓ Write descriptive test names
✓ Clean up after tests (mocks, timers)

### DON'T

✗ Put integration tests in `src/` directories
✗ Create `__tests__` folders in `src/app/` (use `tests/integration/`)
✗ Test implementation details
✗ Skip accessibility testing
✗ Hardcode test data (use factories)
✗ Leave tests failing without fixing

## Documentation

- `TESTING.md` - Comprehensive testing guide
- `QUALITY_GATES.md` - CI/CD quality gates configuration
- `.git-hooks-setup.md` - Pre-commit hooks setup

## Contributing

When adding new tests:

1. **Integration tests** → `tests/integration/[feature]-integration.test.tsx`
2. **E2E tests** → `tests/e2e/[feature].spec.ts`
3. **Unit tests** → Co-locate with source: `src/[path]/[file].test.ts`
4. **Component tests** → Co-locate: `src/components/[component].test.tsx`

Update this README when adding new test categories or major changes to test organization.
