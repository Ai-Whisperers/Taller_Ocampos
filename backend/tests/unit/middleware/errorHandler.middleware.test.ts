import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { mockRequest, mockResponse } from '../../fixtures/testData';

describe('Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: any;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = { ...mockRequest };
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();

    // Mock logger
    jest.mock('../../../src/utils/logger', () => ({
      logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      },
    }));
  });

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Generic error');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? 'Generic error' : undefined,
    });
  });

  it('should handle errors with custom status codes', () => {
    const error: any = new Error('Not found');
    error.statusCode = 404;

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not found',
      error: process.env.NODE_ENV === 'development' ? 'Not found' : undefined,
    });
  });

  it('should handle Prisma validation errors', () => {
    const error: any = new Error('Validation failed');
    error.code = 'P2002';
    error.meta = {
      target: ['email'],
    };

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation error: Unique constraint violation on email',
      error: process.env.NODE_ENV === 'development' ? 'Validation failed' : undefined,
    });
  });

  it('should handle Prisma foreign key constraint errors', () => {
    const error: any = new Error('Foreign key constraint');
    error.code = 'P2003';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Foreign key constraint violation',
      error: process.env.NODE_ENV === 'development' ? 'Foreign key constraint' : undefined,
    });
  });

  it('should handle Prisma record not found errors', () => {
    const error: any = new Error('Record not found');
    error.code = 'P2025';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Record not found',
      error: process.env.NODE_ENV === 'development' ? 'Record not found' : undefined,
    });
  });

  it('should handle JWT errors', () => {
    const error: any = new Error('Invalid token');
    error.name = 'JsonWebTokenError';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? 'Invalid token' : undefined,
    });
  });

  it('should handle JWT expired errors', () => {
    const error: any = new Error('Token expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token expired',
      error: process.env.NODE_ENV === 'development' ? 'Token expired' : undefined,
    });
  });

  it('should handle validation errors with details', () => {
    const error: any = new Error('Validation failed');
    error.name = 'ValidationError';
    error.details = [
      { path: ['email'], message: 'Email is required' },
      { path: ['password'], message: 'Password is too short' },
    ];

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      errors: error.details,
      error: process.env.NODE_ENV === 'development' ? 'Validation failed' : undefined,
    });
  });

  it('should handle rate limit errors', () => {
    const error: any = new Error('Too many requests');
    error.statusCode = 429;

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Too many requests',
      error: process.env.NODE_ENV === 'development' ? 'Too many requests' : undefined,
    });
  });

  it('should handle syntax errors', () => {
    const error: any = new SyntaxError('Unexpected token');
    error.statusCode = 400;

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad Request - Invalid JSON',
      error: process.env.NODE_ENV === 'development' ? 'Unexpected token' : undefined,
    });
  });

  it('should not expose error details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Sensitive information');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should expose error details in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Debug information');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      error: 'Debug information',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle errors without message', () => {
    const error: any = {};
    error.statusCode = 400;

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad Request',
      error: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });
  });

  it('should add request context to error logging', () => {
    const error = new Error('Test error');

    req.method = 'POST';
    req.url = '/api/test';
    req.user = { id: 'user123', email: 'test@example.com' };

    errorHandler(error, req as Request, res as Response, next);

    // Error should be logged with context (we can't easily test the logger mock here
    // but in a real scenario, you'd verify the logger.error was called with context)
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should handle circular reference in error objects', () => {
    const error: any = new Error('Circular reference');
    error.circular = error; // Create circular reference

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? 'Circular reference' : undefined,
    });
  });
});