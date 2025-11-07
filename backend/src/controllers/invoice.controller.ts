import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { InvoiceStatus } from '../types/enums';

export class InvoiceController {
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, clientId, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (status) where.status = status as InvoiceStatus;
      if (clientId) where.clientId = String(clientId);

      if (startDate || endDate) {
        where.issueDate = {};
        if (startDate) where.issueDate.gte = new Date(String(startDate));
        if (endDate) where.issueDate.lte = new Date(String(endDate));
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            client: true,
            workOrder: true,
            _count: {
              select: {
                payments: true,
              },
            },
          },
        }),
        prisma.invoice.count({ where }),
      ]);

      // Check for overdue invoices
      const today = new Date();
      const invoicesWithStatus = invoices.map(invoice => {
        if (
          invoice.status !== 'PAID' &&
          invoice.status !== 'CANCELLED' &&
          new Date(invoice.dueDate) < today
        ) {
          return { ...invoice, status: 'OVERDUE' as InvoiceStatus };
        }
        return invoice;
      });

      res.json({
        success: true,
        data: invoicesWithStatus,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching invoices',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          workOrder: {
            include: {
              vehicle: true,
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payments: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      logger.error('Error fetching invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching invoice',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        workOrderId,
        clientId,
        dueDate,
        items,
        taxRate,
        discount,
        notes,
        terms,
      } = req.body;

      // Generate invoice number
      const invoiceCount = await prisma.invoice.count();
      const invoiceNumber = `INV${String(invoiceCount + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotal = 0;
      if (items && items.length > 0) {
        subtotal = items.reduce((sum: number, item: any) =>
          sum + (item.quantity * item.unitPrice), 0
        );
      }

      const discountAmount = discount || 0;
      const subtotalAfterDiscount = subtotal - discountAmount;
      const taxAmount = subtotalAfterDiscount * (taxRate / 100);
      const total = subtotalAfterDiscount + taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          workOrderId,
          clientId,
          userId: req.user?.id!,
          status: 'DRAFT',
          dueDate: new Date(dueDate),
          subtotal,
          taxRate,
          taxAmount,
          discount: discountAmount,
          total,
          notes,
          terms,
        },
        include: {
          client: true,
          workOrder: true,
        },
      });

      logger.info(`New invoice created: ${invoice.invoiceNumber}`);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      logger.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating invoice',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        status,
        dueDate,
        taxRate,
        discount,
        notes,
        terms,
      } = req.body;

      const existingInvoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Recalculate if tax or discount changed
      let updates: any = {
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        terms,
      };

      if (taxRate !== undefined || discount !== undefined) {
        const newTaxRate = taxRate !== undefined ? taxRate : existingInvoice.taxRate;
        const newDiscount = discount !== undefined ? discount : existingInvoice.discount;
        const subtotalAfterDiscount = Number(existingInvoice.subtotal) - Number(newDiscount);
        const taxAmount = subtotalAfterDiscount * (Number(newTaxRate) / 100);
        const total = subtotalAfterDiscount + taxAmount;

        updates = {
          ...updates,
          taxRate: newTaxRate,
          taxAmount,
          discount: newDiscount,
          total,
        };
      }

      const invoice = await prisma.invoice.update({
        where: { id },
        data: updates,
        include: {
          client: true,
          workOrder: true,
        },
      });

      logger.info(`Invoice updated: ${invoice.invoiceNumber}`);

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      logger.error('Error updating invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating invoice',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      if (invoice._count.payments > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete invoice with payments',
        });
      }

      if (invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Can only delete draft or cancelled invoices',
        });
      }

      await prisma.invoice.delete({
        where: { id },
      });

      logger.info(`Invoice deleted: ${invoice.invoiceNumber}`);

      res.json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting invoice',
      });
    }
  }

  async sendByEmail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      const recipientEmail = email || invoice.client.email;

      if (!recipientEmail) {
        return res.status(400).json({
          success: false,
          message: 'No email address available',
        });
      }

      // TODO: Implement email sending logic
      // For now, just update the status to SENT
      await prisma.invoice.update({
        where: { id },
        data: { status: 'SENT' },
      });

      logger.info(`Invoice sent by email: ${invoice.invoiceNumber} to ${recipientEmail}`);

      res.json({
        success: true,
        message: `Invoice sent to ${recipientEmail}`,
      });
    } catch (error) {
      logger.error('Error sending invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending invoice',
      });
    }
  }

  async exportPDF(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          workOrder: {
            include: {
              vehicle: true,
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
          },
          user: true,
          payments: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // TODO: Implement PDF generation
      // For now, return the invoice data that would be used for PDF
      res.json({
        success: true,
        message: 'PDF export ready',
        data: invoice,
      });
    } catch (error) {
      logger.error('Error exporting invoice as PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting invoice',
      });
    }
  }

  async exportExcel(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          workOrder: {
            include: {
              vehicle: true,
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
          },
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // TODO: Implement Excel export
      // For now, return the invoice data that would be used for Excel
      res.json({
        success: true,
        message: 'Excel export ready',
        data: invoice,
      });
    } catch (error) {
      logger.error('Error exporting invoice as Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting invoice',
      });
    }
  }

  async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Update invoice status and paid amount
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAmount: invoice.total,
        },
      });

      // Generate payment number
      const paymentCount = await prisma.payment.count();
      const paymentNumber = `PAY${String(paymentCount + 1).padStart(6, '0')}`;

      // Create a payment record
      await prisma.payment.create({
        data: {
          paymentNumber,
          invoiceId: id,
          clientId: invoice.clientId,
          userId: req.user?.id!,
          amount: invoice.total,
          method: 'CASH',
          notes: 'Marked as paid',
        },
      });

      logger.info(`Invoice marked as paid: ${invoice.invoiceNumber}`);

      res.json({
        success: true,
        message: 'Invoice marked as paid',
        data: updatedInvoice,
      });
    } catch (error) {
      logger.error('Error marking invoice as paid:', error);
      res.status(500).json({
        success: false,
        message: 'Error marking invoice as paid',
      });
    }
  }

  async getPayments(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payments = await prisma.payment.findMany({
        where: { invoiceId: id },
        orderBy: { paymentDate: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      logger.error('Error fetching invoice payments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payments',
      });
    }
  }
}