import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class VehicleController {
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, clientId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (clientId) {
        where.clientId = String(clientId);
      }

      if (search) {
        where.OR = [
          { licensePlate: { contains: String(search), mode: 'insensitive' } },
          { vin: { contains: String(search), mode: 'insensitive' } },
          { brand: { contains: String(search), mode: 'insensitive' } },
          { model: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: true,
            _count: {
              select: {
                workOrders: true,
              },
            },
          },
        }),
        prisma.vehicle.count({ where }),
      ]);

      res.json({
        success: true,
        data: vehicles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching vehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicles',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          client: true,
          workOrders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      res.json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      logger.error('Error fetching vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicle',
      });
    }
  }

  async getByPlate(req: Request, res: Response) {
    try {
      const { plate } = req.params;

      const vehicle = await prisma.vehicle.findUnique({
        where: { licensePlate: plate },
        include: {
          client: true,
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      res.json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      logger.error('Error fetching vehicle by plate:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicle',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { clientId, licensePlate, vin, brand, model, year, color, mileage, notes } = req.body;

      // Check if license plate already exists
      const existingPlate = await prisma.vehicle.findUnique({
        where: { licensePlate },
      });

      if (existingPlate) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle with this license plate already exists',
        });
      }

      // Check if VIN already exists (if provided)
      if (vin) {
        const existingVin = await prisma.vehicle.findUnique({
          where: { vin },
        });

        if (existingVin) {
          return res.status(409).json({
            success: false,
            message: 'Vehicle with this VIN already exists',
          });
        }
      }

      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          clientId,
          licensePlate,
          vin,
          brand,
          model,
          year,
          color,
          mileage,
          notes,
        },
        include: {
          client: true,
        },
      });

      logger.info(`New vehicle created: ${vehicle.id}`);

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle,
      });
    } catch (error) {
      logger.error('Error creating vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating vehicle',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { licensePlate, vin, brand, model, year, color, mileage, notes } = req.body;

      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      // Check if new license plate is already taken
      if (licensePlate && licensePlate !== existingVehicle.licensePlate) {
        const plateTaken = await prisma.vehicle.findUnique({
          where: { licensePlate },
        });

        if (plateTaken) {
          return res.status(409).json({
            success: false,
            message: 'License plate already in use',
          });
        }
      }

      // Check if new VIN is already taken
      if (vin && vin !== existingVehicle.vin) {
        const vinTaken = await prisma.vehicle.findUnique({
          where: { vin },
        });

        if (vinTaken) {
          return res.status(409).json({
            success: false,
            message: 'VIN already in use',
          });
        }
      }

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          licensePlate,
          vin,
          brand,
          model,
          year,
          color,
          mileage,
          notes,
        },
        include: {
          client: true,
        },
      });

      logger.info(`Vehicle updated: ${vehicle.id}`);

      res.json({
        success: true,
        message: 'Vehicle updated successfully',
        data: vehicle,
      });
    } catch (error) {
      logger.error('Error updating vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating vehicle',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if vehicle has related work orders
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }

      if (vehicle._count.workOrders > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete vehicle with work orders',
        });
      }

      await prisma.vehicle.delete({
        where: { id },
      });

      logger.info(`Vehicle deleted: ${id}`);

      res.json({
        success: true,
        message: 'Vehicle deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting vehicle',
      });
    }
  }

  async getWorkOrders(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [workOrders, total] = await Promise.all([
        prisma.workOrder.findMany({
          where: { vehicleId: id },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.workOrder.count({ where: { vehicleId: id } }),
      ]);

      res.json({
        success: true,
        data: workOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching vehicle work orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicle work orders',
      });
    }
  }

  async getServiceHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const workOrders = await prisma.workOrder.findMany({
        where: {
          vehicleId: id,
          status: 'COMPLETED',
        },
        orderBy: { completionDate: 'desc' },
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
      });

      const history = workOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.completionDate,
        mileage: order.vehicle?.mileage,
        description: order.description,
        services: order.services.map(s => s.service.name),
        parts: order.parts.map(p => p.part.name),
        totalCost: order.actualCost,
      }));

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error fetching service history:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching service history',
      });
    }
  }
}