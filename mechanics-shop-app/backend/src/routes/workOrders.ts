import { Router, Response } from 'express';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get all work orders for a shop
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        wo.*, 
        c.first_name || ' ' || c.last_name AS customer_name,
        c.phone AS customer_phone,
        v.year || ' ' || v.make || ' ' || v.model AS vehicle_info,
        v.license_plate,
        u1.first_name || ' ' || u1.last_name AS technician_name,
        u2.first_name || ' ' || u2.last_name AS service_writer_name
      FROM work_orders wo
      LEFT JOIN clients c ON wo.client_id = c.id
      LEFT JOIN vehicles v ON wo.vehicle_id = v.id
      LEFT JOIN users u1 ON wo.technician_id = u1.id
      LEFT JOIN users u2 ON wo.service_writer_id = u2.id
      WHERE wo.shop_id = $1
      ORDER BY wo.date_received DESC
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      workOrders: result.rows.map(row => ({
        id: row.id,
        workOrderId: row.work_order_id,
        clientId: row.client_id,
        vehicleId: row.vehicle_id,
        dateReceived: row.date_received,
        datePromised: row.date_promised,
        dateCompleted: row.date_completed,
        mileageIn: row.mileage_in,
        mileageOut: row.mileage_out,
        serviceWriterId: row.service_writer_id,
        technicianId: row.technician_id,
        customerComplaint: row.customer_complaint,
        servicesPerformed: row.services_performed,
        laborHours: parseFloat(row.labor_hours),
        laborCost: parseFloat(row.labor_cost),
        partsCost: parseFloat(row.parts_cost),
        taxAmount: parseFloat(row.tax_amount),
        totalCost: parseFloat(row.total_cost),
        status: row.status,
        authorizationAmount: parseFloat(row.authorization_amount),
        paymentStatus: row.payment_status,
        bayNumber: row.bay_number,
        priorityLevel: row.priority_level,
        notes: row.notes,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        vehicleInfo: row.vehicle_info,
        licensePlate: row.license_plate,
        technicianName: row.technician_name,
        serviceWriterName: row.service_writer_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create work order
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      clientId, vehicleId, datePromised, mileageIn, serviceWriterId, technicianId,
      customerComplaint, servicesPerformed, laborHours, laborCost, partsCost,
      taxAmount, authorizationAmount, bayNumber, priorityLevel, notes
    } = req.body;

    if (!clientId || !vehicleId) {
      return res.status(400).json({ error: 'Client and vehicle are required' });
    }

    // Generate work order ID
    const countQuery = await pool.query('SELECT COUNT(*) FROM work_orders WHERE shop_id = $1', [req.user.shopId]);
    const workOrderId = `WO${String(parseInt(countQuery.rows[0].count) + 1).padStart(3, '0')}`;

    const query = `
      INSERT INTO work_orders (
        shop_id, work_order_id, client_id, vehicle_id, date_promised, mileage_in,
        service_writer_id, technician_id, customer_complaint, services_performed,
        labor_hours, labor_cost, parts_cost, tax_amount, authorization_amount,
        bay_number, priority_level, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.shopId, workOrderId, clientId, vehicleId, datePromised, mileageIn,
      serviceWriterId, technicianId, customerComplaint, servicesPerformed,
      laborHours || 0, laborCost || 0, partsCost || 0, taxAmount || 0,
      authorizationAmount, bayNumber, priorityLevel || 'routine', notes
    ]);

    const row = result.rows[0];
    res.status(201).json({
      workOrder: {
        id: row.id,
        workOrderId: row.work_order_id,
        clientId: row.client_id,
        vehicleId: row.vehicle_id,
        dateReceived: row.date_received,
        datePromised: row.date_promised,
        dateCompleted: row.date_completed,
        mileageIn: row.mileage_in,
        mileageOut: row.mileage_out,
        serviceWriterId: row.service_writer_id,
        technicianId: row.technician_id,
        customerComplaint: row.customer_complaint,
        servicesPerformed: row.services_performed,
        laborHours: parseFloat(row.labor_hours),
        laborCost: parseFloat(row.labor_cost),
        partsCost: parseFloat(row.parts_cost),
        taxAmount: parseFloat(row.tax_amount),
        totalCost: parseFloat(row.total_cost),
        status: row.status,
        authorizationAmount: parseFloat(row.authorization_amount),
        paymentStatus: row.payment_status,
        bayNumber: row.bay_number,
        priorityLevel: row.priority_level,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;