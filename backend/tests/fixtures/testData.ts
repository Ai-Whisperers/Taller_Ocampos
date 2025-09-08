import { User, Shop, Client, Vehicle, WorkOrder, PartsInventory } from '@prisma/client';
import bcrypt from 'bcrypt';

export const createTestUser = async (overrides: Partial<User> = {}): Promise<Partial<User>> => {
  const hashedPassword = await bcrypt.hash('TestPassword123', 10);
  
  return {
    email: 'test@example.com',
    passwordHash: hashedPassword,
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-0123',
    role: 'owner',
    isActive: true,
    emailVerified: true,
    ...overrides
  };
};

export const createTestShop = (userId: string, overrides: Partial<Shop> = {}): Partial<Shop> => ({
  name: 'Test Auto Repair',
  ownerId: userId,
  address: '123 Main Street',
  city: 'Testville',
  state: 'TS',
  zipCode: '12345',
  phone: '555-0123',
  email: 'info@testshop.com',
  taxRate: 0.0825,
  laborRate: 50.00,
  bayCount: 4,
  subscriptionTier: 'professional',
  isActive: true,
  ...overrides
});

export const createTestClient = (shopId: string, overrides: Partial<Client> = {}): Partial<Client> => ({
  shopId,
  clientId: 'C001',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-0456',
  email: 'jane.smith@email.com',
  address: '456 Oak Street',
  city: 'Testville',
  state: 'TS',
  zipCode: '12345',
  paymentTerms: 'COD',
  creditLimit: 1000.00,
  preferredContact: 'phone',
  isActive: true,
  ...overrides
});

export const createTestVehicle = (shopId: string, clientId: string, overrides: Partial<Vehicle> = {}): Partial<Vehicle> => ({
  shopId,
  clientId,
  vehicleId: 'V001',
  vin: '1HGBH41JXMN109186',
  make: 'Honda',
  model: 'Civic',
  year: 2020,
  licensePlate: 'ABC123',
  currentMileage: 50000,
  engineType: '2.0L 4-Cylinder',
  transmission: 'CVT',
  color: 'Blue',
  isActive: true,
  ...overrides
});

export const createTestWorkOrder = (shopId: string, clientId: string, vehicleId: string, overrides: Partial<WorkOrder> = {}): Partial<WorkOrder> => ({
  shopId,
  workOrderId: 'WO001',
  clientId,
  vehicleId,
  dateReceived: new Date(),
  datePromised: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
  mileageIn: 50000,
  customerComplaint: 'Oil change needed',
  laborHours: 1.0,
  laborCost: 50.00,
  partsCost: 25.00,
  taxAmount: 6.19,
  status: 'scheduled',
  authorizationAmount: 100.00,
  paymentStatus: 'pending',
  priorityLevel: 'routine',
  ...overrides
});

export const createTestPart = (shopId: string, overrides: Partial<PartsInventory> = {}): Partial<PartsInventory> => ({
  shopId,
  partId: 'P001',
  partNumber: '15400-PLM-A02',
  description: 'Honda Oil Filter',
  category: 'Filters',
  supplier: 'Honda Parts',
  supplierPartNumber: '15400-PLM-A02',
  costPrice: 8.50,
  sellingPrice: 15.99,
  quantityOnHand: 25,
  minStockLevel: 5,
  maxStockLevel: 50,
  reorderPoint: 10,
  reorderQuantity: 25,
  location: 'Shelf A1',
  isActive: true,
  ...overrides
});

export const testUsers = {
  owner: {
    email: 'owner@testshop.com',
    role: 'owner' as const
  },
  manager: {
    email: 'manager@testshop.com',
    role: 'manager' as const
  },
  technician: {
    email: 'technician@testshop.com',
    role: 'technician' as const
  },
  staff: {
    email: 'staff@testshop.com',
    role: 'staff' as const
  }
};

export const apiResponses = {
  success: (data: any, message = 'Success') => ({
    success: true,
    message,
    data
  }),
  error: (message: string, statusCode = 400) => ({
    success: false,
    message,
    statusCode
  }),
  validation: (errors: Record<string, string>) => ({
    success: false,
    message: 'Validation failed',
    errors,
    statusCode: 400
  })
};