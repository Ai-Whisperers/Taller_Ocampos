import request from 'supertest';
import { Express } from 'express';
import { faker } from '@faker-js/faker';

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  token?: string;
}

export class TestHelper {
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  // Authentication helpers
  async createAndAuthenticateUser(): Promise<TestUser> {
    const user: TestUser = {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      name: faker.person.fullName(),
    };

    // Register user
    const registerResponse = await request(this.app)
      .post('/api/auth/register')
      .send(user);

    user.id = registerResponse.body.data.user.id;
    user.token = registerResponse.body.data.token;

    return user;
  }

  async loginUser(email: string, password: string): Promise<string> {
    const response = await request(this.app)
      .post('/api/auth/login')
      .send({ email, password });

    return response.body.data.token;
  }

  // Client helpers
  async createTestClient(token: string) {
    const clientData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      document: faker.string.alphanumeric(10),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
    };

    const response = await request(this.app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(clientData);

    return response.body.data;
  }

  // Vehicle helpers
  async createTestVehicle(token: string, clientId: string) {
    const vehicleData = {
      clientId,
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.number.int({ min: 2000, max: 2024 }),
      licensePlate: faker.vehicle.vrm(),
      vin: faker.vehicle.vin(),
      color: faker.vehicle.color(),
      mileage: faker.number.int({ min: 1000, max: 200000 }),
    };

    const response = await request(this.app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send(vehicleData);

    return response.body.data;
  }

  // Work order helpers
  async createTestWorkOrder(token: string, vehicleId: string, clientId: string) {
    const workOrderData = {
      vehicleId,
      clientId,
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      estimatedCost: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
      estimatedCompletionDate: faker.date.future(),
      status: 'PENDING_APPROVAL',
    };

    const response = await request(this.app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${token}`)
      .send(workOrderData);

    return response.body.data;
  }

  // Cleanup helpers
  async cleanupTestData(ids: { users?: string[]; clients?: string[]; vehicles?: string[]; workOrders?: string[] }) {
    // This would typically call database cleanup methods
    // For now, it's a placeholder
    console.log('Cleaning up test data:', ids);
  }

  // Utility functions
  generateValidEmail(): string {
    return faker.internet.email();
  }

  generateValidPassword(): string {
    return `${faker.internet.password(8)}A1!`;
  }

  generateInvalidEmail(): string {
    return 'invalid-email';
  }

  generateInvalidPassword(): string {
    return '123'; // Too short, no uppercase, no special char
  }

  // Request builders
  makeAuthenticatedRequest(token: string) {
    return {
      get: (url: string) =>
        request(this.app)
          .get(url)
          .set('Authorization', `Bearer ${token}`),
      post: (url: string) =>
        request(this.app)
          .post(url)
          .set('Authorization', `Bearer ${token}`),
      put: (url: string) =>
        request(this.app)
          .put(url)
          .set('Authorization', `Bearer ${token}`),
      patch: (url: string) =>
        request(this.app)
          .patch(url)
          .set('Authorization', `Bearer ${token}`),
      delete: (url: string) =>
        request(this.app)
          .delete(url)
          .set('Authorization', `Bearer ${token}`),
    };
  }

  // Assertion helpers
  expectValidationError(response: any, field: string) {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
    const fieldError = response.body.errors.find((e: any) => e.param === field);
    expect(fieldError).toBeDefined();
  }

  expectAuthenticationError(response: any) {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Unauthorized');
  }

  expectNotFoundError(response: any) {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  }

  expectSuccessResponse(response: any, statusCode: number = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  }
}

// Export singleton instance for easy use
let testHelperInstance: TestHelper | null = null;

export function initializeTestHelper(app: Express): TestHelper {
  if (!testHelperInstance) {
    testHelperInstance = new TestHelper(app);
  }
  return testHelperInstance;
}

export function getTestHelper(): TestHelper {
  if (!testHelperInstance) {
    throw new Error('TestHelper not initialized. Call initializeTestHelper first.');
  }
  return testHelperInstance;
}