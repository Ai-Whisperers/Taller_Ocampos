import { Request, Response } from 'express';
import { VehicleController } from '../../src/controllers/vehicle.controller';
import { PrismaClient } from '@prisma/client';
import { testVehicles, testClients, mockRequest, mockResponse } from '../fixtures/testData';

jest.mock('@prisma/client');

describe('VehicleController', () => {
  let vehicleController: VehicleController;
  let prisma: any;
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    vehicleController = new VehicleController();
    prisma = new PrismaClient();
    req = { ...mockRequest };
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated vehicles', async () => {
      req.query = { page: '1', limit: '10' };
      const mockVehicles = [testVehicles.vehicle1, testVehicles.vehicle2];

      (prisma.vehicle.findMany as jest.Mock).mockResolvedValue(mockVehicles);
      (prisma.vehicle.count as jest.Mock).mockResolvedValue(2);

      await vehicleController.getAll(req as Request, res as Response);

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockVehicles,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pages: 1,
        },
      });
    });

    it('should filter vehicles by clientId', async () => {
      req.query = { clientId: testClients.client1.id };
      const mockVehicles = [testVehicles.vehicle1];

      (prisma.vehicle.findMany as jest.Mock).mockResolvedValue(mockVehicles);
      (prisma.vehicle.count as jest.Mock).mockResolvedValue(1);

      await vehicleController.getAll(req as Request, res as Response);

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { clientId: testClients.client1.id },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      });
    });

    it('should search vehicles by make, model, or license plate', async () => {
      req.query = { search: 'toyota' };
      const mockVehicles = [testVehicles.vehicle1];

      (prisma.vehicle.findMany as jest.Mock).mockResolvedValue(mockVehicles);
      (prisma.vehicle.count as jest.Mock).mockResolvedValue(1);

      await vehicleController.getAll(req as Request, res as Response);

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { brand: { contains: 'toyota', mode: 'insensitive' } },
            { model: { contains: 'toyota', mode: 'insensitive' } },
            { licensePlate: { contains: 'toyota', mode: 'insensitive' } },
            { vin: { contains: 'toyota', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      (prisma.vehicle.findMany as jest.Mock).mockRejectedValue(error);

      await vehicleController.getAll(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve vehicles',
        error: error.message,
      });
    });
  });

  describe('getById', () => {
    it('should return vehicle by id with service history', async () => {
      req.params = { id: testVehicles.vehicle1.id };
      const mockVehicleWithHistory = {
        ...testVehicles.vehicle1,
        client: testClients.client1,
        workOrders: [],
      };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(mockVehicleWithHistory);

      await vehicleController.getById(req as Request, res as Response);

      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: testVehicles.vehicle1.id },
        include: {
          client: true,
          workOrders: {
            include: {
              services: {
                include: {
                  service: true,
                },
              },
              parts: {
                include: {
                  part: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockVehicleWithHistory,
      });
    });

    it('should return 404 if vehicle not found', async () => {
      req.params = { id: 'non-existent-id' };
      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

      await vehicleController.getById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vehicle not found',
      });
    });
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      const newVehicle = {
        clientId: testClients.client1.id,
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        licensePlate: 'XYZ789',
        vin: '1HGBH41JXMN109186',
        color: 'Red',
        mileage: 5000,
      };

      req.body = newVehicle;

      // Mock client exists
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);

      // Mock vehicle creation
      (prisma.vehicle.create as jest.Mock).mockResolvedValue({
        id: 'new-vehicle-id',
        ...newVehicle,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vehicleController.create(req as Request, res as Response);

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: testClients.client1.id },
      });

      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: newVehicle,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Vehicle created successfully',
        data: expect.objectContaining({
          id: 'new-vehicle-id',
          brand: newVehicle.brand,
          model: newVehicle.model,
        }),
      });
    });

    it('should return 404 if client does not exist', async () => {
      req.body = {
        clientId: 'non-existent-client',
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        licensePlate: 'XYZ789',
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await vehicleController.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Client not found',
      });
    });

    it('should handle validation errors', async () => {
      req.body = { brand: '', year: 'invalid' }; // Invalid data

      await vehicleController.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array),
      });
    });

    it('should handle duplicate license plate error', async () => {
      req.body = {
        clientId: testClients.client1.id,
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        licensePlate: testVehicles.vehicle1.licensePlate, // Duplicate
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(testClients.client1);

      const error = new Error('Unique constraint failed');
      error.message = 'Unique constraint failed on the fields: (`licensePlate`)';
      (prisma.vehicle.create as jest.Mock).mockRejectedValue(error);

      await vehicleController.create(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vehicle with this license plate already exists',
      });
    });
  });

  describe('update', () => {
    it('should update an existing vehicle', async () => {
      const updateData = {
        mileage: 25000,
        color: 'Blue',
      };

      req.params = { id: testVehicles.vehicle1.id };
      req.body = updateData;

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(testVehicles.vehicle1);
      (prisma.vehicle.update as jest.Mock).mockResolvedValue({
        ...testVehicles.vehicle1,
        ...updateData,
        updatedAt: new Date(),
      });

      await vehicleController.update(req as Request, res as Response);

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: testVehicles.vehicle1.id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Vehicle updated successfully',
        data: expect.objectContaining({
          mileage: updateData.mileage,
          color: updateData.color,
        }),
      });
    });

    it('should return 404 if vehicle not found for update', async () => {
      req.params = { id: 'non-existent-id' };
      req.body = { mileage: 25000 };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

      await vehicleController.update(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vehicle not found',
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing vehicle', async () => {
      req.params = { id: testVehicles.vehicle1.id };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(testVehicles.vehicle1);
      (prisma.vehicle.delete as jest.Mock).mockResolvedValue(testVehicles.vehicle1);

      await vehicleController.delete(req as Request, res as Response);

      expect(prisma.vehicle.delete).toHaveBeenCalledWith({
        where: { id: testVehicles.vehicle1.id },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Vehicle deleted successfully',
      });
    });

    it('should return 404 if vehicle not found for deletion', async () => {
      req.params = { id: 'non-existent-id' };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

      await vehicleController.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vehicle not found',
      });
    });

    it('should handle foreign key constraint error', async () => {
      req.params = { id: testVehicles.vehicle1.id };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(testVehicles.vehicle1);

      const error = new Error('Foreign key constraint failed');
      (prisma.vehicle.delete as jest.Mock).mockRejectedValue(error);

      await vehicleController.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete vehicle with existing work orders',
      });
    });
  });

  describe('getServiceHistory', () => {
    it('should return vehicle service history', async () => {
      req.params = { id: testVehicles.vehicle1.id };
      const mockHistory = [
        {
          id: 'wo1',
          orderNumber: 'WO-2024-001',
          status: 'COMPLETED',
          description: 'Oil change',
          createdAt: new Date(),
          completionDate: new Date(),
        },
      ];

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(testVehicles.vehicle1);
      (prisma.workOrder.findMany as jest.Mock).mockResolvedValue(mockHistory);

      await vehicleController.getServiceHistory(req as Request, res as Response);

      expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
        where: { vehicleId: testVehicles.vehicle1.id },
        include: {
          services: {
            include: {
              service: true,
            },
          },
          parts: {
            include: {
              part: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
      });
    });

    it('should return 404 if vehicle not found for service history', async () => {
      req.params = { id: 'non-existent-id' };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

      await vehicleController.getServiceHistory(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vehicle not found',
      });
    });
  });
});