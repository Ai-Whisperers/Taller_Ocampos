import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/auth.controller';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { testUsers, mockRequest, mockResponse } from '../fixtures/testData';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController: AuthController;
  let prisma: any;
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    authController = new AuthController();
    prisma = new PrismaClient();
    req = { ...mockRequest };
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'Password123!',
        name: 'New User',
        phone: '1234567890',
      };

      req.body = newUser;

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: newUser.email,
        name: newUser.name,
        role: 'ADMIN',
        phone: newUser.phone,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      await authController.register(req as Request, res as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: newUser.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(newUser.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: newUser.email,
          password: 'hashed_password',
          name: newUser.name,
          phone: newUser.phone,
          role: 'ADMIN',
        },
        select: expect.any(Object),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: newUser.email,
            name: newUser.name,
          }),
          token: 'mock_token',
        }),
      });
    });

    it('should return 409 if user already exists', async () => {
      req.body = {
        email: testUsers.admin.email,
        password: 'Password123!',
        name: 'Test User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
    });

    it('should handle registration errors', async () => {
      req.body = {
        email: 'test@test.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const error = new Error('Database error');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      await authController.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Registration failed',
        error: error.message,
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      req.body = {
        email: testUsers.admin.email,
        password: testUsers.admin.password,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...testUsers.admin,
        password: testUsers.admin.hashedPassword,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      await authController.login(req as Request, res as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testUsers.admin.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        testUsers.admin.password,
        testUsers.admin.hashedPassword
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: testUsers.admin.email,
            name: testUsers.admin.name,
            role: testUsers.admin.role,
          }),
          token: 'mock_token',
        }),
      });
    });

    it('should return 401 for invalid email', async () => {
      req.body = {
        email: 'nonexistent@test.com',
        password: 'Password123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 401 for invalid password', async () => {
      req.body = {
        email: testUsers.admin.email,
        password: 'WrongPassword123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...testUsers.admin,
        password: testUsers.admin.hashedPassword,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should handle login errors', async () => {
      req.body = {
        email: testUsers.admin.email,
        password: testUsers.admin.password,
      };

      const error = new Error('Database connection failed');
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      await authController.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      req.user = { id: testUsers.admin.id };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        name: testUsers.admin.name,
        role: testUsers.admin.role,
        phone: testUsers.admin.phone,
        createdAt: testUsers.admin.createdAt,
        updatedAt: testUsers.admin.updatedAt,
      });

      await authController.getProfile(req as Request, res as Response);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUsers.admin.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: testUsers.admin.id,
          email: testUsers.admin.email,
          name: testUsers.admin.name,
        }),
      });
    });

    it('should return 404 if user not found', async () => {
      req.user = { id: 'non-existent-id' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authController.getProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      req.user = { id: testUsers.admin.id };
      req.body = {
        currentPassword: testUsers.admin.password,
        newPassword: 'NewPassword123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...testUsers.admin,
        password: testUsers.admin.hashedPassword,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...testUsers.admin,
        password: 'new_hashed_password',
      });

      await authController.updatePassword(req as Request, res as Response);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        req.body.currentPassword,
        testUsers.admin.hashedPassword
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(req.body.newPassword, 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUsers.admin.id },
        data: { password: 'new_hashed_password' },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password updated successfully',
      });
    });

    it('should return 401 for incorrect current password', async () => {
      req.user = { id: testUsers.admin.id };
      req.body = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...testUsers.admin,
        password: testUsers.admin.hashedPassword,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await authController.updatePassword(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Current password is incorrect',
      });
    });
  });
});