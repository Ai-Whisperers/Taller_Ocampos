import { Router, Response } from 'express';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get revenue analytics
router.get('/revenue', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const { period = 'monthly', year, month } = req.query;

    let dateFilter = '';
    let groupBy = '';
    let selectDate = '';

    if (period === 'daily' && year && month) {
      dateFilter = `AND EXTRACT(YEAR FROM ft.invoice_date) = $2 AND EXTRACT(MONTH FROM ft.invoice_date) = $3`;
      groupBy = 'DATE(ft.invoice_date)';
      selectDate = 'DATE(ft.invoice_date) as period';
    } else if (period === 'monthly' && year) {
      dateFilter = `AND EXTRACT(YEAR FROM ft.invoice_date) = $2`;
      groupBy = 'EXTRACT(MONTH FROM ft.invoice_date)';
      selectDate = 'EXTRACT(MONTH FROM ft.invoice_date) as period';
    } else {
      // Default to monthly for current year
      dateFilter = `AND EXTRACT(YEAR FROM ft.invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)`;
      groupBy = 'EXTRACT(MONTH FROM ft.invoice_date)';
      selectDate = 'EXTRACT(MONTH FROM ft.invoice_date) as period';
    }

    const query = `
      SELECT 
        ${selectDate},
        COUNT(*) as transaction_count,
        SUM(ft.labor_cost) as total_labor,
        SUM(ft.parts_cost) as total_parts,
        SUM(ft.total_amount) as total_revenue,
        SUM(ft.amount_paid) as total_collected,
        SUM(ft.balance_due) as total_outstanding
      FROM financial_transactions ft
      WHERE ft.shop_id = $1 ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY period
    `;

    const queryParams = [req.user.shopId];
    if (year) queryParams.push(year as string);
    if (month) queryParams.push(month as string);

    const result = await pool.query(query, queryParams);

    res.json({
      revenueData: result.rows.map(row => ({
        period: row.period,
        transactionCount: parseInt(row.transaction_count),
        totalLabor: parseFloat(row.total_labor || 0),
        totalParts: parseFloat(row.total_parts || 0),
        totalRevenue: parseFloat(row.total_revenue || 0),
        totalCollected: parseFloat(row.total_collected || 0),
        totalOutstanding: parseFloat(row.balance_due || 0)
      }))
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status analytics
router.get('/payments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        payment_status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount,
        SUM(balance_due) as total_outstanding
      FROM financial_transactions 
      WHERE shop_id = $1
        AND invoice_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY payment_status
      ORDER BY payment_status
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      paymentData: result.rows.map(row => ({
        status: row.payment_status,
        count: parseInt(row.count),
        totalAmount: parseFloat(row.total_amount || 0),
        totalOutstanding: parseFloat(row.total_outstanding || 0)
      }))
    });
  } catch (error) {
    console.error('Payment analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get service analytics
router.get('/services', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        wo.status,
        COUNT(*) as count,
        AVG(wo.total_cost) as avg_cost,
        SUM(wo.total_cost) as total_revenue,
        AVG(wo.labor_hours) as avg_labor_hours
      FROM work_orders wo
      WHERE wo.shop_id = $1
        AND wo.date_received >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY wo.status
      ORDER BY count DESC
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      serviceData: result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        avgCost: parseFloat(row.avg_cost || 0),
        totalRevenue: parseFloat(row.total_revenue || 0),
        avgLaborHours: parseFloat(row.avg_labor_hours || 0)
      }))
    });
  } catch (error) {
    console.error('Service analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top clients
router.get('/top-clients', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const { limit = 10 } = req.query;

    const query = `
      SELECT 
        c.id,
        c.first_name || ' ' || c.last_name as client_name,
        c.company_name,
        COUNT(ft.id) as transaction_count,
        SUM(ft.total_amount) as total_spent,
        AVG(ft.total_amount) as avg_transaction,
        MAX(ft.invoice_date) as last_service
      FROM clients c
      JOIN financial_transactions ft ON c.id = ft.client_id
      WHERE c.shop_id = $1
        AND ft.invoice_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY c.id, c.first_name, c.last_name, c.company_name
      ORDER BY total_spent DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [req.user.shopId, limit]);

    res.json({
      topClients: result.rows.map(row => ({
        id: row.id,
        clientName: row.client_name,
        companyName: row.company_name,
        transactionCount: parseInt(row.transaction_count),
        totalSpent: parseFloat(row.total_spent || 0),
        avgTransaction: parseFloat(row.avg_transaction || 0),
        lastService: row.last_service
      }))
    });
  } catch (error) {
    console.error('Top clients analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profit analysis
router.get('/profit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    // Get parts cost analysis
    const partsQuery = `
      SELECT 
        EXTRACT(MONTH FROM wo.date_received) as month,
        SUM(wop.quantity_used * pi.cost_price) as parts_cost,
        SUM(wop.total_cost) as parts_revenue
      FROM work_orders wo
      JOIN work_order_parts wop ON wo.id = wop.work_order_id
      JOIN parts_inventory pi ON wop.part_id = pi.id
      WHERE wo.shop_id = $1
        AND wo.date_received >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM wo.date_received)
      ORDER BY month
    `;

    // Get labor analysis
    const laborQuery = `
      SELECT 
        EXTRACT(MONTH FROM wo.date_received) as month,
        SUM(wo.labor_cost) as labor_revenue,
        SUM(wo.labor_hours) as labor_hours,
        AVG(s.labor_rate) as avg_labor_rate
      FROM work_orders wo
      JOIN shops s ON wo.shop_id = s.id
      WHERE wo.shop_id = $1
        AND wo.date_received >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM wo.date_received), s.labor_rate
      ORDER BY month
    `;

    const [partsResult, laborResult] = await Promise.all([
      pool.query(partsQuery, [req.user.shopId]),
      pool.query(laborQuery, [req.user.shopId])
    ]);

    res.json({
      profitData: {
        partsProfitByMonth: partsResult.rows.map(row => ({
          month: parseInt(row.month),
          cost: parseFloat(row.parts_cost || 0),
          revenue: parseFloat(row.parts_revenue || 0),
          profit: parseFloat(row.parts_revenue || 0) - parseFloat(row.parts_cost || 0),
          margin: parseFloat(row.parts_revenue) > 0 ? 
            ((parseFloat(row.parts_revenue) - parseFloat(row.parts_cost)) / parseFloat(row.parts_revenue) * 100) : 0
        })),
        laborProfitByMonth: laborResult.rows.map(row => ({
          month: parseInt(row.month),
          revenue: parseFloat(row.labor_revenue || 0),
          hours: parseFloat(row.labor_hours || 0),
          avgRate: parseFloat(row.avg_labor_rate || 0),
          // Assuming 60% of labor rate is actual profit after overhead
          profit: parseFloat(row.labor_revenue || 0) * 0.6
        }))
      }
    });
  } catch (error) {
    console.error('Profit analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue invoices
router.get('/overdue', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        ft.id,
        ft.invoice_number,
        ft.invoice_date,
        ft.due_date,
        ft.total_amount,
        ft.balance_due,
        c.first_name || ' ' || c.last_name as client_name,
        c.phone,
        c.email,
        CURRENT_DATE - ft.due_date as days_overdue
      FROM financial_transactions ft
      JOIN clients c ON ft.client_id = c.id
      WHERE ft.shop_id = $1
        AND ft.payment_status IN ('pending', 'partial')
        AND ft.due_date < CURRENT_DATE
        AND ft.balance_due > 0
      ORDER BY ft.due_date ASC
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      overdueInvoices: result.rows.map(row => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        invoiceDate: row.invoice_date,
        dueDate: row.due_date,
        totalAmount: parseFloat(row.total_amount),
        balanceDue: parseFloat(row.balance_due),
        clientName: row.client_name,
        clientPhone: row.phone,
        clientEmail: row.email,
        daysOverdue: parseInt(row.days_overdue)
      }))
    });
  } catch (error) {
    console.error('Overdue invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;