import { Router, Response } from 'express';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get all clients for a shop
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        id, client_id, first_name, last_name, company_name, 
        phone, email, address, city, state, zip_code,
        payment_terms, credit_limit, customer_notes,
        preferred_contact, emergency_contact, emergency_phone,
        is_active, created_at, updated_at
      FROM clients 
      WHERE shop_id = $1 
      ORDER BY last_name, first_name
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      clients: result.rows.map(row => ({
        id: row.id,
        clientId: row.client_id,
        firstName: row.first_name,
        lastName: row.last_name,
        companyName: row.company_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        paymentTerms: row.payment_terms,
        creditLimit: parseFloat(row.credit_limit),
        customerNotes: row.customer_notes,
        preferredContact: row.preferred_contact,
        emergencyContact: row.emergency_contact,
        emergencyPhone: row.emergency_phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single client
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        id, client_id, first_name, last_name, company_name, 
        phone, email, address, city, state, zip_code,
        payment_terms, credit_limit, customer_notes,
        preferred_contact, emergency_contact, emergency_phone,
        is_active, created_at, updated_at
      FROM clients 
      WHERE id = $1 AND shop_id = $2
    `;

    const result = await pool.query(query, [req.params.id, req.user.shopId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const row = result.rows[0];
    res.json({
      client: {
        id: row.id,
        clientId: row.client_id,
        firstName: row.first_name,
        lastName: row.last_name,
        companyName: row.company_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        paymentTerms: row.payment_terms,
        creditLimit: parseFloat(row.credit_limit),
        customerNotes: row.customer_notes,
        preferredContact: row.preferred_contact,
        emergencyContact: row.emergency_contact,
        emergencyPhone: row.emergency_phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new client
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      firstName, lastName, companyName, phone, email, address,
      city, state, zipCode, paymentTerms, creditLimit, customerNotes,
      preferredContact, emergencyContact, emergencyPhone
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    // Generate client ID
    const countQuery = await pool.query('SELECT COUNT(*) FROM clients WHERE shop_id = $1', [req.user.shopId]);
    const clientId = `C${String(parseInt(countQuery.rows[0].count) + 1).padStart(3, '0')}`;

    const query = `
      INSERT INTO clients (
        shop_id, client_id, first_name, last_name, company_name,
        phone, email, address, city, state, zip_code,
        payment_terms, credit_limit, customer_notes,
        preferred_contact, emergency_contact, emergency_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.shopId, clientId, firstName, lastName, companyName,
      phone, email, address, city, state, zipCode,
      paymentTerms || 'COD', creditLimit || 0, customerNotes,
      preferredContact || 'phone', emergencyContact, emergencyPhone
    ]);

    const row = result.rows[0];
    res.status(201).json({
      client: {
        id: row.id,
        clientId: row.client_id,
        firstName: row.first_name,
        lastName: row.last_name,
        companyName: row.company_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        paymentTerms: row.payment_terms,
        creditLimit: parseFloat(row.credit_limit),
        customerNotes: row.customer_notes,
        preferredContact: row.preferred_contact,
        emergencyContact: row.emergency_contact,
        emergencyPhone: row.emergency_phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update client
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      firstName, lastName, companyName, phone, email, address,
      city, state, zipCode, paymentTerms, creditLimit, customerNotes,
      preferredContact, emergencyContact, emergencyPhone, isActive
    } = req.body;

    const query = `
      UPDATE clients SET
        first_name = $1, last_name = $2, company_name = $3,
        phone = $4, email = $5, address = $6, city = $7, state = $8, zip_code = $9,
        payment_terms = $10, credit_limit = $11, customer_notes = $12,
        preferred_contact = $13, emergency_contact = $14, emergency_phone = $15,
        is_active = $16
      WHERE id = $17 AND shop_id = $18
      RETURNING *
    `;

    const result = await pool.query(query, [
      firstName, lastName, companyName, phone, email, address,
      city, state, zipCode, paymentTerms, creditLimit, customerNotes,
      preferredContact, emergencyContact, emergencyPhone, isActive,
      req.params.id, req.user.shopId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const row = result.rows[0];
    res.json({
      client: {
        id: row.id,
        clientId: row.client_id,
        firstName: row.first_name,
        lastName: row.last_name,
        companyName: row.company_name,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        paymentTerms: row.payment_terms,
        creditLimit: parseFloat(row.credit_limit),
        customerNotes: row.customer_notes,
        preferredContact: row.preferred_contact,
        emergencyContact: row.emergency_contact,
        emergencyPhone: row.emergency_phone,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;