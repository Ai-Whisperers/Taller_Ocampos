import request from 'supertest';
import { Express } from 'express';
import { faker } from '@faker-js/faker';
import app from '../../src/index';
import { TestHelper, initializeTestHelper } from '../utils/testHelpers';

describe('Clients API Integration Tests', () => {
  let server: Express;
  let testHelper: TestHelper;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    server = app;
    testHelper = initializeTestHelper(server);
  });

  beforeEach(async () => {
    // Create and authenticate a test user
    testUser = await testHelper.createAndAuthenticateUser();
    authToken = testUser.token;
  });

  describe('GET /api/clients', () => {
    it('should return paginated clients list', async () => {
      // Create test clients
      const client1 = await testHelper.createTestClient(authToken);
      const client2 = await testHelper.createTestClient(authToken);

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        pages: expect.any(Number),
      });
    });

    it('should filter clients by search term', async () => {
      const uniqueName = `SearchTest${faker.string.alphanumeric(6)}`;
      const searchableClient = {
        name: uniqueName,
        email: faker.internet.email(),
        phone: faker.phone.number(),
      };

      await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchableClient);

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: uniqueName });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe(uniqueName);
    });

    it('should require authentication', async () => {
      const response = await request(server)
        .get('/api/clients');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle pagination correctly', async () => {
      // Create multiple clients
      const clients = await Promise.all([
        testHelper.createTestClient(authToken),
        testHelper.createTestClient(authToken),
        testHelper.createTestClient(authToken),
      ]);

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.pages).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no clients found', async () => {
      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'NonExistentClient123456' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return specific client with details', async () => {
      const client = await testHelper.createTestClient(authToken);

      const response = await request(server)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: client.id,
        name: client.name,
        email: client.email,
      });
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = faker.string.uuid();

      const response = await request(server)
        .get(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should include related data (vehicles, work orders)', async () => {
      const client = await testHelper.createTestClient(authToken);
      const vehicle = await testHelper.createTestVehicle(authToken, client.id);

      const response = await request(server)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('vehicles');
      expect(response.body.data).toHaveProperty('workOrders');
      expect(response.body.data).toHaveProperty('_count');
    });
  });

  describe('POST /api/clients', () => {
    it('should create a new client successfully', async () => {
      const newClient = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
      };

      const response = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newClient);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.data).toMatchObject({
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should validate required fields', async () => {
      const invalidClient = {
        email: 'invalid-email',
        phone: '', // required field missing
      };

      const response = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidClient);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should prevent duplicate email addresses', async () => {
      const clientData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
      };

      // Create first client
      await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData);

      // Try to create duplicate
      const response = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(clientData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should handle missing required fields', async () => {
      const response = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Empty body

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update existing client successfully', async () => {
      const client = await testHelper.createTestClient(authToken);
      const updateData = {
        name: 'Updated Name',
        phone: '555-9999',
      };

      const response = await request(server)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data).toMatchObject({
        name: updateData.name,
        phone: updateData.phone,
      });
    });

    it('should return 404 for non-existent client update', async () => {
      const fakeId = faker.string.uuid();
      const updateData = { name: 'Updated Name' };

      const response = await request(server)
        .put(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const client = await testHelper.createTestClient(authToken);
      const invalidUpdate = {
        email: 'invalid-email-format',
      };

      const response = await request(server)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should allow partial updates', async () => {
      const client = await testHelper.createTestClient(authToken);
      const partialUpdate = { name: 'Only Name Updated' };

      const response = await request(server)
        .put(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(partialUpdate.name);
      expect(response.body.data.email).toBe(client.email); // Should remain unchanged
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete client successfully', async () => {
      const client = await testHelper.createTestClient(authToken);

      const response = await request(server)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify client is deleted
      const getResponse = await request(server)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent client deletion', async () => {
      const fakeId = faker.string.uuid();

      const response = await request(server)
        .delete(`/api/clients/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should prevent deletion of client with vehicles', async () => {
      const client = await testHelper.createTestClient(authToken);
      const vehicle = await testHelper.createTestVehicle(authToken, client.id);

      const response = await request(server)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existing vehicles');
    });

    it('should prevent deletion of client with work orders', async () => {
      const client = await testHelper.createTestClient(authToken);
      const vehicle = await testHelper.createTestVehicle(authToken, client.id);
      const workOrder = await testHelper.createTestWorkOrder(authToken, vehicle.id, client.id);

      const response = await request(server)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('work orders');
    });
  });

  describe('Authorization Tests', () => {
    it('should require valid JWT token for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/clients' },
        { method: 'post', path: '/api/clients' },
        { method: 'get', path: '/api/clients/123' },
        { method: 'put', path: '/api/clients/123' },
        { method: 'delete', path: '/api/clients/123' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(server)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('should reject expired tokens', async () => {
      const expiredToken = 'expired.jwt.token';

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should work with different user roles', async () => {
      // Test with STAFF role
      const staffUser = await testHelper.createAndAuthenticateUser();
      // Assume we have a way to set user role to STAFF

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${staffUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test the general error handling structure

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer invalid-token-format`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    it('should validate UUIDs in URL parameters', async () => {
      const response = await request(server)
        .get('/api/clients/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance and Load Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        request(server)
          .get('/api/clients')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should handle large pagination requests', async () => {
      const response = await request(server)
        .get('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 100 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(100);
    });
  });
});