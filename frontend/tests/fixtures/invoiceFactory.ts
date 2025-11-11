/**
 * Invoice Test Data Factory
 * Generates realistic invoice data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  workOrderId?: string;
  workOrderNumber?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  status: InvoiceStatus;
  items?: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  amount: number; // Alias for total (used in some components)
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const TAX_RATE = 0.1; // 10% IVA in Paraguay

/**
 * Generates an invoice number in the format FAC-YYYY-NNNN
 */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const sequence = faker.number.int({ min: 1, max: 9999 });
  return `FAC-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Creates a single invoice item
 */
export function createInvoiceItem(overrides?: Partial<InvoiceItem>): InvoiceItem {
  const quantity = faker.number.int({ min: 1, max: 10 });
  const unitPrice = faker.number.int({ min: 10000, max: 500000 });

  return {
    id: faker.string.uuid(),
    description: faker.commerce.productName(),
    quantity,
    unitPrice,
    total: quantity * unitPrice,
    ...overrides,
  };
}

/**
 * Creates multiple invoice items
 */
export function createInvoiceItems(count: number, overrides?: Partial<InvoiceItem>): InvoiceItem[] {
  return Array.from({ length: count }, () => createInvoiceItem(overrides));
}

/**
 * Calculates invoice totals from items
 */
function calculateInvoiceTotals(items?: InvoiceItem[], providedSubtotal?: number) {
  const subtotal = providedSubtotal ?? (items ? items.reduce((sum, item) => sum + item.total, 0) : faker.number.int({ min: 100000, max: 2000000 }));
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  return { subtotal, tax, total };
}

/**
 * Creates a single invoice with realistic test data
 */
export function createInvoice(overrides?: Partial<Invoice>): Invoice {
  const clientFirstName = faker.person.firstName();
  const clientLastName = faker.person.lastName();
  const issueDate = faker.date.recent({ days: 30 });
  const dueDate = faker.date.soon({ days: 30, refDate: issueDate });

  const items = overrides?.items ?? createInvoiceItems(faker.number.int({ min: 1, max: 5 }));
  const { subtotal, tax, total } = calculateInvoiceTotals(items, overrides?.subtotal);

  const status: InvoiceStatus = overrides?.status ?? faker.helpers.arrayElement(['paid', 'pending', 'overdue'] as InvoiceStatus[]);

  return {
    id: faker.string.uuid(),
    invoiceNumber: generateInvoiceNumber(),
    workOrderId: faker.string.uuid(),
    workOrderNumber: `OT-${new Date().getFullYear()}-${String(faker.number.int({ min: 1, max: 9999 })).padStart(4, '0')}`,
    clientId: faker.string.uuid(),
    clientName: `${clientFirstName} ${clientLastName}`,
    clientEmail: faker.internet.email({ firstName: clientFirstName, lastName: clientLastName }).toLowerCase(),
    clientPhone: faker.helpers.fromRegExp(/09[0-9]{8}/),
    status,
    items,
    subtotal,
    tax,
    taxRate: TAX_RATE,
    total,
    amount: total, // Alias
    issueDate: issueDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    paymentDate: status === 'paid' ? faker.date.between({ from: issueDate, to: dueDate }).toISOString().split('T')[0] : undefined,
    paymentMethod: status === 'paid' ? faker.helpers.arrayElement(['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque']) : undefined,
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }),
    createdAt: issueDate.toISOString(),
    updatedAt: faker.date.between({ from: issueDate, to: new Date() }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple invoices
 */
export function createInvoices(count: number, overrides?: Partial<Invoice>): Invoice[] {
  return Array.from({ length: count }, () => createInvoice(overrides));
}

/**
 * Creates an invoice with a specific status
 */
export function createInvoiceWithStatus(status: InvoiceStatus, overrides?: Partial<Invoice>): Invoice {
  const invoice = createInvoice({ status, ...overrides });

  if (status === 'paid') {
    return {
      ...invoice,
      paymentDate: faker.date.recent({ days: 15 }).toISOString().split('T')[0],
      paymentMethod: faker.helpers.arrayElement(['Efectivo', 'Tarjeta', 'Transferencia']),
    };
  }

  if (status === 'overdue') {
    return {
      ...invoice,
      dueDate: faker.date.past({ years: 0.1 }).toISOString().split('T')[0],
      paymentDate: undefined,
      paymentMethod: undefined,
    };
  }

  return {
    ...invoice,
    paymentDate: undefined,
    paymentMethod: undefined,
  };
}

/**
 * Creates a paid invoice
 */
export function createPaidInvoice(overrides?: Partial<Invoice>): Invoice {
  return createInvoiceWithStatus('paid', overrides);
}

/**
 * Creates a pending invoice
 */
export function createPendingInvoice(overrides?: Partial<Invoice>): Invoice {
  return createInvoiceWithStatus('pending', overrides);
}

/**
 * Creates an overdue invoice
 */
export function createOverdueInvoice(overrides?: Partial<Invoice>): Invoice {
  return createInvoiceWithStatus('overdue', overrides);
}

/**
 * Creates an invoice for a specific work order
 */
export function createInvoiceForWorkOrder(
  workOrderId: string,
  workOrderNumber: string,
  overrides?: Partial<Invoice>
): Invoice {
  return createInvoice({
    workOrderId,
    workOrderNumber,
    ...overrides,
  });
}

/**
 * Creates a high-value invoice
 */
export function createHighValueInvoice(overrides?: Partial<Invoice>): Invoice {
  const items = createInvoiceItems(faker.number.int({ min: 3, max: 8 }));
  const subtotal = faker.number.int({ min: 2000000, max: 8000000 });
  const { tax, total } = calculateInvoiceTotals(items, subtotal);

  return createInvoice({
    items,
    subtotal,
    tax,
    total,
    amount: total,
    ...overrides,
  });
}

/**
 * Creates a low-value invoice
 */
export function createLowValueInvoice(overrides?: Partial<Invoice>): Invoice {
  const items = createInvoiceItems(faker.number.int({ min: 1, max: 3 }));
  const subtotal = faker.number.int({ min: 50000, max: 300000 });
  const { tax, total } = calculateInvoiceTotals(items, subtotal);

  return createInvoice({
    items,
    subtotal,
    tax,
    total,
    amount: total,
    ...overrides,
  });
}

/**
 * Common test invoices with predefined data
 */
export const testInvoices = {
  paid: (): Invoice => createPaidInvoice({
    invoiceNumber: 'FAC-2024-001',
    clientName: 'Juan Pérez',
    workOrderNumber: 'OT-2024-001',
    subtotal: 250000,
    tax: 25000,
    total: 275000,
    amount: 275000,
    paymentMethod: 'Efectivo',
  }),

  pending: (): Invoice => createPendingInvoice({
    invoiceNumber: 'FAC-2024-002',
    clientName: 'María González',
    workOrderNumber: 'OT-2024-002',
    subtotal: 450000,
    tax: 45000,
    total: 495000,
    amount: 495000,
  }),

  overdue: (): Invoice => createOverdueInvoice({
    invoiceNumber: 'FAC-2024-003',
    clientName: 'Carlos Rodríguez',
    workOrderNumber: 'OT-2024-003',
    subtotal: 180000,
    tax: 18000,
    total: 198000,
    amount: 198000,
    dueDate: '2024-01-15',
  }),
};
