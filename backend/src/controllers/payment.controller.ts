import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '../types/enums';

export class PaymentController {
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, clientId, invoiceId, method, startDate, endDate } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (clientId) where.clientId = String(clientId);
      if (invoiceId) where.invoiceId = String(invoiceId);
      if (method) where.method = method as PaymentMethod;

      if (startDate || endDate) {
        where.paymentDate = {};
        if (startDate) where.paymentDate.gte = new Date(String(startDate));
        if (endDate) where.paymentDate.lte = new Date(String(endDate));
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { paymentDate: 'desc' },
          include: {
            client: true,
            invoice: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payments',
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          client: true,
          invoice: {
            include: {
              workOrder: {
                include: {
                  vehicle: true,
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
        },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment',
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        invoiceId,
        amount,
        method,
        reference,
        notes,
        paymentDate,
      } = req.body;

      // Verify invoice exists and check remaining balance
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      const remainingBalance = Number(invoice.total) - Number(invoice.paidAmount);

      if (amount > remainingBalance) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount exceeds invoice balance',
          remainingBalance,
        });
      }

      // Create payment and update invoice in a transaction
      const payment = await prisma.$transaction(async (tx) => {
        // Generate payment number
        const paymentCount = await tx.payment.count();
        const paymentNumber = `PAY${String(paymentCount + 1).padStart(6, '0')}`;

        const newPayment = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId,
            clientId: invoice.clientId,
            userId: req.user?.id!,
            amount,
            method,
            reference,
            notes,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          },
          include: {
            client: true,
            invoice: true,
          },
        });

        // Update invoice paid amount and status
        const newPaidAmount = Number(invoice.paidAmount) + amount;
        const invoiceStatus = newPaidAmount >= Number(invoice.total)
          ? InvoiceStatus.PAID
          : newPaidAmount > 0
          ? InvoiceStatus.PARTIALLY_PAID
          : invoice.status;

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: invoiceStatus,
          },
        });

        return newPayment;
      });

      logger.info(`New payment created: ${payment.paymentNumber}`);

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
      });
    } catch (error) {
      logger.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating payment',
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        amount,
        method,
        reference,
        notes,
        paymentDate,
      } = req.body;

      const existingPayment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
        },
      });

      if (!existingPayment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // If amount is changing, verify it doesn't exceed invoice balance
      if (amount && amount !== existingPayment.amount) {
        const invoice = existingPayment.invoice;
        const otherPayments = await prisma.payment.aggregate({
          where: {
            invoiceId: invoice.id,
            id: { not: id },
          },
          _sum: {
            amount: true,
          },
        });

        const totalOtherPayments = otherPayments._sum.amount || 0;
        const newTotal = Number(totalOtherPayments) + amount;

        if (newTotal > Number(invoice.total)) {
          return res.status(400).json({
            success: false,
            message: 'Total payments would exceed invoice amount',
          });
        }
      }

      const payment = await prisma.payment.update({
        where: { id },
        data: {
          amount,
          method,
          reference,
          notes,
          paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        },
        include: {
          client: true,
          invoice: true,
        },
      });

      // Recalculate invoice paid amount if amount changed
      if (amount && amount !== existingPayment.amount) {
        const allPayments = await prisma.payment.aggregate({
          where: { invoiceId: existingPayment.invoiceId },
          _sum: { amount: true },
        });

        const totalPaid = allPayments._sum.amount || 0;
        const invoice = existingPayment.invoice;
        const invoiceStatus = totalPaid >= Number(invoice.total)
          ? InvoiceStatus.PAID
          : totalPaid > 0
          ? InvoiceStatus.PARTIALLY_PAID
          : InvoiceStatus.SENT;

        await prisma.invoice.update({
          where: { id: existingPayment.invoiceId },
          data: {
            paidAmount: totalPaid,
            status: invoiceStatus,
          },
        });
      }

      logger.info(`Payment updated: ${payment.paymentNumber}`);

      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: payment,
      });
    } catch (error) {
      logger.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating payment',
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: true,
        },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // Delete payment
      await prisma.payment.delete({
        where: { id },
      });

      // Update invoice paid amount and status
      const remainingPayments = await prisma.payment.aggregate({
        where: { invoiceId: payment.invoiceId },
        _sum: { amount: true },
      });

      const totalPaid = remainingPayments._sum.amount || 0;
      const invoice = payment.invoice;
      const invoiceStatus = totalPaid >= Number(invoice.total)
        ? InvoiceStatus.PAID
        : totalPaid > 0
        ? InvoiceStatus.PARTIALLY_PAID
        : InvoiceStatus.SENT;

      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: totalPaid,
          status: invoiceStatus,
        },
      });

      logger.info(`Payment deleted: ${payment.paymentNumber}`);

      res.json({
        success: true,
        message: 'Payment deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting payment',
      });
    }
  }

  async getReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          client: true,
          invoice: {
            include: {
              workOrder: {
                include: {
                  vehicle: true,
                },
              },
            },
          },
          user: true,
        },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
      }

      // TODO: Generate actual receipt PDF
      // For now, return payment data
      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error generating receipt:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating receipt',
      });
    }
  }

  async getDailySummary(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(String(date)) : new Date();

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const payments = await prisma.payment.groupBy({
        by: ['method'],
        where: {
          paymentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });

      const total = payments.reduce((sum, p) => sum + Number(p._sum.amount || 0), 0);

      res.json({
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          total,
          byMethod: payments,
        },
      });
    } catch (error) {
      logger.error('Error fetching daily payment summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching daily summary',
      });
    }
  }

  async getMonthlySummary(req: Request, res: Response) {
    try {
      const { year, month } = req.query;
      const targetYear = year ? Number(year) : new Date().getFullYear();
      const targetMonth = month ? Number(month) - 1 : new Date().getMonth();

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const [payments, dailyPayments] = await Promise.all([
        prisma.payment.groupBy({
          by: ['method'],
          where: {
            paymentDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            amount: true,
            paymentDate: true,
          },
        }),
      ]);

      const total = payments.reduce((sum, p) => sum + Number(p._sum.amount || 0), 0);

      // Group by day
      const dailyTotals = dailyPayments.reduce((acc: any, payment) => {
        const day = new Date(payment.paymentDate).getDate();
        acc[day] = (acc[day] || 0) + Number(payment.amount);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          year: targetYear,
          month: targetMonth + 1,
          total,
          byMethod: payments,
          byDay: dailyTotals,
        },
      });
    } catch (error) {
      logger.error('Error fetching monthly payment summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching monthly summary',
      });
    }
  }
}