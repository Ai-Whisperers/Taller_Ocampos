/**
 * Custom Assertion Helper Functions
 *
 * Reusable assertions for common test scenarios.
 */

import { screen, within } from '@testing-library/react';

/**
 * Asserts that a toast notification appears with the expected message
 */
export function expectToastMessage(message: string | RegExp) {
  // Note: react-hot-toast is mocked in jest.setup.js
  // This is a placeholder for when we want to test actual toast behavior
  const toast = require('react-hot-toast').default;
  expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(message));
}

/**
 * Asserts that an error toast appears
 */
export function expectErrorToast(message?: string | RegExp) {
  const toast = require('react-hot-toast').default;

  if (message) {
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(message));
  } else {
    expect(toast.error).toHaveBeenCalled();
  }
}

/**
 * Asserts that a success toast appears
 */
export function expectSuccessToast(message?: string | RegExp) {
  const toast = require('react-hot-toast').default;

  if (message) {
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(message));
  } else {
    expect(toast.success).toHaveBeenCalled();
  }
}

/**
 * Asserts that a table has the expected number of rows
 */
export function expectTableRowCount(count: number) {
  const rows = screen.getAllByRole('row');
  // Subtract 1 for header row
  expect(rows.length - 1).toBe(count);
}

/**
 * Asserts that a table contains specific text in any cell
 */
export function expectTableContainsText(text: string | RegExp) {
  const table = screen.getByRole('table');
  expect(within(table).getByText(text)).toBeInTheDocument();
}

/**
 * Asserts that a loading indicator is visible
 */
export function expectLoadingIndicator() {
  expect(screen.getByText(/cargando|loading/i)).toBeInTheDocument();
}

/**
 * Asserts that no loading indicator is visible
 */
export function expectNoLoadingIndicator() {
  expect(screen.queryByText(/cargando|loading/i)).not.toBeInTheDocument();
}

/**
 * Asserts that an empty state message is shown
 */
export function expectEmptyState(message?: string | RegExp) {
  if (message) {
    expect(screen.getByText(message)).toBeInTheDocument();
  } else {
    expect(screen.getByText(/no.*encontr|no.*data|empty|vacío/i)).toBeInTheDocument();
  }
}

/**
 * Asserts that a modal/dialog is open
 */
export function expectDialogOpen(title?: string | RegExp) {
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();

  if (title) {
    expect(within(dialog).getByText(title)).toBeInTheDocument();
  }
}

/**
 * Asserts that a modal/dialog is closed
 */
export function expectDialogClosed() {
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
}

/**
 * Asserts that a button is disabled
 */
export function expectButtonDisabled(name: string | RegExp) {
  const button = screen.getByRole('button', { name });
  expect(button).toBeDisabled();
}

/**
 * Asserts that a button is enabled
 */
export function expectButtonEnabled(name: string | RegExp) {
  const button = screen.getByRole('button', { name });
  expect(button).toBeEnabled();
}

/**
 * Asserts that a form field has an error
 */
export function expectFieldError(fieldName: string | RegExp, errorMessage?: string | RegExp) {
  const field = screen.getByLabelText(fieldName);
  expect(field).toHaveAttribute('aria-invalid', 'true');

  if (errorMessage) {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  }
}

/**
 * Asserts that navigation occurred to a specific path
 */
export function expectNavigationTo(path: string) {
  const { useRouter } = require('next/navigation');
  const router = useRouter();
  expect(router.push).toHaveBeenCalledWith(path);
}

/**
 * Asserts that an API call was made with specific parameters
 */
export function expectFetchCalled(url: string, options?: RequestInit) {
  if (options) {
    expect(global.fetch).toHaveBeenCalledWith(url, expect.objectContaining(options));
  } else {
    expect(global.fetch).toHaveBeenCalledWith(url, expect.anything());
  }
}

/**
 * Asserts that fetch was called with POST method
 */
export function expectPostRequest(url: string, body?: any) {
  if (body) {
    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
  } else {
    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'POST',
      })
    );
  }
}

/**
 * Asserts that fetch was called with PUT method
 */
export function expectPutRequest(url: string, body?: any) {
  if (body) {
    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(body),
      })
    );
  } else {
    expect(global.fetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        method: 'PUT',
      })
    );
  }
}

/**
 * Asserts that fetch was called with DELETE method
 */
export function expectDeleteRequest(url: string) {
  expect(global.fetch).toHaveBeenCalledWith(
    url,
    expect.objectContaining({
      method: 'DELETE',
    })
  );
}

/**
 * Asserts that a status badge has the correct variant
 */
export function expectStatusBadge(status: string) {
  expect(screen.getByText(new RegExp(status, 'i'))).toBeInTheDocument();
}

/**
 * Asserts that a list contains exactly N items
 */
export function expectListItemCount(count: number) {
  const listItems = screen.getAllByRole('listitem');
  expect(listItems).toHaveLength(count);
}

/**
 * Asserts that an element has a specific CSS class
 */
export function expectElementHasClass(element: HTMLElement, className: string) {
  expect(element).toHaveClass(className);
}

/**
 * Asserts that currency is formatted correctly (Paraguayan Guaraníes)
 */
export function expectFormattedCurrency(amount: number) {
  const formatted = new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  expect(screen.getByText(new RegExp(formatted.replace(/[₲\s]/g, '.*')))).toBeInTheDocument();
}

/**
 * Asserts that a date is formatted correctly
 */
export function expectFormattedDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = dateObj.toLocaleDateString('es-ES');

  expect(screen.getByText(new RegExp(formatted))).toBeInTheDocument();
}
