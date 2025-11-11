/**
 * Form Testing Helper Functions
 *
 * Utilities for filling and interacting with forms in tests.
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Fills a client form with test data
 */
export async function fillClientForm(data: {
  name: string;
  phone: string;
  email?: string;
  address: string;
}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/nombre/i), data.name);
  await user.type(screen.getByLabelText(/teléfono/i), data.phone);

  if (data.email) {
    const emailInput = screen.queryByLabelText(/email/i);
    if (emailInput) {
      await user.type(emailInput, data.email);
    }
  }

  await user.type(screen.getByLabelText(/dirección/i), data.address);
}

/**
 * Fills a vehicle form with test data
 */
export async function fillVehicleForm(data: {
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  color?: string;
}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/marca/i), data.brand);
  await user.type(screen.getByLabelText(/modelo/i), data.model);
  await user.type(screen.getByLabelText(/año/i), data.year);
  await user.type(screen.getByLabelText(/patente|matrícula|placa/i), data.licensePlate);

  if (data.color) {
    const colorInput = screen.queryByLabelText(/color/i);
    if (colorInput) {
      await user.type(colorInput, data.color);
    }
  }
}

/**
 * Fills a work order form with test data
 */
export async function fillWorkOrderForm(data: {
  description: string;
  amount?: string;
  notes?: string;
}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/descripción/i), data.description);

  if (data.amount) {
    const amountInput = screen.queryByLabelText(/monto|importe|precio/i);
    if (amountInput) {
      await user.type(amountInput, data.amount);
    }
  }

  if (data.notes) {
    const notesInput = screen.queryByLabelText(/notas|observaciones/i);
    if (notesInput) {
      await user.type(notesInput, data.notes);
    }
  }
}

/**
 * Fills an inventory part form with test data
 */
export async function fillInventoryForm(data: {
  code: string;
  name: string;
  category: string;
  brand: string;
  stock: string;
  minStock: string;
  cost: string;
  salePrice: string;
  supplier: string;
  location: string;
}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/código/i), data.code);
  await user.type(screen.getByLabelText(/nombre/i), data.name);
  await user.type(screen.getByLabelText(/categoría/i), data.category);
  await user.type(screen.getByLabelText(/marca/i), data.brand);
  await user.type(screen.getByLabelText(/stock/i), data.stock);
  await user.type(screen.getByLabelText(/stock mínimo/i), data.minStock);
  await user.type(screen.getByLabelText(/costo/i), data.cost);
  await user.type(screen.getByLabelText(/precio.*venta/i), data.salePrice);
  await user.type(screen.getByLabelText(/proveedor/i), data.supplier);
  await user.type(screen.getByLabelText(/ubicación/i), data.location);
}

/**
 * Fills a payment form with test data
 */
export async function fillPaymentForm(data: {
  amount: string;
  method: string;
  reference?: string;
  notes?: string;
}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/monto|importe/i), data.amount);
  await user.selectOptions(screen.getByLabelText(/método/i), data.method);

  if (data.reference) {
    const referenceInput = screen.queryByLabelText(/referencia/i);
    if (referenceInput) {
      await user.type(referenceInput, data.reference);
    }
  }

  if (data.notes) {
    const notesInput = screen.queryByLabelText(/notas/i);
    if (notesInput) {
      await user.type(notesInput, data.notes);
    }
  }
}

/**
 * Fills login form with credentials
 */
export async function fillLoginForm(email: string, password: string) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/email|correo/i), email);
  await user.type(screen.getByLabelText(/contraseña|password/i), password);
}

/**
 * Fills registration form with user data
 */
export async function fillRegistrationForm(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
}) {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/nombre/i), data.name);
  await user.type(screen.getByLabelText(/email|correo/i), data.email);
  await user.type(screen.getByLabelText(/^contraseña|^password/i), data.password);

  if (data.confirmPassword) {
    await user.type(
      screen.getByLabelText(/confirmar.*contraseña|confirm.*password/i),
      data.confirmPassword
    );
  }

  if (data.phone) {
    const phoneInput = screen.queryByLabelText(/teléfono/i);
    if (phoneInput) {
      await user.type(phoneInput, data.phone);
    }
  }
}

/**
 * Submits a form by clicking the submit button
 */
export async function submitForm(buttonText: string | RegExp = /guardar|save|submit|enviar/i) {
  const user = userEvent.setup();
  const submitButton = screen.getByRole('button', { name: buttonText });
  await user.click(submitButton);
}

/**
 * Cancels a form by clicking the cancel button
 */
export async function cancelForm(buttonText: string | RegExp = /cancelar|cancel/i) {
  const user = userEvent.setup();
  const cancelButton = screen.getByRole('button', { name: buttonText });
  await user.click(cancelButton);
}

/**
 * Clears all form inputs
 */
export async function clearForm(container: HTMLElement) {
  const user = userEvent.setup();
  const inputs = container.querySelectorAll<HTMLInputElement>('input, textarea');

  for (const input of Array.from(inputs)) {
    if (input.type !== 'hidden' && input.type !== 'submit') {
      await user.clear(input);
    }
  }
}

/**
 * Checks if form has validation errors
 */
export function hasValidationErrors(container: HTMLElement): boolean {
  const errors = container.querySelectorAll('[role="alert"], .error, .text-red-500');
  return errors.length > 0;
}

/**
 * Gets all validation error messages
 */
export function getValidationErrors(container: HTMLElement): string[] {
  const errors = container.querySelectorAll('[role="alert"], .error, .text-red-500');
  return Array.from(errors).map((error) => error.textContent || '');
}
