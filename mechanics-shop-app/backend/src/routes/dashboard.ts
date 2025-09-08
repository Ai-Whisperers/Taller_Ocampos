import { Router, Response } from 'express';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    // Get various statistics
    const [
      totalClients,
      totalVehicles,
      pendingWorkOrders,
      completedWorkOrders,
      monthlyRevenue,
      todayAppointments
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM clients WHERE shop_id = $1 AND is_active = true', [req.user.shopId]),
      pool.query('SELECT COUNT(*) FROM vehicles WHERE shop_id = $1 AND is_active = true', [req.user.shopId]),
      pool.query('SELECT COUNT(*) FROM work_orders WHERE shop_id = $1 AND status IN (\'scheduled\', \'in_progress\', \'waiting_parts\', \'waiting_approval\')', [req.user.shopId]),
      pool.query('SELECT COUNT(*) FROM work_orders WHERE shop_id = $1 AND status IN (\'completed\', \'picked_up\')', [req.user.shopId]),
      pool.query('SELECT COALESCE(SUM(total_cost), 0) FROM work_orders WHERE shop_id = $1 AND date_received >= date_trunc(\'month\', CURRENT_DATE)', [req.user.shopId]),
      pool.query('SELECT COUNT(*) FROM schedules WHERE shop_id = $1 AND appointment_date = CURRENT_DATE', [req.user.shopId])
    ]);

    // Get recent work orders
    const recentWorkOrders = await pool.query(`
      SELECT 
        wo.work_order_id,
        wo.status,
        wo.total_cost,
        wo.date_received,
        c.first_name || ' ' || c.last_name AS customer_name,
        v.year || ' ' || v.make || ' ' || v.model AS vehicle_info
      FROM work_orders wo
      LEFT JOIN clients c ON wo.client_id = c.id
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.shop_id = $1
      ORDER BY wo.date_received DESC
      LIMIT 10
    `, [req.user.shopId]);

    res.json({
      stats: {
        totalClients: parseInt(totalClients.rows[0].count),
        totalVehicles: parseInt(totalVehicles.rows[0].count),
        pendingWorkOrders: parseInt(pendingWorkOrders.rows[0].count),
        completedWorkOrders: parseInt(completedWorkOrders.rows[0].count),
        monthlyRevenue: parseFloat(monthlyRevenue.rows[0].coalesce || '0'),
        todayAppointments: parseInt(todayAppointments.rows[0].count)
      },
      recentWorkOrders: recentWorkOrders.rows.map(row => ({
        workOrderId: row.work_order_id,
        status: row.status,
        totalCost: parseFloat(row.total_cost || '0'),
        dateReceived: row.date_received,
        customerName: row.customer_name,
        vehicleInfo: row.vehicle_info
      }))
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;