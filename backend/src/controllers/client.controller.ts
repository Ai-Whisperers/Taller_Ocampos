import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export class ClientController {
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' as const } },
              { email: { contains: String(search), mode: 'insensitive' as const } },
              { phone: { contains: String(search), mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take: Number(limit),
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
        }),
        prisma.client.count({ where }),
      ]);

      res.json({
        success: true,
        data: clients,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching clients:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching clients',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          vehicles: true,
          workOrders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          invoices: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      res.json({
        success: true,
        data: client,
      });
    } catch (error) {
      logger.error('Error fetching client:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching client',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, email, phone, address, taxId, notes } = req.body;

      // Check if email already exists
      if (email) {
        const existingClient = await prisma.client.findUnique({
          where: { email },
        });

        if (existingClient) {
          return res.status(409).json({
            success: false,
            message: 'Client with this email already exists',
          });
        }
      }

      const client = await prisma.client.create({
        data: {
          name,
          email,
          phone,
          address,
          taxId,
          notes,
        },
      });

      logger.info(`New client created: ${client.id}`);

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: client,
      });
    } catch (error) {
      logger.error('Error creating client:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating client',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, phone, address, taxId, notes } = req.body;

      // Check if client exists
      const existingClient = await prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      // Check if new email is already taken
      if (email && email !== existingClient.email) {
        const emailTaken = await prisma.client.findUnique({
          where: { email },
        });

        if (emailTaken) {
          return res.status(409).json({
            success: false,
            message: 'Email already in use',
          });
        }
      }

      const client = await prisma.client.update({
        where: { id },
        data: {
          name,
          email,
          phone,
          address,
          taxId,
          notes,
        },
      });

      logger.info(`Client updated: ${client.id}`);

      res.json({
        success: true,
        message: 'Client updated successfully',
        data: client,
      });
    } catch (error) {
      logger.error('Error updating client:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating client',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if client has related records
      const client = await prisma.client.findUnique({
        where: { id },
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

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      if (client._count.vehicles > 0 || client._count.workOrders > 0 || client._count.invoices > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete client with related records',
        });
      }

      await prisma.client.delete({
        where: { id },
      });

      logger.info(`Client deleted: ${id}`);

      res.json({
        success: true,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting client:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting client',
      });
    }
  }

  async getVehicles(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vehicles = await prisma.vehicle.findMany({
        where: { clientId: id },
        include: {
          _count: {
            select: {
              workOrders: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      logger.error('Error fetching client vehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching client vehicles',
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
          where: { clientId: id },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.workOrder.count({ where: { clientId: id } }),
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
      logger.error('Error fetching client work orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching client work orders',
      });
    }
  }

  async getInvoices(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: { clientId: id },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            workOrder: true,
            payments: true,
          },
        }),
        prisma.invoice.count({ where: { clientId: id } }),
      ]);

      res.json({
        success: true,
        data: invoices,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching client invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching client invoices',
      });
    }
  }
}