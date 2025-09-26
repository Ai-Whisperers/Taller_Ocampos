import { Request, Response } from 'express';
import { PrismaClient, WorkOrderStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class WorkOrderController {
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, clientId, vehicleId, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status) where.status = status as WorkOrderStatus;
      if (clientId) where.clientId = String(clientId);
      if (vehicleId) where.vehicleId = String(vehicleId);

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(String(startDate));
        if (endDate) where.createdAt.lte = new Date(String(endDate));
      }

      const [workOrders, total] = await Promise.all([
        prisma.workOrder.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: true,
            vehicle: true,
            user: {
              select: { id: true, name: true },
            },
            _count: {
              select: {
                services: true,
                parts: true,
              },
            },
          },
        }),
        prisma.workOrder.count({ where }),
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
      logger.error('Error fetching work orders:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching work orders',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          client: true,
          vehicle: true,
          user: true,
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
          invoices: true,
          attachments: true,
        },
      });

      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found',
        });
      }

      res.json({
        success: true,
        data: workOrder,
      });
    } catch (error) {
      logger.error('Error fetching work order:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching work order',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        clientId,
        vehicleId,
        description,
        diagnostics,
        estimatedHours,
        laborRate,
        notes,
        internalNotes,
      } = req.body;

      const userId = req.user?.id;

      // Generate order number
      const orderCount = await prisma.workOrder.count();
      const orderNumber = `WO${String(orderCount + 1).padStart(6, '0')}`;

      // Calculate estimated cost
      const estimatedCost = estimatedHours ? estimatedHours * laborRate : null;

      const workOrder = await prisma.workOrder.create({
        data: {
          orderNumber,
          clientId,
          vehicleId,
          userId: userId!,
          description,
          diagnostics,
          estimatedHours,
          laborRate,
          estimatedCost,
          notes,
          internalNotes,
          status: 'DRAFT',
        },
        include: {
          client: true,
          vehicle: true,
        },
      });

      logger.info(`New work order created: ${workOrder.orderNumber}`);

      res.status(201).json({
        success: true,
        message: 'Work order created successfully',
        data: workOrder,
      });
    } catch (error) {
      logger.error('Error creating work order:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating work order',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        status,
        description,
        diagnostics,
        estimatedHours,
        actualHours,
        laborRate,
        notes,
        internalNotes,
      } = req.body;

      const existingOrder = await prisma.workOrder.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found',
        });
      }

      // Calculate costs
      const estimatedCost = estimatedHours && laborRate ? estimatedHours * laborRate : existingOrder.estimatedCost;
      const actualCost = actualHours && laborRate ? actualHours * laborRate : existingOrder.actualCost;

      // Update dates based on status
      const updates: any = {
        status,
        description,
        diagnostics,
        estimatedHours,
        actualHours,
        laborRate,
        estimatedCost,
        actualCost,
        notes,
        internalNotes,
      };

      if (status === 'IN_PROGRESS' && !existingOrder.startDate) {
        updates.startDate = new Date();
      }

      if ((status === 'COMPLETED' || status === 'READY_FOR_PICKUP') && !existingOrder.completionDate) {
        updates.completionDate = new Date();
      }

      const workOrder = await prisma.workOrder.update({
        where: { id },
        data: updates,
        include: {
          client: true,
          vehicle: true,
        },
      });

      logger.info(`Work order updated: ${workOrder.orderNumber}`);

      res.json({
        success: true,
        message: 'Work order updated successfully',
        data: workOrder,
      });
    } catch (error) {
      logger.error('Error updating work order:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating work order',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              invoices: true,
            },
          },
        },
      });

      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found',
        });
      }

      if (workOrder._count.invoices > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete work order with invoices',
        });
      }

      // Delete related records first
      await prisma.workOrderService.deleteMany({ where: { workOrderId: id } });
      await prisma.workOrderPart.deleteMany({ where: { workOrderId: id } });
      await prisma.attachment.deleteMany({ where: { workOrderId: id } });

      await prisma.workOrder.delete({
        where: { id },
      });

      logger.info(`Work order deleted: ${workOrder.orderNumber}`);

      res.json({
        success: true,
        message: 'Work order deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting work order:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting work order',
      });
    }
  }

  async addService(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { serviceId, quantity, unitPrice, discount, notes } = req.body;

      const total = quantity * unitPrice - (discount || 0);

      const workOrderService = await prisma.workOrderService.create({
        data: {
          workOrderId: id,
          serviceId,
          quantity,
          unitPrice,
          discount,
          total,
          notes,
        },
        include: {
          service: true,
        },
      });

      // Update work order estimated cost
      await this.recalculateWorkOrderCost(id);

      res.status(201).json({
        success: true,
        message: 'Service added to work order',
        data: workOrderService,
      });
    } catch (error) {
      logger.error('Error adding service to work order:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding service',
      });
    }
  }

  async addPart(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { partId, quantity, unitPrice, discount, notes } = req.body;

      // Check if part has enough stock
      const part = await prisma.part.findUnique({
        where: { id: partId },
      });

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found',
        });
      }

      if (part.currentStock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock',
          available: part.currentStock,
        });
      }

      const total = quantity * unitPrice - (discount || 0);

      const workOrderPart = await prisma.workOrderPart.create({
        data: {
          workOrderId: id,
          partId,
          quantity,
          unitPrice,
          discount,
          total,
          notes,
        },
        include: {
          part: true,
        },
      });

      // Update part stock
      await prisma.part.update({
        where: { id: partId },
        data: {
          currentStock: {
            decrement: quantity,
          },
        },
      });

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          partId,
          type: 'OUT',
          quantity,
          previousStock: part.currentStock,
          currentStock: part.currentStock - quantity,
          reference: `WO-${id}`,
          notes: `Used in work order`,
        },
      });

      // Update work order cost
      await this.recalculateWorkOrderCost(id);

      res.status(201).json({
        success: true,
        message: 'Part added to work order',
        data: workOrderPart,
      });
    } catch (error) {
      logger.error('Error adding part to work order:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding part',
      });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updates: any = { status };

      if (status === 'IN_PROGRESS') {
        updates.startDate = new Date();
      }

      if (status === 'COMPLETED' || status === 'READY_FOR_PICKUP') {
        updates.completionDate = new Date();
      }

      const workOrder = await prisma.workOrder.update({
        where: { id },
        data: updates,
      });

      logger.info(`Work order status updated: ${workOrder.orderNumber} -> ${status}`);

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: workOrder,
      });
    } catch (error) {
      logger.error('Error updating work order status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating status',
      });
    }
  }

  async generateInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const workOrder = await prisma.workOrder.findUnique({
        where: { id },
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

      if (!workOrder) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found',
        });
      }

      // Calculate totals
      const servicesTotal = workOrder.services.reduce((sum, s) => sum + Number(s.total), 0);
      const partsTotal = workOrder.parts.reduce((sum, p) => sum + Number(p.total), 0);
      const laborTotal = Number(workOrder.actualHours || workOrder.estimatedHours || 0) * Number(workOrder.laborRate);
      const subtotal = servicesTotal + partsTotal + laborTotal;
      const taxRate = 0.21; // 21% IVA
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Generate invoice number
      const invoiceCount = await prisma.invoice.count();
      const invoiceNumber = `INV${String(invoiceCount + 1).padStart(6, '0')}`;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          workOrderId: id,
          clientId: workOrder.clientId,
          userId: req.user?.id!,
          status: 'DRAFT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          subtotal,
          taxRate: taxRate * 100,
          taxAmount,
          total,
        },
      });

      logger.info(`Invoice generated from work order: ${invoice.invoiceNumber}`);

      res.status(201).json({
        success: true,
        message: 'Invoice generated successfully',
        data: invoice,
      });
    } catch (error) {
      logger.error('Error generating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating invoice',
      });
    }
  }

  private async recalculateWorkOrderCost(workOrderId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        services: true,
        parts: true,
      },
    });

    if (!workOrder) return;

    const servicesTotal = workOrder.services.reduce((sum, s) => sum + Number(s.total), 0);
    const partsTotal = workOrder.parts.reduce((sum, p) => sum + Number(p.total), 0);
    const laborTotal = Number(workOrder.actualHours || workOrder.estimatedHours || 0) * Number(workOrder.laborRate);
    const totalCost = servicesTotal + partsTotal + laborTotal;

    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        actualCost: totalCost,
      },
    });
  }
}