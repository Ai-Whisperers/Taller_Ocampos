# Testing Documentation

This document provides comprehensive information about the testing setup and practices for the Taller Mecánico project.

## Testing Stack

### Backend Testing
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP integration testing
- **ts-jest**: TypeScript support for Jest
- **@faker-js/faker**: Test data generation
- **jest-mock-extended**: Advanced mocking capabilities

### Frontend Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers
- **jest-environment-jsdom**: DOM environment for tests

### E2E Testing
- **Playwright**: End-to-end testing framework
- **Cross-browser testing**: Chrome, Firefox, Safari
- **Mobile testing**: iOS and Android viewports

## Test Structure

```
project/
├── backend/
│   ├── tests/
│   │   ├── setup.ts                    # Global test setup
│   │   ├── fixtures/
│   │   │   └── testData.ts            # Test data and mocks
│   │   ├── utils/
│   │   │   └── testHelpers.ts         # Test utilities
│   │   ├── unit/
│   │   │   └── auth.controller.test.ts # Unit tests
│   │   └── integration/
│   │       └── auth.integration.test.ts # Integration tests
│   ├── jest.config.js                 # Jest configuration
│   └── .env.test                      # Test environment variables
├── frontend/
│   ├── tests/
│   │   ├── e2e/
│   │   │   └── auth.spec.ts           # E2E tests
│   │   └── utils/
│   │       └── test-utils.tsx         # Test utilities
│   ├── src/components/ui/
│   │   └── Button.test.tsx            # Component tests
│   ├── jest.config.js                 # Jest configuration
│   ├── jest.setup.js                  # Jest setup
│   └── playwright.config.ts           # Playwright configuration
└── .github/workflows/
    └── ci.yml                         # CI/CD pipeline
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Patterns and Best Practices

### Backend Testing

#### Unit Tests
```typescript
import { AuthController } from '../../src/controllers/auth.controller';
import { testUsers, mockResponse } from '../fixtures/testData';

describe('AuthController', () => {
  let authController: AuthController;
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    authController = new AuthController();
    req = { body: {} };
    res = mockResponse();
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    // Arrange
    req.body = testUsers.newUser;

    // Act
    await authController.register(req as Request, res as Response);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.any(Object),
          token: expect.any(String),
        }),
      })
    );
  });
});
```

#### Integration Tests
```typescript
import request from 'supertest';
import app from '../../src/index';

describe('Authentication API', () => {
  it('should register and login a user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
    };

    // Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(registerResponse.status).toBe(201);
    const { token } = registerResponse.body.data;

    // Use token for authenticated request
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe(userData.email);
  });
});
```

### Frontend Testing

#### Component Tests
```typescript
import { render, screen, userEvent } from '../tests/utils/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Form Testing
```typescript
import { render, screen, userEvent } from '../tests/utils/test-utils';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should complete login flow', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

## Coverage Requirements

### Backend
- **Lines**: 80%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 80%

### Frontend
- **Lines**: 70%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 70%

## CI/CD Integration

The GitHub Actions workflow runs:

1. **Linting and Type Checking**
2. **Unit Tests** (Backend & Frontend)
3. **Integration Tests** (Backend)
4. **E2E Tests** (Full application)
5. **Build Verification**
6. **Security Audits**

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No high-severity security vulnerabilities
- Successful build compilation

## Test Data Management

### Fixtures
Use the provided test data fixtures for consistent testing:

```typescript
import { testUsers, testClients, testVehicles } from '../fixtures/testData';

// Use predefined test data
const user = testUsers.admin;
const client = testClients.client1;
```

### Faker.js
Generate dynamic test data when needed:

```typescript
import { faker } from '@faker-js/faker';

const user = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
};
```

## Mocking Strategies

### API Mocks
```typescript
import { mockFetch, mockApiResponses } from '../utils/test-utils';

beforeEach(() => {
  mockFetch(mockApiResponses.success({ id: 1, name: 'Test' }));
});
```

### Database Mocks
```typescript
// PrismaClient is automatically mocked in setup.ts
const mockUser = { id: '1', email: 'test@test.com' };
(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
```

## Debugging Tests

### Backend
```bash
# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand --no-cache

# Debug specific test
npx jest --runInBand auth.controller.test.ts
```

### Frontend
```bash
# Debug with Chrome DevTools
npm test -- --runInBand --no-cache --watchAll=false
```

### E2E
```bash
# Debug mode
npx playwright test --debug

# Headed mode
npx playwright test --headed

# UI mode
npx playwright test --ui
```

## Performance Testing

### Load Testing (Backend)
```bash
# Install k6
npm install -g k6

# Run load tests (to be implemented)
k6 run load-tests/api-load-test.js
```

### Performance Monitoring (Frontend)
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

## Continuous Improvement

1. **Review test coverage reports regularly**
2. **Update test data fixtures as models evolve**
3. **Refactor tests to reduce duplication**
4. **Add tests for new features immediately**
5. **Monitor test execution times**

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in jest.config.js
   - Check for unresolved promises

2. **Database connection errors**
   - Verify DATABASE_URL in .env.test
   - Ensure test database is running

3. **E2E tests failing**
   - Check that dev server is running
   - Verify browser installation: `npx playwright install`

4. **Mock not working**
   - Ensure mocks are cleared between tests
   - Check mock import order

For more specific issues, check the test logs and error messages for detailed information.