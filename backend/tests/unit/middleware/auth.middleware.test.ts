import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../../../src/middleware/auth';
import { testUsers, mockRequest, mockResponse, mockNext } from '../../fixtures/testData';

jest.mock('jsonwebtoken');
jest.mock('@prisma/client');

describe('Auth Middleware', () => {
  let prisma: any;
  let req: Partial<Request>;
  let res: any;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    prisma = new PrismaClient();
    req = { ...mockRequest };
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();

    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const token = 'valid-token';
      const decodedUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        role: testUsers.admin.role,
      };

      req.headers = { authorization: `Bearer ${token}` };

      (jwt.verify as jest.Mock).mockReturnValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);

      await authenticateToken(req as Request, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: decodedUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
        },
      });
      expect(req.user).toEqual(testUsers.admin);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      req.headers = {};

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      req.headers = { authorization: 'InvalidFormat' };

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const token = 'invalid-token';
      req.headers = { authorization: `Bearer ${token}` };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = 'valid-token';
      const decodedUser = {
        id: 'non-existent-user',
        email: 'ghost@test.com',
        role: 'ADMIN',
      };

      req.headers = { authorization: `Bearer ${token}` };

      (jwt.verify as jest.Mock).mockReturnValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const token = 'valid-token';
      const decodedUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        role: testUsers.admin.role,
      };

      req.headers = { authorization: `Bearer ${token}` };

      (jwt.verify as jest.Mock).mockReturnValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle expired token', async () => {
      const token = 'expired-token';
      req.headers = { authorization: `Bearer ${token}` };

      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await authenticateToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      req.user = testUsers.admin; // ADMIN role
      const middleware = requireRole(['ADMIN']);

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for user with any of the required roles', () => {
      req.user = testUsers.staff; // STAFF role
      const middleware = requireRole(['ADMIN', 'STAFF']);

      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      req.user = testUsers.staff; // STAFF role
      const middleware = requireRole(['ADMIN']); // Requires ADMIN

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for request without user', () => {
      req.user = undefined;
      const middleware = requireRole(['ADMIN']);

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      req.user = testUsers.admin;
      const middleware = requireRole([]);

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive for roles', () => {
      req.user = { ...testUsers.admin, role: 'admin' }; // lowercase
      const middleware = requireRole(['ADMIN']); // uppercase

      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Combined usage', () => {
    it('should work with both middleware in sequence', async () => {
      const token = 'valid-token';
      const decodedUser = {
        id: testUsers.admin.id,
        email: testUsers.admin.email,
        role: testUsers.admin.role,
      };

      req.headers = { authorization: `Bearer ${token}` };

      (jwt.verify as jest.Mock).mockReturnValue(decodedUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(testUsers.admin);

      // First middleware: authenticateToken
      await authenticateToken(req as Request, res as Response, next);

      expect(req.user).toEqual(testUsers.admin);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset next mock
      next.mockClear();

      // Second middleware: requireRole
      const roleMiddleware = requireRole(['ADMIN']);
      roleMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});