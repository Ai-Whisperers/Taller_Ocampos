/**
 * User Test Data Factory
 * Generates realistic user/auth data for testing using Faker.js
 */

import { faker } from '@faker-js/faker';

export type UserRole = 'admin' | 'mechanic' | 'receptionist' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message?: string;
  error?: string;
}

/**
 * Creates a single user with realistic test data
 */
export function createUser(overrides?: Partial<User>): User {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    name: `${firstName} ${lastName}`,
    role: 'user',
    phone: faker.helpers.fromRegExp(/09[0-9]{8}/),
    avatar: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.4 }),
    isActive: true,
    emailVerified: true,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    lastLogin: faker.helpers.maybe(() => faker.date.recent({ days: 7 }).toISOString(), { probability: 0.8 }),
    ...overrides,
  };
}

/**
 * Creates multiple users
 */
export function createUsers(count: number, overrides?: Partial<User>): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

/**
 * Creates a user with a specific role
 */
export function createUserWithRole(role: UserRole, overrides?: Partial<User>): User {
  return createUser({
    role,
    ...overrides,
  });
}

/**
 * Creates an admin user
 */
export function createAdminUser(overrides?: Partial<User>): User {
  return createUserWithRole('admin', overrides);
}

/**
 * Creates a mechanic user
 */
export function createMechanicUser(overrides?: Partial<User>): User {
  return createUserWithRole('mechanic', overrides);
}

/**
 * Creates a receptionist user
 */
export function createReceptionistUser(overrides?: Partial<User>): User {
  return createUserWithRole('receptionist', overrides);
}

/**
 * Creates an inactive user
 */
export function createInactiveUser(overrides?: Partial<User>): User {
  return createUser({
    isActive: false,
    lastLogin: faker.date.past({ years: 0.5 }).toISOString(),
    ...overrides,
  });
}

/**
 * Creates a user with unverified email
 */
export function createUnverifiedUser(overrides?: Partial<User>): User {
  return createUser({
    emailVerified: false,
    lastLogin: undefined,
    ...overrides,
  });
}

/**
 * Creates a successful auth response
 */
export function createAuthResponse(user?: Partial<User>): AuthResponse {
  return {
    success: true,
    data: {
      user: createUser(user),
      token: `Bearer ${faker.string.alphanumeric(64)}`,
    },
  };
}

/**
 * Creates a failed auth response
 */
export function createFailedAuthResponse(message?: string): AuthResponse {
  return {
    success: false,
    error: message || faker.helpers.arrayElement([
      'Invalid credentials',
      'Email not found',
      'Password incorrect',
      'Account is locked',
      'Too many login attempts',
    ]),
  };
}

/**
 * Creates registration data
 */
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export function createRegistrationData(overrides?: Partial<RegistrationData>): RegistrationData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    phone: faker.helpers.fromRegExp(/09[0-9]{8}/),
    ...overrides,
  };
}

/**
 * Creates login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export function createLoginCredentials(overrides?: Partial<LoginCredentials>): LoginCredentials {
  return {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,
  };
}

/**
 * Common test users with predefined data
 */
export const testUsers = {
  admin: (): User => createAdminUser({
    email: 'admin@test.com',
    name: 'Admin User',
    phone: '0981111111',
  }),

  mechanic: (): User => createMechanicUser({
    email: 'mechanic@test.com',
    name: 'Carlos Mechanic',
    phone: '0982222222',
  }),

  receptionist: (): User => createReceptionistUser({
    email: 'reception@test.com',
    name: 'María Receptionist',
    phone: '0983333333',
  }),

  regular: (): User => createUser({
    email: 'user@test.com',
    name: 'Juan User',
    phone: '0984444444',
  }),
};

/**
 * Common test credentials
 */
export const testCredentials = {
  valid: (): LoginCredentials => ({
    email: 'test@example.com',
    password: 'password123',
  }),

  admin: (): LoginCredentials => ({
    email: 'admin@test.com',
    password: 'admin123',
  }),

  invalid: (): LoginCredentials => ({
    email: 'wrong@example.com',
    password: 'wrongpassword',
  }),
};
