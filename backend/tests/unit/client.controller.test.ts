import { Request, Response } from 'express';
import { ClientController } from '../../src/controllers/client.controller';
import { PrismaClient } from '@prisma/client';
import { testClients, mockRequest, mockResponse } from '../fixtures/testData';

jest.mock('@prisma/client');

describe('ClientController', () => {
  let clientController: ClientController;
  let prisma: any;
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    clientController = new ClientController();
    prisma = new PrismaClient();
    req = { ...mockRequest };
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated clients', async () => {
      req.query = { page: '1', limit: '10' };
      const mockClients = [testClients.client1, testClients.client2];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);
      (prisma.client.count as jest.Mock).mockResolvedValue(2);

      await clientController.getAll(req as Request, res as Response);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              vehicles: true,
              workOrders: true,
              invoices: true,
            },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClients,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should filter clients by search term', async () => {
      req.query = { search: 'john' };
      const mockClients = [testClients.client1];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);
      (prisma.client.count as jest.Mock).mockResolvedValue(1);

      await clientController.getAll(req as Request, res as Response);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
            { phone: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              vehicles: true,
              workOrders: true,
              invoices: true,
            },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockClients,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should handle pagination correctly', async () => {
      req.query = { page: '2', limit: '5' };

      (prisma.client.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.client.count as jest.Mock).mockResolvedValue(12);

      await clientController.getAll(req as Request, res as Response);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 2,
            limit: 5,
            total: 12,
            pages: 3,
          },
        })
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      (prisma.client.findMany as jest.Mock).mockRejectedValue(error);

      await clientController.getAll(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve clients',
        error: error.message,
      });
    });
  });

  describe('getById', () => {
    it('should return client by id', async () => {
      req.params = { id: testClients.client1.id };
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);

      await clientController.getById(req as Request, res as Response);

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: testClients.client1.id },
        include: {
          vehicles: true,
          workOrders: {
            include: {
              vehicle: true,
            },
          },
          invoices: true,
          _count: {
            select: {
              vehicles: true,
              workOrders: true,
              invoices: true,
              payments: true,
            },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: testClients.client1,
      });
    });

    it('should return 404 if client not found', async () => {
      req.params = { id: 'non-existent-id' };
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await clientController.getById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Client not found',
      });
    });

    it('should handle database errors', async () => {
      req.params = { id: testClients.client1.id };
      const error = new Error('Database error');
      (prisma.client.findUnique as jest.Mock).mockRejectedValue(error);

      await clientController.getById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve client',
        error: error.message,
      });
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const newClient = {
        name: 'New Client',
        email: 'newclient@test.com',
        phone: '555-0199',
        address: '456 Oak St',
      };

      req.body = newClient;
      (prisma.client.create as jest.Mock).mockResolvedValue({
        id: 'new-client-id',
        ...newClient,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await clientController.create(req as Request, res as Response);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: newClient,
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Client created successfully',
        data: expect.objectContaining({
          id: 'new-client-id',
          name: newClient.name,
          email: newClient.email,
        }),
      });
    });

    it('should handle validation errors', async () => {
      req.body = { name: '' }; // Missing required fields

      await clientController.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array),
      });
    });

    it('should handle duplicate email error', async () => {
      req.body = {
        name: 'Test Client',
        email: testClients.client1.email,
        phone: '555-0100',
      };

      const error = new Error('Unique constraint failed');
      error.message = 'Unique constraint failed on the fields: (`email`)';
      (prisma.client.create as jest.Mock).mockRejectedValue(error);

      await clientController.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Client with this email already exists',
      });
    });

    it('should handle other database errors', async () => {
      req.body = {
        name: 'Test Client',
        email: 'test@test.com',
        phone: '555-0100',
      };

      const error = new Error('Database connection failed');
      (prisma.client.create as jest.Mock).mockRejectedValue(error);

      await clientController.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create client',
        error: error.message,
      });
    });
  });

  describe('update', () => {
    it('should update an existing client', async () => {
      const updateData = {
        name: 'Updated Client',
        phone: '555-9999',
      };

      req.params = { id: testClients.client1.id };
      req.body = updateData;

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);
      (prisma.client.update as jest.Mock).mockResolvedValue({
        ...testClients.client1,
        ...updateData,
        updatedAt: new Date(),
      });

      await clientController.update(req as Request, res as Response);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: testClients.client1.id },
        data: updateData,
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Client updated successfully',
        data: expect.objectContaining({
          name: updateData.name,
          phone: updateData.phone,
        }),
      });
    });

    it('should return 404 if client not found for update', async () => {
      req.params = { id: 'non-existent-id' };
      req.body = { name: 'Updated Name' };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await clientController.update(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Client not found',
      });
    });

    it('should handle update validation errors', async () => {
      req.params = { id: testClients.client1.id };
      req.body = { email: 'invalid-email' };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);

      await clientController.update(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array),
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing client', async () => {
      req.params = { id: testClients.client1.id };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);
      (prisma.client.delete as jest.Mock).mockResolvedValue(testClients.client1);

      await clientController.delete(req as Request, res as Response);

      expect(prisma.client.delete).toHaveBeenCalledWith({
        where: { id: testClients.client1.id },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Client deleted successfully',
      });
    });

    it('should return 404 if client not found for deletion', async () => {
      req.params = { id: 'non-existent-id' };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await clientController.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Client not found',
      });
    });

    it('should handle foreign key constraint error', async () => {
      req.params = { id: testClients.client1.id };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);

      const error = new Error('Foreign key constraint failed');
      (prisma.client.delete as jest.Mock).mockRejectedValue(error);

      await clientController.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete client with existing vehicles or work orders',
      });
    });

    it('should handle other deletion errors', async () => {
      req.params = { id: testClients.client1.id };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);

      const error = new Error('Database error');
      (prisma.client.delete as jest.Mock).mockRejectedValue(error);

      await clientController.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete client',
        error: error.message,
      });
    });
  });
});