/**
 * Payment Test Data Factory
 * Generates realistic payment data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Cheque' | 'QR';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  paymentNumber?: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate: string;
  reference?: string;
  notes?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque', 'QR'];

/**
 * Generates a payment number in the format PAG-YYYY-NNNN
 */
function generatePaymentNumber(): string {
  const year = new Date().getFullYear();
  const sequence = faker.number.int({ min: 1, max: 9999 });
  return `PAG-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Generates a payment reference based on the method
 */
function generateReference(method: PaymentMethod): string | undefined {
  switch (method) {
    case 'Transferencia':
      return `TRANS-${faker.finance.accountNumber(10)}`;
    case 'Tarjeta':
      return `****-${faker.finance.accountNumber(4)}`;
    case 'Cheque':
      return `CHQ-${faker.finance.accountNumber(8)}`;
    case 'QR':
      return `QR-${faker.string.alphanumeric(12).toUpperCase()}`;
    default:
      return undefined;
  }
}

/**
 * Creates a single payment with realistic test data
 */
export function createPayment(overrides?: Partial<Payment>): Payment {
  const clientFirstName = faker.person.firstName();
  const clientLastName = faker.person.lastName();
  const paymentDate = faker.date.recent({ days: 60 });
  const method = overrides?.method ?? faker.helpers.arrayElement(PAYMENT_METHODS);

  return {
    id: faker.string.uuid(),
    paymentNumber: generatePaymentNumber(),
    invoiceId: faker.string.uuid(),
    invoiceNumber: `FAC-${new Date().getFullYear()}-${String(faker.number.int({ min: 1, max: 9999 })).padStart(4, '0')}`,
    clientId: faker.string.uuid(),
    clientName: `${clientFirstName} ${clientLastName}`,
    amount: faker.number.int({ min: 50000, max: 3000000 }),
    method,
    status: 'completed',
    paymentDate: paymentDate.toISOString().split('T')[0],
    reference: generateReference(method),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    processedBy: faker.person.fullName(),
    createdAt: paymentDate.toISOString(),
    updatedAt: paymentDate.toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple payments
 */
export function createPayments(count: number, overrides?: Partial<Payment>): Payment[] {
  return Array.from({ length: count }, () => createPayment(overrides));
}

/**
 * Creates a payment with a specific method
 */
export function createPaymentWithMethod(method: PaymentMethod, overrides?: Partial<Payment>): Payment {
  return createPayment({
    method,
    reference: generateReference(method),
    ...overrides,
  });
}

/**
 * Creates a cash payment
 */
export function createCashPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithMethod('Efectivo', {
    reference: undefined,
    ...overrides,
  });
}

/**
 * Creates a card payment
 */
export function createCardPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithMethod('Tarjeta', overrides);
}

/**
 * Creates a transfer payment
 */
export function createTransferPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithMethod('Transferencia', overrides);
}

/**
 * Creates a check payment
 */
export function createCheckPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithMethod('Cheque', overrides);
}

/**
 * Creates a QR payment
 */
export function createQRPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithMethod('QR', overrides);
}

/**
 * Creates a payment for a specific invoice
 */
export function createPaymentForInvoice(
  invoiceId: string,
  invoiceNumber: string,
  amount: number,
  overrides?: Partial<Payment>
): Payment {
  return createPayment({
    invoiceId,
    invoiceNumber,
    amount,
    ...overrides,
  });
}

/**
 * Creates a partial payment (less than invoice total)
 */
export function createPartialPayment(invoiceTotal: number, overrides?: Partial<Payment>): Payment {
  const partialAmount = Math.floor(invoiceTotal * faker.number.float({ min: 0.3, max: 0.8 }));
  return createPayment({
    amount: partialAmount,
    notes: `Pago parcial - Resto pendiente: ${invoiceTotal - partialAmount}`,
    ...overrides,
  });
}

/**
 * Creates a full payment
 */
export function createFullPayment(invoiceTotal: number, overrides?: Partial<Payment>): Payment {
  return createPayment({
    amount: invoiceTotal,
    ...overrides,
  });
}

/**
 * Creates a payment with a specific status
 */
export function createPaymentWithStatus(status: PaymentStatus, overrides?: Partial<Payment>): Payment {
  const payment = createPayment({ status, ...overrides });

  if (status === 'failed') {
    return {
      ...payment,
      notes: faker.helpers.arrayElement([
        'Pago rechazado - fondos insuficientes',
        'Pago rechazado - error de procesamiento',
        'Pago rechazado - tarjeta vencida',
      ]),
    };
  }

  if (status === 'refunded') {
    return {
      ...payment,
      notes: `Reembolso procesado - ${faker.lorem.sentence()}`,
    };
  }

  return payment;
}

/**
 * Creates a pending payment
 */
export function createPendingPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithStatus('pending', {
    reference: undefined,
    ...overrides,
  });
}

/**
 * Creates a failed payment
 */
export function createFailedPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithStatus('failed', overrides);
}

/**
 * Creates a refunded payment
 */
export function createRefundedPayment(overrides?: Partial<Payment>): Payment {
  return createPaymentWithStatus('refunded', overrides);
}

/**
 * Creates a recent payment (last 7 days)
 */
export function createRecentPayment(overrides?: Partial<Payment>): Payment {
  const paymentDate = faker.date.recent({ days: 7 });
  return createPayment({
    paymentDate: paymentDate.toISOString().split('T')[0],
    createdAt: paymentDate.toISOString(),
    updatedAt: paymentDate.toISOString(),
    ...overrides,
  });
}

/**
 * Creates a large payment (high amount)
 */
export function createLargePayment(overrides?: Partial<Payment>): Payment {
  return createPayment({
    amount: faker.number.int({ min: 2000000, max: 10000000 }),
    method: faker.helpers.arrayElement(['Transferencia', 'Cheque']), // Large payments typically not cash
    ...overrides,
  });
}

/**
 * Common test payments with predefined data
 */
export const testPayments = {
  cash: (): Payment => createCashPayment({
    paymentNumber: 'PAG-2024-001',
    clientName: 'Juan Pérez',
    invoiceNumber: 'FAC-2024-001',
    amount: 275000,
    paymentDate: new Date().toISOString().split('T')[0],
  }),

  card: (): Payment => createCardPayment({
    paymentNumber: 'PAG-2024-002',
    clientName: 'María González',
    invoiceNumber: 'FAC-2024-002',
    amount: 495000,
    reference: '****-4532',
    paymentDate: new Date().toISOString().split('T')[0],
  }),

  transfer: (): Payment => createTransferPayment({
    paymentNumber: 'PAG-2024-003',
    clientName: 'Carlos Rodríguez',
    invoiceNumber: 'FAC-2024-003',
    amount: 850000,
    reference: 'TRANS-1234567890',
    paymentDate: new Date().toISOString().split('T')[0],
  }),
};
