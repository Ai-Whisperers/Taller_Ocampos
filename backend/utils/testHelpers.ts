import request, { Request, Response } from 'supertest';
import { faker } from '@faker-js/faker';
import app from '../../src/index';
import { TestHelper, initializeTestHelper } from '../utils/testHelpers';

// Define proper Express types
interface ServerRequest {
  method: string;
  url?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

interface ServerResponse {
  status: number;
  message?: string;
  data?: any;
}

interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  token?: string;
}

// Extend Express with proper types
const express: Express = express() as Express;

// Update createAndAuthenticateUser to return typed user
async function createAndAuthenticateUser(userData: {
  const testUser = {
    email: userData.email,
    password: userData.password,
    name: userData.name,
  };
  
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
    
    const { user, token } = response.body.data;
    user.token = token;
    
    return { user, token };
  }

// Update createTestClient to return typed client
async function createTestClient(authToken: string) {
  const clientData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
  };
    
    return request(app)
      .get(`/api/clients`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .query({ page: 1, limit: 10 });
    
    const response = await request(app);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2));
    expect(response.body.data[0]).toMatchObject({
      id: expect.string(testData.clientId),
      name: expect.string(testData.name),
    });
    
    return response.data;
}

// Fix test data creation
function createTestClientData(): TestClientData {
  return {
    id: faker.string.alphanumeric(10),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
  };
}

// Fix test helper typing
function initializeTestHelper(app: Express): TestHelper {
  this.app = app;
}

// Update createTestServer to return typed server
function createTestServer(): TestServer {
  const server = express();
  
  return {
    request: express.request,
    response: express.response,
  };
}