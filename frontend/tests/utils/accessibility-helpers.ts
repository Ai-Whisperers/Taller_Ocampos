/**
 * Accessibility Testing Helper Functions
 *
 * Utilities for testing WCAG 2.1 AA compliance using jest-axe.
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { RenderResult } from '@testing-library/react';

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

/**
 * Tests a component for accessibility violations
 *
 * Usage:
 * ```typescript
 * it('should have no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   await expectNoA11yViolations(container);
 * });
 * ```
 */
export async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

/**
 * Tests a component for accessibility violations with custom rules
 */
export async function expectNoA11yViolationsWithRules(
  container: HTMLElement,
  rules: string[]
) {
  const results = await axe(container, {
    rules: rules.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: true } }), {}),
  });
  expect(results).toHaveNoViolations();
}

/**
 * Tests that interactive elements are keyboard accessible
 */
export function expectKeyboardAccessible(element: HTMLElement) {
  // Element should be focusable (have tabIndex >= 0 or be naturally focusable)
  const isNaturallyFocusable = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
    element.tagName
  );
  const hasTabIndex = element.hasAttribute('tabindex') && parseInt(element.getAttribute('tabindex') || '-1') >= 0;

  expect(isNaturallyFocusable || hasTabIndex).toBe(true);
}

/**
 * Tests that an element has proper ARIA labels
 */
export function expectProperLabeling(element: HTMLElement) {
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
  const hasLabel = element.labels && element.labels.length > 0;

  expect(hasAriaLabel || hasAriaLabelledBy || hasLabel).toBe(true);
}

/**
 * Tests that a button has an accessible name
 */
export function expectAccessibleName(element: HTMLElement, expectedName?: string) {
  const accessibleName = element.getAttribute('aria-label') || element.textContent;

  expect(accessibleName).toBeTruthy();

  if (expectedName) {
    expect(accessibleName).toContain(expectedName);
  }
}

/**
 * Tests that form fields have associated labels
 */
export function expectFormFieldLabeled(input: HTMLInputElement) {
  const hasLabel = input.labels && input.labels.length > 0;
  const hasAriaLabel = input.hasAttribute('aria-label');
  const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
  const hasPlaceholder = input.hasAttribute('placeholder');

  // At minimum, should have a label, aria-label, or aria-labelledby (placeholder alone is not sufficient)
  expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
}

/**
 * Tests that a dialog/modal has proper ARIA attributes
 */
export function expectProperDialogAttributes(dialog: HTMLElement) {
  expect(dialog).toHaveAttribute('role', 'dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');

  // Should have either aria-label or aria-labelledby
  const hasLabel = dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby');
  expect(hasLabel).toBe(true);
}

/**
 * Tests that a live region is properly configured
 */
export function expectProperLiveRegion(element: HTMLElement, politeness: 'polite' | 'assertive' = 'polite') {
  expect(element).toHaveAttribute('aria-live', politeness);
}

/**
 * Tests color contrast (simplified check)
 * Note: This is a basic check. Use axe for comprehensive color contrast testing.
 */
export function expectSufficientContrast(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const backgroundColor = style.backgroundColor;
  const color = style.color;

  // Basic check: ensure both are set and different
  expect(backgroundColor).not.toBe('');
  expect(color).not.toBe('');
  expect(backgroundColor).not.toBe(color);
}

/**
 * Tests that headings follow proper hierarchy
 */
export function expectProperHeadingHierarchy(container: HTMLElement) {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const levels = Array.from(headings).map((h) => parseInt(h.tagName[1]));

  // Check that levels don't skip (e.g., h1 → h3 without h2)
  for (let i = 1; i < levels.length; i++) {
    const diff = levels[i] - levels[i - 1];
    expect(diff).toBeLessThanOrEqual(1);
  }
}

/**
 * Tests that landmarks are properly used
 */
export function expectProperLandmarks(container: HTMLElement) {
  // Check for main landmark
  const main = container.querySelector('main, [role="main"]');
  expect(main).toBeInTheDocument();
}

/**
 * Tests that images have alt text
 */
export function expectImagesHaveAlt(container: HTMLElement) {
  const images = container.querySelectorAll('img');

  images.forEach((img) => {
    expect(img).toHaveAttribute('alt');
  });
}

/**
 * Tests that buttons don't rely solely on color
 */
export function expectNotColorOnly(button: HTMLElement) {
  // Button should have text content or icon with aria-label
  const hasText = button.textContent && button.textContent.trim().length > 0;
  const hasAriaLabel = button.hasAttribute('aria-label');
  const hasIcon = button.querySelector('svg, i, [class*="icon"]');

  expect(hasText || (hasIcon && hasAriaLabel)).toBe(true);
}

/**
 * Full accessibility test suite for a component
 */
export async function runFullA11yTests(renderResult: RenderResult) {
  const { container } = renderResult;

  // Run axe tests
  await expectNoA11yViolations(container);

  // Check images
  expectImagesHaveAlt(container);

  // Check for proper heading hierarchy (if headings exist)
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length > 0) {
    expectProperHeadingHierarchy(container);
  }
}

/**
 * Configuration for common WCAG 2.1 AA rules
 */
export const WCAG_AA_RULES = [
  'color-contrast',
  'label',
  'button-name',
  'link-name',
  'image-alt',
  'input-image-alt',
  'aria-required-children',
  'aria-required-parent',
  'aria-roles',
  'aria-valid-attr-value',
  'aria-valid-attr',
  'duplicate-id',
  'form-field-multiple-labels',
  'frame-title',
  'heading-order',
  'html-has-lang',
  'html-lang-valid',
  'label-title-only',
  'landmark-one-main',
  'page-has-heading-one',
  'region',
  'tabindex',
];
