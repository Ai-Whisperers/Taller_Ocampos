/**
 * Work Order Test Data Factory
 * Generates realistic work order data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export type WorkOrderStatus = 'draft' | 'pending' | 'in-progress' | 'ready' | 'closed';

export interface WorkOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleInfo: string;
  status: WorkOrderStatus;
  description: string;
  notes?: string;
  totalAmount: number;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  assignedTo?: string;
}

const WORK_ORDER_DESCRIPTIONS = [
  'Cambio de aceite y filtros',
  'Reparación de frenos delanteros',
  'Alineación y balanceo',
  'Cambio de batería',
  'Reparación de suspensión',
  'Cambio deneumáticos',
  'Reparación de motor',
  'Cambio de embrague',
  'Reparación de transmisión',
  'Mantenimiento preventivo completo',
  'Reparación de sistema eléctrico',
  'Cambio de correa de distribución',
  'Reparación de aire acondicionado',
  'Diagnóstico por computadora',
  'Reparación de escape',
];

/**
 * Generates a work order number in the format OT-YYYY-NNNN
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const sequence = faker.number.int({ min: 1, max: 9999 });
  return `OT-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Creates a single work order with realistic test data
 */
export function createWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  const clientFirstName = faker.person.firstName();
  const clientLastName = faker.person.lastName();
  const createdDate = faker.date.recent({ days: 30 });

  return {
    id: faker.string.uuid(),
    orderNumber: generateOrderNumber(),
    clientId: faker.string.uuid(),
    clientName: `${clientFirstName} ${clientLastName}`,
    vehicleId: faker.string.uuid(),
    vehicleInfo: `${faker.vehicle.manufacturer()} ${faker.vehicle.model()} - ${faker.helpers.fromRegExp(/[A-Z]{3}[0-9]{3,4}/)}`,
    status: faker.helpers.arrayElement(['draft', 'pending', 'in-progress', 'ready', 'closed'] as WorkOrderStatus[]),
    description: faker.helpers.arrayElement(WORK_ORDER_DESCRIPTIONS),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.6 }),
    totalAmount: faker.number.int({ min: 50000, max: 3000000 }),
    createdAt: createdDate.toISOString(),
    updatedAt: faker.date.between({ from: createdDate, to: new Date() }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple work orders
 */
export function createWorkOrders(count: number, overrides?: Partial<WorkOrder>): WorkOrder[] {
  return Array.from({ length: count }, () => createWorkOrder(overrides));
}

/**
 * Creates a work order with a specific status
 */
export function createWorkOrderWithStatus(status: WorkOrderStatus, overrides?: Partial<WorkOrder>): WorkOrder {
  const baseOrder = createWorkOrder({ status, ...overrides });

  // Add completion date if status is closed or ready
  if (status === 'closed' || status === 'ready') {
    return {
      ...baseOrder,
      actualCompletionDate: faker.date.recent({ days: 7 }).toISOString().split('T')[0],
    };
  }

  // Add estimated completion date if in progress
  if (status === 'in-progress') {
    return {
      ...baseOrder,
      estimatedCompletionDate: faker.date.soon({ days: 5 }).toISOString().split('T')[0],
    };
  }

  return baseOrder;
}

/**
 * Creates a draft work order
 */
export function createDraftWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrderWithStatus('draft', {
    totalAmount: 0,
    notes: undefined,
    ...overrides,
  });
}

/**
 * Creates a pending work order
 */
export function createPendingWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrderWithStatus('pending', overrides);
}

/**
 * Creates an in-progress work order
 */
export function createInProgressWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrderWithStatus('in-progress', {
    estimatedCompletionDate: faker.date.soon({ days: 3 }).toISOString().split('T')[0],
    ...overrides,
  });
}

/**
 * Creates a ready work order
 */
export function createReadyWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrderWithStatus('ready', {
    actualCompletionDate: faker.date.recent({ days: 2 }).toISOString().split('T')[0],
    ...overrides,
  });
}

/**
 * Creates a closed work order
 */
export function createClosedWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrderWithStatus('closed', {
    actualCompletionDate: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    ...overrides,
  });
}

/**
 * Creates a work order for a specific client and vehicle
 */
export function createWorkOrderForClientVehicle(
  clientId: string,
  clientName: string,
  vehicleId: string,
  vehicleInfo: string,
  overrides?: Partial<WorkOrder>
): WorkOrder {
  return createWorkOrder({
    clientId,
    clientName,
    vehicleId,
    vehicleInfo,
    ...overrides,
  });
}

/**
 * Creates a high-value work order (expensive repair)
 */
export function createHighValueWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrder({
    totalAmount: faker.number.int({ min: 1500000, max: 5000000 }),
    description: faker.helpers.arrayElement([
      'Reparación de motor',
      'Cambio de transmisión',
      'Reparación mayor de suspensión',
      'Overhaul completo del motor',
    ]),
    ...overrides,
  });
}

/**
 * Creates a low-value work order (simple maintenance)
 */
export function createLowValueWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return createWorkOrder({
    totalAmount: faker.number.int({ min: 50000, max: 300000 }),
    description: faker.helpers.arrayElement([
      'Cambio de aceite',
      'Cambio de filtros',
      'Rotación de neumáticos',
      'Inspección básica',
    ]),
    ...overrides,
  });
}

/**
 * Common test work orders with predefined data
 */
export const testWorkOrders = {
  draft: (): WorkOrder => createDraftWorkOrder({
    orderNumber: 'OT-2024-001',
    clientName: 'Juan Pérez',
    vehicleInfo: 'Toyota Hilux - ABC1234',
    description: 'Cambio de aceite y filtros',
    totalAmount: 0,
  }),

  inProgress: (): WorkOrder => createInProgressWorkOrder({
    orderNumber: 'OT-2024-002',
    clientName: 'María González',
    vehicleInfo: 'Nissan Frontier - XYZ5678',
    description: 'Reparación de frenos',
    totalAmount: 280000,
  }),

  ready: (): WorkOrder => createReadyWorkOrder({
    orderNumber: 'OT-2024-003',
    clientName: 'Carlos Rodríguez',
    vehicleInfo: 'Chevrolet S10 - DEF9012',
    description: 'Alineación y balanceo',
    totalAmount: 120000,
  }),

  closed: (): WorkOrder => createClosedWorkOrder({
    orderNumber: 'OT-2024-004',
    clientName: 'Ana Martínez',
    vehicleInfo: 'Ford Ranger - GHI3456',
    description: 'Cambio de batería',
    totalAmount: 450000,
  }),
};
