import request from 'supertest';
import { Express } from 'express';
import { faker } from '@faker-js/faker';
import app from '../../src/index'; // Adjust import path as needed

describe('Authentication Integration Tests', () => {
  let server: Express;

  beforeAll(() => {
    server = app;
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'TestPassword123!',
        phone: faker.phone.number(),
      };

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'TestPassword123!',
      };

      // First registration
      await request(server)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same email
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'TestPassword123!',
      };

      await request(server)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return error for invalid email', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return error for invalid password', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser: any;
    let authToken: string;

    beforeEach(async () => {
      testUser = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'TestPassword123!',
      };

      const registerResponse = await request(server)
        .post('/api/auth/register')
        .send(testUser);

      authToken = registerResponse.body.data.token;
    });

    it('should return user profile for authenticated user', async () => {
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
    });

    it('should return error for missing token', async () => {
      const response = await request(server)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid token', async () => {
      const response = await request(server)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});