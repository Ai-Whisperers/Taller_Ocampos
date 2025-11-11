/**
 * Vehicle Test Data Factory
 * Generates realistic vehicle data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export interface Vehicle {
  id: string;
  clientId: string;
  clientName?: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage?: number;
  lastService?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Common vehicle brands in Paraguay
const VEHICLE_BRANDS = [
  'Toyota', 'Nissan', 'Chevrolet', 'Ford', 'Volkswagen',
  'Hyundai', 'Kia', 'Honda', 'Mazda', 'Mitsubishi'
];

// Common models by brand
const MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ['Hilux', 'Corolla', 'Yaris', 'RAV4', 'Land Cruiser'],
  Nissan: ['Frontier', 'Versa', 'Kicks', 'March', 'X-Trail'],
  Chevrolet: ['S10', 'Onix', 'Cruze', 'Tracker', 'Montana'],
  Ford: ['Ranger', 'Focus', 'Fiesta', 'EcoSport', 'F-150'],
  Volkswagen: ['Amarok', 'Gol', 'Polo', 'Tiguan', 'Golf'],
  Hyundai: ['Tucson', 'Creta', 'HB20', 'Elantra', 'Santa Fe'],
  Kia: ['Sportage', 'Picanto', 'Rio', 'Sorento', 'Seltos'],
  Honda: ['CR-V', 'Civic', 'City', 'Fit', 'HR-V'],
  Mazda: ['CX-5', 'Mazda3', 'CX-3', 'Mazda2', 'BT-50'],
  Mitsubishi: ['L200', 'ASX', 'Outlander', 'Mirage', 'Montero'],
};

const COLORS = [
  'Blanco', 'Negro', 'Gris', 'Plateado', 'Rojo',
  'Azul', 'Verde', 'Amarillo', 'Beige', 'Marrón'
];

/**
 * Creates a single vehicle with realistic test data
 */
export function createVehicle(overrides?: Partial<Vehicle>): Vehicle {
  const brand = faker.helpers.arrayElement(VEHICLE_BRANDS);
  const model = faker.helpers.arrayElement(MODELS_BY_BRAND[brand]);
  const year = faker.date.past({ years: 20 }).getFullYear();

  return {
    id: faker.string.uuid(),
    clientId: faker.string.uuid(),
    brand,
    model,
    year,
    licensePlate: faker.helpers.fromRegExp(/[A-Z]{3}[0-9]{3,4}/), // Paraguayan format
    vin: faker.vehicle.vin(),
    color: faker.helpers.arrayElement(COLORS),
    mileage: faker.number.int({ min: 5000, max: 300000 }),
    lastService: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple vehicles
 */
export function createVehicles(count: number, overrides?: Partial<Vehicle>): Vehicle[] {
  return Array.from({ length: count }, () => createVehicle(overrides));
}

/**
 * Creates a vehicle for a specific client
 */
export function createVehicleForClient(clientId: string, clientName?: string, overrides?: Partial<Vehicle>): Vehicle {
  return createVehicle({
    clientId,
    clientName,
    ...overrides,
  });
}

/**
 * Creates a new vehicle (low mileage, recent year)
 */
export function createNewVehicle(overrides?: Partial<Vehicle>): Vehicle {
  const currentYear = new Date().getFullYear();
  return createVehicle({
    year: faker.number.int({ min: currentYear - 2, max: currentYear }),
    mileage: faker.number.int({ min: 100, max: 15000 }),
    ...overrides,
  });
}

/**
 * Creates an old vehicle (high mileage, older year)
 */
export function createOldVehicle(overrides?: Partial<Vehicle>): Vehicle {
  const currentYear = new Date().getFullYear();
  return createVehicle({
    year: faker.number.int({ min: currentYear - 25, max: currentYear - 10 }),
    mileage: faker.number.int({ min: 150000, max: 400000 }),
    ...overrides,
  });
}

/**
 * Creates a vehicle needing service (old last service date)
 */
export function createVehicleNeedingService(overrides?: Partial<Vehicle>): Vehicle {
  return createVehicle({
    lastService: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    mileage: faker.number.int({ min: 100000, max: 200000 }),
    ...overrides,
  });
}

/**
 * Common test vehicles with predefined data
 */
export const testVehicles = {
  toyotaHilux: (): Vehicle => createVehicle({
    brand: 'Toyota',
    model: 'Hilux',
    year: 2020,
    licensePlate: 'ABC1234',
    color: 'Blanco',
    mileage: 45000,
  }),

  nissanFrontier: (): Vehicle => createVehicle({
    brand: 'Nissan',
    model: 'Frontier',
    year: 2019,
    licensePlate: 'XYZ5678',
    color: 'Negro',
    mileage: 62000,
  }),

  chevroletS10: (): Vehicle => createVehicle({
    brand: 'Chevrolet',
    model: 'S10',
    year: 2021,
    licensePlate: 'DEF9012',
    color: 'Gris',
    mileage: 28000,
  }),
};
