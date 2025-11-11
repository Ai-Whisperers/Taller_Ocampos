/**
 * Client Test Data Factory
 * Generates realistic client data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  vehicleCount: number;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Creates a single client with realistic test data
 */
export function createClient(overrides?: Partial<Client>): Client {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const name = `${firstName} ${lastName}`;

  return {
    id: faker.string.uuid(),
    name,
    phone: faker.helpers.fromRegExp(/09[0-9]{8}/), // Paraguayan mobile format
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    address: faker.location.city(), // Paraguayan cities
    vehicleCount: faker.number.int({ min: 0, max: 5 }),
    lastVisit: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple clients
 */
export function createClients(count: number, overrides?: Partial<Client>): Client[] {
  return Array.from({ length: count }, () => createClient(overrides));
}

/**
 * Creates a client with no vehicles
 */
export function createClientWithoutVehicles(overrides?: Partial<Client>): Client {
  return createClient({
    vehicleCount: 0,
    lastVisit: undefined,
    ...overrides,
  });
}

/**
 * Creates a client with multiple vehicles
 */
export function createClientWithMultipleVehicles(overrides?: Partial<Client>): Client {
  return createClient({
    vehicleCount: faker.number.int({ min: 2, max: 5 }),
    ...overrides,
  });
}

/**
 * Creates a client with recent activity
 */
export function createRecentClient(overrides?: Partial<Client>): Client {
  return createClient({
    lastVisit: faker.date.recent({ days: 7 }).toISOString().split('T')[0],
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  });
}

/**
 * Creates a client without email (optional field)
 */
export function createClientWithoutEmail(overrides?: Partial<Client>): Client {
  return createClient({
    email: undefined,
    ...overrides,
  });
}

/**
 * Common test clients with predefined names for consistent testing
 */
export const testClients = {
  juan: (): Client => createClient({
    name: 'Juan Pérez',
    phone: '0981234567',
    email: 'juan@test.com',
    address: 'Asunción',
    vehicleCount: 2,
  }),

  maria: (): Client => createClient({
    name: 'María González',
    phone: '0987654321',
    email: 'maria@test.com',
    address: 'Luque',
    vehicleCount: 1,
  }),

  carlos: (): Client => createClient({
    name: 'Carlos Rodríguez',
    phone: '0983456789',
    email: 'carlos@test.com',
    address: 'San Lorenzo',
    vehicleCount: 3,
  }),
};
