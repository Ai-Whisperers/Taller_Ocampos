import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class InventoryController {
  async getAllParts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, category, lowStock, supplierId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (search) {
        where.OR = [
          { code: { contains: String(search), mode: 'insensitive' } },
          { name: { contains: String(search), mode: 'insensitive' } },
          { brand: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      if (category) where.category = String(category);
      if (supplierId) where.supplierId = String(supplierId);

      if (lowStock === 'true') {
        where.OR = [
          { currentStock: { lte: prisma.part.fields.minStock } },
        ];
      }

      const [parts, total] = await Promise.all([
        prisma.part.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            supplier: true,
            _count: {
              select: {
                workOrderParts: true,
              },
            },
          },
        }),
        prisma.part.count({ where }),
      ]);

      res.json({
        success: true,
        data: parts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching parts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching parts',
      });
    }
  }

  async getPartById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const part = await prisma.part.findUnique({
        where: { id },
        include: {
          supplier: true,
          stockMovements: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found',
        });
      }

      res.json({
        success: true,
        data: part,
      });
    } catch (error) {
      logger.error('Error fetching part:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching part',
      });
    }
  }

  async createPart(req: Request, res: Response) {
    try {
      const {
        code,
        name,
        description,
        category,
        brand,
        costPrice,
        salePrice,
        currentStock,
        minStock,
        maxStock,
        location,
        supplierId,
      } = req.body;

      // Check if code already exists
      const existingPart = await prisma.part.findUnique({
        where: { code },
      });

      if (existingPart) {
        return res.status(409).json({
          success: false,
          message: 'Part with this code already exists',
        });
      }

      const part = await prisma.part.create({
        data: {
          code,
          name,
          description,
          category,
          brand,
          costPrice,
          salePrice,
          currentStock,
          minStock,
          maxStock,
          location,
          supplierId,
        },
        include: {
          supplier: true,
        },
      });

      // Create initial stock movement
      await prisma.stockMovement.create({
        data: {
          partId: part.id,
          type: 'IN',
          quantity: currentStock,
          previousStock: 0,
          currentStock,
          notes: 'Initial stock',
        },
      });

      logger.info(`New part created: ${part.code}`);

      res.status(201).json({
        success: true,
        message: 'Part created successfully',
        data: part,
      });
    } catch (error) {
      logger.error('Error creating part:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating part',
      });
    }
  }

  async updatePart(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        brand,
        costPrice,
        salePrice,
        minStock,
        maxStock,
        location,
        supplierId,
        isActive,
      } = req.body;

      const existingPart = await prisma.part.findUnique({
        where: { id },
      });

      if (!existingPart) {
        return res.status(404).json({
          success: false,
          message: 'Part not found',
        });
      }

      const part = await prisma.part.update({
        where: { id },
        data: {
          name,
          description,
          category,
          brand,
          costPrice,
          salePrice,
          minStock,
          maxStock,
          location,
          supplierId,
          isActive,
        },
        include: {
          supplier: true,
        },
      });

      logger.info(`Part updated: ${part.code}`);

      res.json({
        success: true,
        message: 'Part updated successfully',
        data: part,
      });
    } catch (error) {
      logger.error('Error updating part:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating part',
      });
    }
  }

  async deletePart(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const part = await prisma.part.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              workOrderParts: true,
            },
          },
        },
      });

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found',
        });
      }

      if (part._count.workOrderParts > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete part that has been used in work orders',
        });
      }

      await prisma.stockMovement.deleteMany({ where: { partId: id } });
      await prisma.part.delete({ where: { id } });

      logger.info(`Part deleted: ${part.code}`);

      res.json({
        success: true,
        message: 'Part deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting part:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting part',
      });
    }
  }

  async adjustStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantity, type, reference, notes } = req.body;

      const part = await prisma.part.findUnique({
        where: { id },
      });

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found',
        });
      }

      let newStock: number;

      if (type === 'IN') {
        newStock = part.currentStock + quantity;
      } else if (type === 'OUT') {
        if (part.currentStock < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock',
            currentStock: part.currentStock,
          });
        }
        newStock = part.currentStock - quantity;
      } else if (type === 'ADJUSTMENT') {
        newStock = quantity;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid adjustment type',
        });
      }

      // Update part stock
      await prisma.part.update({
        where: { id },
        data: { currentStock: newStock },
      });

      // Create stock movement record
      const movement = await prisma.stockMovement.create({
        data: {
          partId: id,
          type,
          quantity: type === 'ADJUSTMENT' ? quantity - part.currentStock : quantity,
          previousStock: part.currentStock,
          currentStock: newStock,
          reference,
          notes,
        },
      });

      logger.info(`Stock adjusted for part ${part.code}: ${part.currentStock} -> ${newStock}`);

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          part: { ...part, currentStock: newStock },
          movement,
        },
      });
    } catch (error) {
      logger.error('Error adjusting stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error adjusting stock',
      });
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where: { partId: id },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.stockMovement.count({ where: { partId: id } }),
      ]);

      res.json({
        success: true,
        data: movements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching stock movements:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching stock movements',
      });
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const parts = await prisma.$queryRaw`
        SELECT * FROM "Part"
        WHERE "currentStock" <= "minStock"
        AND "isActive" = true
        ORDER BY ("currentStock"::float / NULLIF("minStock", 0)) ASC
      `;

      res.json({
        success: true,
        data: parts,
      });
    } catch (error) {
      logger.error('Error fetching low stock items:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching low stock items',
      });
    }
  }

  async getAllSuppliers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' as const } },
              { email: { contains: String(search), mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                parts: true,
              },
            },
          },
        }),
        prisma.supplier.count({ where }),
      ]);

      res.json({
        success: true,
        data: suppliers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching suppliers',
      });
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const { name, taxId, email, phone, address, website, notes } = req.body;

      const supplier = await prisma.supplier.create({
        data: {
          name,
          taxId,
          email,
          phone,
          address,
          website,
          notes,
        },
      });

      logger.info(`New supplier created: ${supplier.name}`);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      logger.error('Error creating supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating supplier',
      });
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, taxId, email, phone, address, website, notes, isActive } = req.body;

      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          name,
          taxId,
          email,
          phone,
          address,
          website,
          notes,
          isActive,
        },
      });

      logger.info(`Supplier updated: ${supplier.name}`);

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      logger.error('Error updating supplier:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating supplier',
      });
    }
  }
}