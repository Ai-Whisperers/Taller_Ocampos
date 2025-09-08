import { Router, Response } from 'express';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get all vehicles for a shop
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT v.*, c.first_name, c.last_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.shop_id = $1 AND v.is_active = true
      ORDER BY v.created_at DESC
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      vehicles: result.rows.map(row => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        clientId: row.client_id,
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        currentMileage: row.current_mileage,
        engineType: row.engine_type,
        transmission: row.transmission,
        color: row.color,
        lastServiceDate: row.last_service_date,
        nextServiceDue: row.next_service_due,
        insuranceCompany: row.insurance_company,
        policyNumber: row.policy_number,
        notes: row.notes,
        isActive: row.is_active,
        clientName: `${row.first_name} ${row.last_name}`,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vehicle
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT v.*, c.first_name, c.last_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1 AND v.shop_id = $2
    `;

    const result = await pool.query(query, [req.params.id, req.user.shopId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const row = result.rows[0];
    res.json({
      vehicle: {
        id: row.id,
        vehicleId: row.vehicle_id,
        clientId: row.client_id,
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        currentMileage: row.current_mileage,
        engineType: row.engine_type,
        transmission: row.transmission,
        color: row.color,
        lastServiceDate: row.last_service_date,
        nextServiceDue: row.next_service_due,
        insuranceCompany: row.insurance_company,
        policyNumber: row.policy_number,
        notes: row.notes,
        isActive: row.is_active,
        clientName: `${row.first_name} ${row.last_name}`,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      clientId, vin, make, model, year, licensePlate, currentMileage,
      engineType, transmission, color, lastServiceDate, nextServiceDue,
      insuranceCompany, policyNumber, notes, isActive
    } = req.body;

    const query = `
      UPDATE vehicles SET
        client_id = $1, vin = $2, make = $3, model = $4, year = $5,
        license_plate = $6, current_mileage = $7, engine_type = $8,
        transmission = $9, color = $10, last_service_date = $11,
        next_service_due = $12, insurance_company = $13, policy_number = $14,
        notes = $15, is_active = $16
      WHERE id = $17 AND shop_id = $18
      RETURNING *
    `;

    const result = await pool.query(query, [
      clientId, vin, make, model, year, licensePlate, currentMileage,
      engineType, transmission, color, lastServiceDate, nextServiceDue,
      insuranceCompany, policyNumber, notes, isActive !== undefined ? isActive : true,
      req.params.id, req.user.shopId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const row = result.rows[0];
    res.json({
      vehicle: {
        id: row.id,
        vehicleId: row.vehicle_id,
        clientId: row.client_id,
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        currentMileage: row.current_mileage,
        engineType: row.engine_type,
        transmission: row.transmission,
        color: row.color,
        lastServiceDate: row.last_service_date,
        nextServiceDue: row.next_service_due,
        insuranceCompany: row.insurance_company,
        policyNumber: row.policy_number,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const result = await pool.query(
      'UPDATE vehicles SET is_active = false WHERE id = $1 AND shop_id = $2 RETURNING id',
      [req.params.id, req.user.shopId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vehicles for a client
router.get('/client/:clientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT v.*, c.first_name, c.last_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.client_id = $1 AND v.shop_id = $2
      ORDER BY v.created_at DESC
    `;

    const result = await pool.query(query, [req.params.clientId, req.user.shopId]);

    res.json({
      vehicles: result.rows.map(row => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        currentMileage: row.current_mileage,
        engineType: row.engine_type,
        transmission: row.transmission,
        color: row.color,
        lastServiceDate: row.last_service_date,
        nextServiceDue: row.next_service_due,
        insuranceCompany: row.insurance_company,
        policyNumber: row.policy_number,
        notes: row.notes,
        isActive: row.is_active,
        clientName: `${row.first_name} ${row.last_name}`,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create vehicle
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      clientId, vin, make, model, year, licensePlate, currentMileage,
      engineType, transmission, color, insuranceCompany, policyNumber, notes
    } = req.body;

    if (!clientId || !make || !model || !year) {
      return res.status(400).json({ error: 'Client, make, model, and year are required' });
    }

    // Generate vehicle ID
    const countQuery = await pool.query('SELECT COUNT(*) FROM vehicles WHERE shop_id = $1', [req.user.shopId]);
    const vehicleId = `V${String(parseInt(countQuery.rows[0].count) + 1).padStart(3, '0')}`;

    const query = `
      INSERT INTO vehicles (
        shop_id, client_id, vehicle_id, vin, make, model, year, license_plate,
        current_mileage, engine_type, transmission, color, insurance_company,
        policy_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.shopId, clientId, vehicleId, vin, make, model, year, licensePlate,
      currentMileage || 0, engineType, transmission, color, insuranceCompany,
      policyNumber, notes
    ]);

    const row = result.rows[0];
    res.status(201).json({
      vehicle: {
        id: row.id,
        vehicleId: row.vehicle_id,
        clientId: row.client_id,
        vin: row.vin,
        make: row.make,
        model: row.model,
        year: row.year,
        licensePlate: row.license_plate,
        currentMileage: row.current_mileage,
        engineType: row.engine_type,
        transmission: row.transmission,
        color: row.color,
        lastServiceDate: row.last_service_date,
        nextServiceDue: row.next_service_due,
        insuranceCompany: row.insurance_company,
        policyNumber: row.policy_number,
        notes: row.notes,
        isActive: row.is_active,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;