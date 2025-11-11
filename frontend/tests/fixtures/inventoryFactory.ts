/**
 * Inventory (Parts) Test Data Factory
 * Generates realistic inventory/parts data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export interface InventoryPart {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  cost: number;
  salePrice: number;
  margin?: number;
  supplier: string;
  supplierCode?: string;
  location: string;
  isLowStock?: boolean;
  lastRestockDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Filtros',
  'Aceites',
  'Frenos',
  'Suspensión',
  'Motor',
  'Transmisión',
  'Eléctrico',
  'Neumáticos',
  'Batería',
  'Escape',
  'Refrigeración',
  'Iluminación',
];

const BRANDS = [
  'Bosch',
  'NGK',
  'Denso',
  'Continental',
  'Mobil',
  'Castrol',
  'Shell',
  'Brembo',
  'Monroe',
  'Mann',
  'AC Delco',
  'Fram',
];

const SUPPLIERS = [
  'Autopartes del Este',
  'Importadora Central',
  'Distribuidora Nacional',
  'Repuestos Globales',
  'Autoservicios SA',
  'Comercial Automotriz',
];

const LOCATIONS = [
  'Estante A1',
  'Estante A2',
  'Estante B1',
  'Estante B2',
  'Depósito Principal',
  'Área de Recepción',
  'Zona de Picking',
];

/**
 * Generates a part code in various formats
 */
function generatePartCode(): string {
  const formats = [
    () => faker.helpers.fromRegExp(/[A-Z]{2}[0-9]{4}/), // AB1234
    () => faker.helpers.fromRegExp(/[A-Z]{3}-[0-9]{3}/), // ABC-123
    () => faker.helpers.fromRegExp(/[0-9]{3}[A-Z]{2}[0-9]{3}/), // 123AB456
  ];
  return faker.helpers.arrayElement(formats)();
}

/**
 * Generates part name based on category
 */
function generatePartName(category: string): string {
  const namesByCategory: Record<string, string[]> = {
    Filtros: ['Filtro de Aceite', 'Filtro de Aire', 'Filtro de Combustible', 'Filtro de Cabina'],
    Aceites: ['Aceite de Motor 5W-30', 'Aceite de Motor 10W-40', 'Aceite de Transmisión', 'Aceite Hidráulico'],
    Frenos: ['Pastillas de Freno', 'Discos de Freno', 'Líquido de Frenos', 'Tambores de Freno'],
    Suspensión: ['Amortiguador Delantero', 'Amortiguador Trasero', 'Resorte de Suspensión', 'Bujes de Suspensión'],
    Motor: ['Bujía', 'Correa de Distribución', 'Junta de Culata', 'Pistón', 'Válvula'],
    Transmisión: ['Kit de Embrague', 'Rodamiento', 'Aceite de Caja', 'Sincronizador'],
    Eléctrico: ['Alternador', 'Motor de Arranque', 'Batería', 'Cables de Bujía', 'Sensor'],
    Neumáticos: ['Neumático 175/70 R13', 'Neumático 195/65 R15', 'Neumático 205/55 R16'],
    Batería: ['Batería 12V 45Ah', 'Batería 12V 60Ah', 'Batería 12V 75Ah'],
    Escape: ['Silenciador', 'Tubo de Escape', 'Catalizador', 'Junta de Escape'],
    Refrigeración: ['Radiador', 'Termostato', 'Ventilador', 'Líquido Refrigerante'],
    Iluminación: ['Faro Delantero', 'Faro Trasero', 'Bombilla H4', 'Bombilla LED'],
  };

  const names = namesByCategory[category] || ['Repuesto Genérico'];
  return faker.helpers.arrayElement(names);
}

/**
 * Creates a single inventory part with realistic test data
 */
export function createInventoryPart(overrides?: Partial<InventoryPart>): InventoryPart {
  const category = overrides?.category ?? faker.helpers.arrayElement(CATEGORIES);
  const name = overrides?.name ?? generatePartName(category);
  const cost = faker.number.int({ min: 10000, max: 500000 });
  const markupPercent = faker.number.float({ min: 1.2, max: 2.5 });
  const salePrice = Math.round(cost * markupPercent);
  const stock = faker.number.int({ min: 0, max: 100 });
  const minStock = faker.number.int({ min: 5, max: 20 });

  return {
    id: faker.string.uuid(),
    code: generatePartCode(),
    name,
    description: faker.helpers.maybe(() => faker.commerce.productDescription(), { probability: 0.5 }),
    category,
    brand: faker.helpers.arrayElement(BRANDS),
    stock,
    minStock,
    maxStock: faker.helpers.maybe(() => minStock * faker.number.int({ min: 5, max: 10 }), { probability: 0.6 }),
    cost,
    salePrice,
    margin: Math.round(((salePrice - cost) / cost) * 100),
    supplier: faker.helpers.arrayElement(SUPPLIERS),
    supplierCode: faker.helpers.maybe(() => faker.helpers.fromRegExp(/SUP-[0-9]{6}/), { probability: 0.7 }),
    location: faker.helpers.arrayElement(LOCATIONS),
    isLowStock: stock < minStock,
    lastRestockDate: faker.helpers.maybe(() => faker.date.recent({ days: 90 }).toISOString().split('T')[0], { probability: 0.8 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple inventory parts
 */
export function createInventoryParts(count: number, overrides?: Partial<InventoryPart>): InventoryPart[] {
  return Array.from({ length: count }, () => createInventoryPart(overrides));
}

/**
 * Creates a low-stock inventory part
 */
export function createLowStockPart(overrides?: Partial<InventoryPart>): InventoryPart {
  const minStock = faker.number.int({ min: 10, max: 20 });
  const stock = faker.number.int({ min: 0, max: minStock - 1 });

  return createInventoryPart({
    stock,
    minStock,
    isLowStock: true,
    ...overrides,
  });
}

/**
 * Creates an out-of-stock inventory part
 */
export function createOutOfStockPart(overrides?: Partial<InventoryPart>): InventoryPart {
  return createInventoryPart({
    stock: 0,
    minStock: faker.number.int({ min: 10, max: 20 }),
    isLowStock: true,
    ...overrides,
  });
}

/**
 * Creates a well-stocked inventory part
 */
export function createWellStockedPart(overrides?: Partial<InventoryPart>): InventoryPart {
  const minStock = faker.number.int({ min: 10, max: 20 });
  const stock = faker.number.int({ min: minStock * 2, max: minStock * 5 });

  return createInventoryPart({
    stock,
    minStock,
    isLowStock: false,
    ...overrides,
  });
}

/**
 * Creates a part from a specific category
 */
export function createPartByCategory(category: string, overrides?: Partial<InventoryPart>): InventoryPart {
  return createInventoryPart({
    category,
    name: generatePartName(category),
    ...overrides,
  });
}

/**
 * Creates a high-value part (expensive)
 */
export function createHighValuePart(overrides?: Partial<InventoryPart>): InventoryPart {
  const cost = faker.number.int({ min: 500000, max: 2000000 });
  const salePrice = Math.round(cost * faker.number.float({ min: 1.3, max: 1.8 }));

  return createInventoryPart({
    cost,
    salePrice,
    category: faker.helpers.arrayElement(['Motor', 'Transmisión', 'Eléctrico']),
    ...overrides,
  });
}

/**
 * Creates a low-value part (cheap)
 */
export function createLowValuePart(overrides?: Partial<InventoryPart>): InventoryPart {
  const cost = faker.number.int({ min: 5000, max: 50000 });
  const salePrice = Math.round(cost * faker.number.float({ min: 1.5, max: 2.5 }));

  return createInventoryPart({
    cost,
    salePrice,
    category: faker.helpers.arrayElement(['Filtros', 'Aceites', 'Iluminación']),
    ...overrides,
  });
}

/**
 * Creates a part needing restock (low stock + old last restock date)
 */
export function createPartNeedingRestock(overrides?: Partial<InventoryPart>): InventoryPart {
  const minStock = faker.number.int({ min: 10, max: 20 });
  const stock = faker.number.int({ min: 0, max: 5 });

  return createInventoryPart({
    stock,
    minStock,
    isLowStock: true,
    lastRestockDate: faker.date.past({ years: 0.5 }).toISOString().split('T')[0],
    ...overrides,
  });
}

/**
 * Creates parts by multiple categories
 */
export function createPartsByCategories(categoryCounts: Record<string, number>): InventoryPart[] {
  const parts: InventoryPart[] = [];

  for (const [category, count] of Object.entries(categoryCounts)) {
    for (let i = 0; i < count; i++) {
      parts.push(createPartByCategory(category));
    }
  }

  return parts;
}

/**
 * Common test inventory parts with predefined data
 */
export const testInventoryParts = {
  oilFilter: (): InventoryPart => createInventoryPart({
    code: 'FLT-001',
    name: 'Filtro de Aceite',
    category: 'Filtros',
    brand: 'Bosch',
    stock: 25,
    minStock: 10,
    cost: 25000,
    salePrice: 40000,
    location: 'Estante A1',
  }),

  brakePads: (): InventoryPart => createInventoryPart({
    code: 'BRK-045',
    name: 'Pastillas de Freno',
    category: 'Frenos',
    brand: 'Brembo',
    stock: 3,
    minStock: 10,
    cost: 120000,
    salePrice: 180000,
    isLowStock: true,
    location: 'Estante B1',
  }),

  sparkPlug: (): InventoryPart => createInventoryPart({
    code: 'MOT-023',
    name: 'Bujía',
    category: 'Motor',
    brand: 'NGK',
    stock: 50,
    minStock: 15,
    cost: 15000,
    salePrice: 25000,
    location: 'Estante A2',
  }),

  outOfStock: (): InventoryPart => createOutOfStockPart({
    code: 'SUS-078',
    name: 'Amortiguador Delantero',
    category: 'Suspensión',
    brand: 'Monroe',
    minStock: 8,
    cost: 250000,
    salePrice: 380000,
  }),
};
