import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export const testUsers = {
  admin: {
    id: faker.string.uuid(),
    email: 'admin@test.com',
    password: 'Admin123!',
    hashedPassword: bcrypt.hashSync('Admin123!', 10),
    name: 'Admin User',
    role: 'ADMIN' as const,
    phone: faker.phone.number(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  staff: {
    id: faker.string.uuid(),
    email: 'staff@test.com',
    password: 'Staff123!',
    hashedPassword: bcrypt.hashSync('Staff123!', 10),
    name: 'Staff User',
    role: 'STAFF' as const,
    phone: faker.phone.number(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const testClients = {
  client1: {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    document: faker.string.alphanumeric(10),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  client2: {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    document: faker.string.alphanumeric(10),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const testVehicles = {
  vehicle1: {
    id: faker.string.uuid(),
    clientId: testClients.client1.id,
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: faker.vehicle.vrm(),
    vin: faker.vehicle.vin(),
    color: faker.vehicle.color(),
    mileage: faker.number.int({ min: 1000, max: 100000 }),
    fuelType: 'GASOLINE',
    transmissionType: 'AUTOMATIC',
    engineSize: '2.5L',
    notes: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  vehicle2: {
    id: faker.string.uuid(),
    clientId: testClients.client2.id,
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    licensePlate: faker.vehicle.vrm(),
    vin: faker.vehicle.vin(),
    color: faker.vehicle.color(),
    mileage: faker.number.int({ min: 1000, max: 50000 }),
    fuelType: 'GASOLINE',
    transmissionType: 'MANUAL',
    engineSize: '1.8L',
    notes: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const testWorkOrders = {
  workOrder1: {
    id: faker.string.uuid(),
    vehicleId: testVehicles.vehicle1.id,
    clientId: testClients.client1.id,
    status: 'IN_PROGRESS' as const,
    title: 'Oil Change and Tire Rotation',
    description: faker.lorem.paragraph(),
    estimatedCost: faker.number.float({ min: 100, max: 500, fractionDigits: 2 }),
    actualCost: null,
    estimatedCompletionDate: faker.date.future(),
    completedAt: null,
    assignedToId: testUsers.staff.id,
    notes: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  workOrder2: {
    id: faker.string.uuid(),
    vehicleId: testVehicles.vehicle2.id,
    clientId: testClients.client2.id,
    status: 'PENDING_APPROVAL' as const,
    title: 'Brake Inspection',
    description: faker.lorem.paragraph(),
    estimatedCost: faker.number.float({ min: 200, max: 800, fractionDigits: 2 }),
    actualCost: null,
    estimatedCompletionDate: faker.date.future(),
    completedAt: null,
    assignedToId: testUsers.staff.id,
    notes: faker.lorem.sentence(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const testParts = {
  part1: {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(8).toUpperCase(),
    name: 'Engine Oil Filter',
    description: 'Premium quality oil filter',
    category: 'Filters',
    brand: 'BOSCH',
    unitPrice: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
    sellingPrice: faker.number.float({ min: 15, max: 75, fractionDigits: 2 }),
    quantity: faker.number.int({ min: 10, max: 100 }),
    minimumStock: 5,
    location: 'A1-B2',
    supplierId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  part2: {
    id: faker.string.uuid(),
    code: faker.string.alphanumeric(8).toUpperCase(),
    name: 'Brake Pad Set',
    description: 'Front brake pads',
    category: 'Brakes',
    brand: 'BREMBO',
    unitPrice: faker.number.float({ min: 30, max: 100, fractionDigits: 2 }),
    sellingPrice: faker.number.float({ min: 50, max: 150, fractionDigits: 2 }),
    quantity: faker.number.int({ min: 5, max: 50 }),
    minimumStock: 3,
    location: 'C3-D4',
    supplierId: faker.string.uuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

export const generateAuthToken = (userId: string, role: string = 'ADMIN'): string => {
  // This is a mock token for testing
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
    JSON.stringify({ id: userId, role, email: 'test@test.com' })
  ).toString('base64')}.test_signature`;
};

export const mockRequest = {
  headers: {},
  body: {},
  params: {},
  query: {},
  user: null,
};

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();