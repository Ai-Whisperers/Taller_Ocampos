# Quality Gates Configuration
Doc-Type: Technical Guide · Version: 1.0 · Updated: 2025-11-12 · Author: Claude + Gestalt
Doc-Ratio: Toon 45% / Human 55%

## Purpose

This document defines the quality gates, coverage thresholds, and CI/CD pipeline configuration for the Taller Ocampos frontend application. It ensures consistent code quality, prevents regressions, and maintains high test coverage.

---

## Coverage Thresholds

### Current Configuration (jest.config.js)

```javascript
coverageThreshold: {
  global: {
    branches: 75,      // 75% branch coverage required
    functions: 80,     // 80% function coverage required
    lines: 80,         // 80% line coverage required
    statements: 80,    // 80% statement coverage required
  },
}
```

### Rationale

- **Branches (75%)**: Ensures most conditional logic paths are tested
- **Functions (80%)**: Verifies majority of functions have test coverage
- **Lines (80%)**: Guarantees most code is executed during tests
- **Statements (80%)**: Confirms high coverage of executable statements

### Progressive Enhancement

As test coverage improves, thresholds will increase:

```toon
coverage_roadmap:
  current_phase:
    branches: 75_percent
    functions: 80_percent
    lines: 80_percent
    statements: 80_percent

  target_phase_q2_2025:
    branches: 80_percent
    functions: 85_percent
    lines: 85_percent
    statements: 85_percent

  excellence_phase_q3_2025:
    branches: 85_percent
    functions: 90_percent
    lines: 90_percent
    statements: 90_percent
```

---

## Quality Gates Layers

### Layer 1: Local Development (Pre-commit)

**Trigger**: Before each commit
**Duration**: ~30 seconds
**Command**: `npm run pre-commit`

**Checks**:
1. ✓ TypeScript type checking (`tsc --noEmit`)
2. ✓ ESLint validation (`npm run lint`)
3. ✓ Unit tests for changed files (`npm run test:unit`)

**Purpose**: Catch basic errors immediately, before they enter the codebase.

### Layer 2: Quality Validation (Pre-push)

**Trigger**: Before pushing to remote
**Duration**: ~2 minutes
**Command**: `npm run quality-gate`

**Checks**:
1. ✓ TypeScript type checking
2. ✓ ESLint validation
3. ✓ Full test suite with coverage (`npm run test:coverage`)
4. ✓ Coverage thresholds validation
5. ✓ Build verification (`npm run build`)

**Purpose**: Comprehensive validation before code review.

### Layer 3: Continuous Integration (GitHub Actions)

**Trigger**: On push/PR to main/develop
**Duration**: ~5-8 minutes
**Workflow**: `.github/workflows/ci.yml`

**Jobs**:

#### Frontend Tests Job
1. Install dependencies (`npm ci`)
2. Run linting (`npm run lint`)
3. Run type checking (`npm run type-check`)
4. Run tests with coverage (`npm run test:ci`)
5. Upload coverage artifacts

#### E2E Tests Job
1. Setup backend + frontend
2. Install Playwright browsers
3. Run end-to-end tests (`npm run test:e2e`)
4. Upload test reports

#### Build Check Job
1. Verify production build succeeds
2. Ensure no build-time errors

#### Security Scan Job
1. Run npm audit for vulnerabilities
2. Report high-severity issues

---

## Test Execution Strategies

### Test Categories

```toon
test_categories:
  unit_tests:
    pattern: "*.test.{ts,tsx}"
    exclude: "integration|e2e"
    purpose: "Test individual functions/components in isolation"
    speed: "fast (<1s per test)"

  integration_tests:
    pattern: "*integration.test.{ts,tsx}"
    purpose: "Test workflows across multiple components/modules"
    speed: "medium (1-5s per test)"

  e2e_tests:
    location: "tests/e2e/**/*.spec.ts"
    purpose: "Test complete user flows in browser"
    speed: "slow (10-30s per test)"
```

### Test Commands

```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run for CI (optimized for parallel execution)
npm run test:ci

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui

# Watch mode for development
npm run test:watch
```

---

## Coverage Reporting

### Report Formats

```toon
coverage_outputs:
  text:
    output: "terminal"
    purpose: "Quick overview during test run"

  lcov:
    output: "coverage/lcov-report/index.html"
    purpose: "Detailed HTML report for browsers"

  json-summary:
    output: "coverage/coverage-summary.json"
    purpose: "Machine-readable for CI/CD"

  html:
    output: "coverage/index.html"
    purpose: "Interactive coverage explorer"
```

### Viewing Coverage

```bash
# Generate and open coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Exclusions

The following files are excluded from coverage (jest.config.js):

```toon
excluded_patterns:
  - "**/*.d.ts"                    # TypeScript definitions
  - "**/*.stories.{js,jsx,ts,tsx}" # Storybook stories
  - "src/app/**/_*.{js,jsx,ts,tsx}" # Next.js private files
  - "src/app/**/layout.*"          # Next.js layouts
  - "src/app/**/page.*"            # Next.js pages (tested via E2E)
  - "src/app/**/loading.*"         # Loading components
  - "src/app/**/error.*"           # Error boundaries
  - "src/app/**/not-found.*"       # 404 pages
```

---

## Continuous Integration Pipeline

### Workflow Overview

```toon
ci_pipeline:
  trigger:
    events: [push, pull_request]
    branches: [main, develop]

  parallel_jobs:
    - backend_tests:
        steps: [install, lint, type_check, test, upload_coverage]
        duration: ~3_minutes

    - frontend_tests:
        steps: [install, lint, type_check, test, upload_coverage]
        duration: ~2_minutes

    - security_scan:
        steps: [audit_backend, audit_frontend]
        duration: ~1_minute

  sequential_jobs:
    - e2e_tests:
        depends_on: [backend_tests, frontend_tests]
        steps: [setup_db, start_backend, install_browsers, run_tests]
        duration: ~5_minutes

    - build_check:
        depends_on: [backend_tests, frontend_tests]
        steps: [build_backend, build_frontend]
        duration: ~3_minutes

    - docker_build:
        depends_on: [build_check]
        condition: "branch == main"
        steps: [build_backend_image, build_frontend_image]
        duration: ~4_minutes
```

### Pipeline Stages

#### Stage 1: Validation (Parallel)
- **Backend Tests**: Lint + Type Check + Unit Tests + Coverage
- **Frontend Tests**: Lint + Type Check + Unit Tests + Coverage
- **Security Scan**: Dependency vulnerabilities check

#### Stage 2: Integration (Sequential)
- **E2E Tests**: Full application testing with Playwright
- **Build Check**: Production build verification

#### Stage 3: Deployment Prep (Conditional)
- **Docker Build**: Container images (main branch only)

### Failure Handling

```toon
failure_policy:
  lint_failure:
    action: "block_commit"
    message: "Fix linting errors with: npm run lint:fix"

  type_check_failure:
    action: "block_commit"
    message: "Fix TypeScript errors before committing"

  test_failure:
    action: "block_merge"
    message: "All tests must pass before merging PR"

  coverage_failure:
    action: "block_merge"
    message: "Coverage below threshold. Add more tests."

  build_failure:
    action: "block_deployment"
    message: "Production build must succeed"

  security_high:
    action: "warn"
    message: "High-severity vulnerabilities detected"
```

---

## Quality Metrics Dashboard

### Key Metrics Tracked

```toon
quality_metrics:
  test_coverage:
    current: 80_percent
    target: 90_percent
    trend: "increasing"

  test_count:
    total: 413
    passing: 343
    pass_rate: 83_percent

  build_success_rate:
    last_30_days: 95_percent
    target: 98_percent

  average_ci_duration:
    current: 8_minutes
    target: 6_minutes

  pr_merge_time:
    current: 24_hours
    target: 12_hours
```

### Monitoring

- **GitHub Actions**: Pipeline status and history
- **Coverage Reports**: Generated on each CI run
- **Test Reports**: Playwright HTML reports for E2E tests
- **Artifacts**: Stored for 30 days in GitHub Actions

---

## Best Practices

### Writing Tests

1. **Follow AAA Pattern**:
   - **Arrange**: Setup test data and mocks
   - **Act**: Execute the code under test
   - **Assert**: Verify expected outcomes

2. **Test Behavior, Not Implementation**:
   ```typescript
   // Good: Tests user-facing behavior
   it('should display error when email is invalid', async () => {
     await user.type(emailInput, 'invalid-email');
     await user.click(submitButton);
     expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
   });

   // Bad: Tests implementation details
   it('should call validateEmail function', () => {
     expect(validateEmail).toHaveBeenCalled();
   });
   ```

3. **Use Test Factories**:
   ```typescript
   import { createClient, createInvoice } from '../../../tests/fixtures';

   const client = createClient({ name: 'Carlos Mendoza' });
   const invoice = createInvoice({ total: 1000000 });
   ```

4. **Mock External Dependencies**:
   ```typescript
   jest.mock('@/lib/api');
   jest.mock('react-hot-toast');
   ```

### Maintaining Coverage

1. **Write tests for new features** before implementing (TDD)
2. **Add tests when fixing bugs** to prevent regressions
3. **Review coverage reports** after each test run
4. **Focus on critical paths** first (authentication, payments, data integrity)
5. **Don't test trivial code** (simple getters, constants)

### CI/CD Optimization

1. **Use `npm ci`** instead of `npm install` in CI (faster, deterministic)
2. **Cache dependencies** between runs (already configured)
3. **Run tests in parallel** (`--maxWorkers=2` in CI)
4. **Skip E2E tests** on draft PRs (`if: github.event.pull_request.draft == false`)
5. **Use matrix builds** for multiple Node versions (if needed)

---

## Troubleshooting

### Coverage Threshold Failures

**Problem**: Coverage drops below threshold

**Solutions**:
1. Run `npm run test:coverage` locally
2. Open `coverage/lcov-report/index.html`
3. Identify untested files (red/yellow)
4. Add tests for uncovered lines
5. Verify with `npm run test:coverage` again

### CI Pipeline Failures

**Problem**: Tests pass locally but fail in CI

**Common causes**:
1. **Missing environment variables**: Check `.github/workflows/ci.yml`
2. **Timing issues**: Add `waitFor()` for async operations
3. **Port conflicts**: Ensure unique ports for services
4. **Cache issues**: Clear GitHub Actions cache

**Debug steps**:
```bash
# Run tests exactly as CI does
npm ci
npm run test:ci
npm run build
```

### E2E Test Flakiness

**Problem**: E2E tests fail intermittently

**Solutions**:
1. Add explicit waits: `await page.waitForSelector(...)`
2. Increase timeouts: `test.setTimeout(30000)`
3. Use `waitFor()` for async state changes
4. Avoid hard-coded delays: `await page.waitForTimeout(500)` → `await waitFor(...)`
5. Run in serial mode: `test.describe.configure({ mode: 'serial' })`

---

## Contributing

### Adding New Quality Gates

1. Update `jest.config.js` for coverage rules
2. Add npm script to `package.json`
3. Update `.github/workflows/ci.yml` for CI integration
4. Document changes in this file
5. Notify team in PR description

### Proposing Threshold Changes

1. Run coverage report: `npm run test:coverage`
2. Calculate current coverage percentages
3. Propose new thresholds (max +5% increase)
4. Create PR with justification
5. Get team approval before merging

---

## Resources

- [Jest Configuration](./jest.config.js)
- [Package Scripts](./package.json)
- [CI/CD Workflow](../.github/workflows/ci.yml)
- [Testing Documentation](./TESTING.md)
- [Git Hooks Setup](./.git-hooks-setup.md)

---

## Summary

**Quality Gates protect code quality through layered validation:**

1. **Local (Pre-commit)**: Fast checks before commit
2. **Pre-push**: Full validation before code review
3. **CI/CD**: Comprehensive testing and build verification

**Current Coverage Targets**: 75% branches, 80% functions/lines/statements
**Test Count**: 413 tests (83% passing)
**Pipeline Duration**: ~8 minutes average

**Next Steps**:
- Increase passing test rate to 95%+
- Reduce CI duration to <6 minutes
- Implement automated performance benchmarks
- Add visual regression testing with Percy/Chromatic
