/**
 * Test Data Factories - Central Export
 *
 * This module exports all test data factories for easy importing in tests.
 *
 * Usage:
 * ```typescript
 * import { createClient, createVehicle, testClients } from '@/tests/fixtures';
 *
 * const client = createClient({ name: 'Custom Name' });
 * const testClient = testClients.juan();
 * ```
 */

// Client Factory
export * from './clientFactory';
export type { Client } from './clientFactory';

// Vehicle Factory
export * from './vehicleFactory';
export type { Vehicle } from './vehicleFactory';

// Work Order Factory
export * from './workOrderFactory';
export type { WorkOrder, WorkOrderStatus } from './workOrderFactory';

// Invoice Factory
export * from './invoiceFactory';
export type { Invoice, InvoiceStatus, InvoiceItem } from './invoiceFactory';

// Payment Factory
export * from './paymentFactory';
export type { Payment, PaymentMethod, PaymentStatus } from './paymentFactory';

// Inventory Factory
export * from './inventoryFactory';
export type { InventoryPart } from './inventoryFactory';

// User/Auth Factory
export * from './userFactory';
export type {
  User,
  UserRole,
  AuthResponse,
  RegistrationData,
  LoginCredentials
} from './userFactory';
