import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { WorkOrderStatus, InvoiceStatus } from '../types/enums';

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      // Get date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));

      // Get total counts
      const [
        totalClients,
        totalVehicles,
        activeWorkOrders,
        lowStockItems,
        pendingInvoices,
        todayWorkOrders,
      ] = await Promise.all([
        prisma.client.count(),
        prisma.vehicle.count(),
        prisma.workOrder.count({
          where: {
            status: {
              in: ['DRAFT', 'PENDING', 'IN_PROGRESS'],
            },
          },
        }),
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM Part
          WHERE currentStock <= minStock AND isActive = 1
        `,
        prisma.invoice.count({
          where: {
            status: {
              in: ['DRAFT', 'SENT', 'OVERDUE'],
            },
          },
        }),
        prisma.workOrder.count({
          where: {
            createdAt: {
              gte: startOfToday,
            },
          },
        }),
      ]);

      // Get monthly revenue
      const monthlyInvoices = await prisma.invoice.findMany({
        where: {
          issueDate: {
            gte: startOfMonth,
          },
          status: 'PAID',
        },
        select: {
          total: true,
        },
      });

      const monthlyRevenue = monthlyInvoices.reduce(
        (sum, inv) => sum + Number(inv.total),
        0
      );

      // Get weekly growth
      const lastWeekStart = new Date(startOfWeek);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const [thisWeekRevenue, lastWeekRevenue] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            issueDate: { gte: startOfWeek },
            status: 'PAID',
          },
          _sum: { total: true },
        }),
        prisma.invoice.aggregate({
          where: {
            issueDate: { gte: lastWeekStart, lt: startOfWeek },
            status: 'PAID',
          },
          _sum: { total: true },
        }),
      ]);

      const weeklyGrowth =
        lastWeekRevenue._sum.total && Number(lastWeekRevenue._sum.total) > 0
          ? ((Number(thisWeekRevenue._sum.total || 0) -
              Number(lastWeekRevenue._sum.total)) /
              Number(lastWeekRevenue._sum.total)) *
            100
          : 0;

      // Get recent work orders
      const recentWorkOrders = await prisma.workOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          vehicle: true,
        },
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalClients,
            totalVehicles,
            activeWorkOrders,
            monthlyRevenue,
            lowStockItems: Number(lowStockItems[0]?.count || 0),
            pendingInvoices,
            todayWorkOrders,
            weeklyGrowth: Number(weeklyGrowth.toFixed(2)),
          },
          recentWorkOrders: recentWorkOrders.map(wo => ({
            id: wo.id,
            orderNumber: wo.orderNumber,
            clientName: wo.client.name,
            vehicleInfo: `${wo.vehicle.brand} ${wo.vehicle.model} - ${wo.vehicle.licensePlate}`,
            status: wo.status,
            description: wo.description,
            createdAt: wo.createdAt,
          })),
        },
      });
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
      });
    }
  }

  async getRevenueChart(req: Request, res: Response) {
    try {
      const { period = 'month' } = req.query;
      const now = new Date();
      let startDate: Date;
      let groupBy: string;

      switch (period) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          groupBy = 'day';
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          groupBy = 'month';
          break;
        case 'month':
        default:
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          groupBy = 'day';
      }

      const invoices = await prisma.invoice.findMany({
        where: {
          issueDate: { gte: startDate },
          status: 'PAID',
        },
        select: {
          issueDate: true,
          total: true,
        },
        orderBy: { issueDate: 'asc' },
      });

      // Group by period
      const revenueData = invoices.reduce((acc: any, inv) => {
        const date = new Date(inv.issueDate);
        let key: string;

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += Number(inv.total);

        return acc;
      }, {});

      const chartData = Object.entries(revenueData).map(([date, total]) => ({
        date,
        total,
      }));

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      logger.error('Error fetching revenue chart:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching revenue chart',
      });
    }
  }

  async getTopClients(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const clients = await prisma.client.findMany({
        take: Number(limit),
        include: {
          invoices: {
            where: { status: 'PAID' },
            select: { total: true },
          },
          _count: {
            select: {
              workOrders: true,
              vehicles: true,
            },
          },
        },
      });

      const topClients = clients
        .map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          totalRevenue: client.invoices.reduce(
            (sum, inv) => sum + Number(inv.total),
            0
          ),
          workOrderCount: client._count.workOrders,
          vehicleCount: client._count.vehicles,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, Number(limit));

      res.json({
        success: true,
        data: topClients,
      });
    } catch (error) {
      logger.error('Error fetching top clients:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching top clients',
      });
    }
  }

  async getWorkOrderStats(req: Request, res: Response) {
    try {
      const statusCounts = await prisma.workOrder.groupBy({
        by: ['status'],
        _count: true,
      });

      const stats = statusCounts.map(item => ({
        status: item.status,
        count: item._count,
      }));

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching work order stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching work order statistics',
      });
    }
  }
}