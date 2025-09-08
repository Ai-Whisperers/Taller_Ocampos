import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../../src/services/authService';
import { prisma } from '../../setup';
import { createTestUser, createTestShop } from '../../fixtures/testData';

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and shop successfully', async () => {
      const userData = await createTestUser();
      
      mockedBcrypt.hash.mockResolvedValue('hashedPassword' as never);
      mockedJwt.sign.mockReturnValue('accessToken' as never);

      const result = await authService.register({
        email: userData.email!,
        password: 'TestPassword123',
        firstName: userData.firstName!,
        lastName: userData.lastName!,
        shopName: 'Test Shop'
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
      expect(result.shop.name).toBe('Test Shop');
      expect(result.tokens.accessToken).toBe('accessToken');
    });

    it('should reject duplicate email addresses', async () => {
      const userData = await createTestUser();
      
      // Create existing user
      await prisma.user.create({
        data: userData as any
      });

      const result = await authService.register({
        email: userData.email!,
        password: 'TestPassword123',
        firstName: 'Jane',
        lastName: 'Doe',
        shopName: 'Another Shop'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email already exists');
    });

    it('should validate password strength', async () => {
      const result = await authService.register({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        shopName: 'Test Shop'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Password must be at least 8 characters');
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const userData = await createTestUser();
      const user = await prisma.user.create({
        data: userData as any
      });

      const shop = await prisma.shop.create({
        data: createTestShop(user.id) as any
      });

      await prisma.userShop.create({
        data: {
          userId: user.id,
          shopId: shop.id,
          role: 'owner'
        }
      });

      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValue('accessToken' as never);

      const result = await authService.login({
        email: userData.email!,
        password: 'TestPassword123'
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
      expect(result.shops).toHaveLength(1);
      expect(result.tokens.accessToken).toBe('accessToken');
    });

    it('should reject invalid credentials', async () => {
      const userData = await createTestUser();
      await prisma.user.create({
        data: userData as any
      });

      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await authService.login({
        email: userData.email!,
        password: 'WrongPassword'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid credentials');
    });

    it('should reject login for inactive users', async () => {
      const userData = await createTestUser({ isActive: false });
      await prisma.user.create({
        data: userData as any
      });

      const result = await authService.login({
        email: userData.email!,
        password: 'TestPassword123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Account is deactivated');
    });
  });

  describe('refreshToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      const userData = await createTestUser();
      const user = await prisma.user.create({
        data: userData as any
      });

      mockedJwt.verify.mockReturnValue({ userId: user.id } as never);
      mockedJwt.sign.mockReturnValue('newAccessToken' as never);

      const result = await authService.refreshToken('validRefreshToken');

      expect(result.success).toBe(true);
      expect(result.tokens.accessToken).toBe('newAccessToken');
    });

    it('should reject invalid refresh token', async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.refreshToken('invalidRefreshToken');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid refresh token');
    });
  });

  describe('validateToken', () => {
    it('should validate and decode JWT token', async () => {
      const userData = await createTestUser();
      const user = await prisma.user.create({
        data: userData as any
      });

      mockedJwt.verify.mockReturnValue({ 
        userId: user.id, 
        email: user.email,
        role: user.role 
      } as never);

      const result = await authService.validateToken('validToken');

      expect(result.success).toBe(true);
      expect(result.payload.userId).toBe(user.id);
      expect(result.payload.email).toBe(user.email);
    });

    it('should reject expired or invalid tokens', async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const result = await authService.validateToken('expiredToken');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid or expired token');
    });
  });
});