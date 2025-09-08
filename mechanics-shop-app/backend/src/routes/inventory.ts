import { Router, Response } from 'express';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get all parts inventory for a shop
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        id, part_id, part_number, description, category, supplier,
        supplier_part_number, cost_price, selling_price, markup_percent,
        quantity_on_hand, min_stock_level, max_stock_level, reorder_point,
        reorder_quantity, location, last_ordered, last_sold, turn_rate_annual,
        is_active, created_at, updated_at,
        CASE 
          WHEN quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
          WHEN quantity_on_hand <= reorder_point THEN 'REORDER_NEEDED'
          WHEN quantity_on_hand <= min_stock_level THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END AS stock_status
      FROM parts_inventory 
      WHERE shop_id = $1 AND is_active = true
      ORDER BY category, description
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      parts: result.rows.map(row => ({
        id: row.id,
        partId: row.part_id,
        partNumber: row.part_number,
        description: row.description,
        category: row.category,
        supplier: row.supplier,
        supplierPartNumber: row.supplier_part_number,
        costPrice: parseFloat(row.cost_price),
        sellingPrice: parseFloat(row.selling_price),
        markupPercent: parseFloat(row.markup_percent || 0),
        quantityOnHand: row.quantity_on_hand,
        minStockLevel: row.min_stock_level,
        maxStockLevel: row.max_stock_level,
        reorderPoint: row.reorder_point,
        reorderQuantity: row.reorder_quantity,
        location: row.location,
        lastOrdered: row.last_ordered,
        lastSold: row.last_sold,
        turnRateAnnual: row.turn_rate_annual,
        stockStatus: row.stock_status,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Get parts inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single part
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT * FROM parts_inventory 
      WHERE id = $1 AND shop_id = $2
    `;

    const result = await pool.query(query, [req.params.id, req.user.shopId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const row = result.rows[0];
    res.json({
      part: {
        id: row.id,
        partId: row.part_id,
        partNumber: row.part_number,
        description: row.description,
        category: row.category,
        supplier: row.supplier,
        supplierPartNumber: row.supplier_part_number,
        costPrice: parseFloat(row.cost_price),
        sellingPrice: parseFloat(row.selling_price),
        markupPercent: parseFloat(row.markup_percent || 0),
        quantityOnHand: row.quantity_on_hand,
        minStockLevel: row.min_stock_level,
        maxStockLevel: row.max_stock_level,
        reorderPoint: row.reorder_point,
        reorderQuantity: row.reorder_quantity,
        location: row.location,
        lastOrdered: row.last_ordered,
        lastSold: row.last_sold,
        turnRateAnnual: row.turn_rate_annual,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Get part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new part
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      partNumber, description, category, supplier, supplierPartNumber,
      costPrice, sellingPrice, quantityOnHand, minStockLevel, maxStockLevel,
      reorderPoint, reorderQuantity, location
    } = req.body;

    if (!partNumber || !description || !category || !costPrice || !sellingPrice) {
      return res.status(400).json({ error: 'Part number, description, category, cost price, and selling price are required' });
    }

    // Generate part ID
    const countQuery = await pool.query('SELECT COUNT(*) FROM parts_inventory WHERE shop_id = $1', [req.user.shopId]);
    const partId = `P${String(parseInt(countQuery.rows[0].count) + 1).padStart(3, '0')}`;

    const query = `
      INSERT INTO parts_inventory (
        shop_id, part_id, part_number, description, category, supplier,
        supplier_part_number, cost_price, selling_price, quantity_on_hand,
        min_stock_level, max_stock_level, reorder_point, reorder_quantity, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.shopId, partId, partNumber, description, category, supplier,
      supplierPartNumber, costPrice, sellingPrice, quantityOnHand || 0,
      minStockLevel || 0, maxStockLevel || 100, reorderPoint || 5,
      reorderQuantity || 10, location
    ]);

    const row = result.rows[0];
    res.status(201).json({
      part: {
        id: row.id,
        partId: row.part_id,
        partNumber: row.part_number,
        description: row.description,
        category: row.category,
        supplier: row.supplier,
        supplierPartNumber: row.supplier_part_number,
        costPrice: parseFloat(row.cost_price),
        sellingPrice: parseFloat(row.selling_price),
        markupPercent: parseFloat(row.markup_percent || 0),
        quantityOnHand: row.quantity_on_hand,
        minStockLevel: row.min_stock_level,
        maxStockLevel: row.max_stock_level,
        reorderPoint: row.reorder_point,
        reorderQuantity: row.reorder_quantity,
        location: row.location,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Create part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update part
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const {
      partNumber, description, category, supplier, supplierPartNumber,
      costPrice, sellingPrice, quantityOnHand, minStockLevel, maxStockLevel,
      reorderPoint, reorderQuantity, location, isActive
    } = req.body;

    const query = `
      UPDATE parts_inventory SET
        part_number = $1, description = $2, category = $3, supplier = $4,
        supplier_part_number = $5, cost_price = $6, selling_price = $7,
        quantity_on_hand = $8, min_stock_level = $9, max_stock_level = $10,
        reorder_point = $11, reorder_quantity = $12, location = $13, is_active = $14
      WHERE id = $15 AND shop_id = $16
      RETURNING *
    `;

    const result = await pool.query(query, [
      partNumber, description, category, supplier, supplierPartNumber,
      costPrice, sellingPrice, quantityOnHand, minStockLevel, maxStockLevel,
      reorderPoint, reorderQuantity, location, isActive !== undefined ? isActive : true,
      req.params.id, req.user.shopId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const row = result.rows[0];
    res.json({
      part: {
        id: row.id,
        partId: row.part_id,
        partNumber: row.part_number,
        description: row.description,
        category: row.category,
        supplier: row.supplier,
        supplierPartNumber: row.supplier_part_number,
        costPrice: parseFloat(row.cost_price),
        sellingPrice: parseFloat(row.selling_price),
        markupPercent: parseFloat(row.markup_percent || 0),
        quantityOnHand: row.quantity_on_hand,
        minStockLevel: row.min_stock_level,
        maxStockLevel: row.max_stock_level,
        reorderPoint: row.reorder_point,
        reorderQuantity: row.reorder_quantity,
        location: row.location,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Update part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Adjust inventory (for receiving parts or usage)
router.post('/:id/adjust', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const { adjustment, reason } = req.body;

    if (typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Adjustment amount is required and must be a number' });
    }

    const query = `
      UPDATE parts_inventory 
      SET quantity_on_hand = quantity_on_hand + $1
      WHERE id = $2 AND shop_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [adjustment, req.params.id, req.user.shopId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // TODO: Add audit log entry for inventory adjustment
    
    const row = result.rows[0];
    res.json({
      part: {
        id: row.id,
        partId: row.part_id,
        quantityOnHand: row.quantity_on_hand,
        adjustment: adjustment,
        reason: reason || 'Manual adjustment'
      }
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.shopId) {
      return res.status(400).json({ error: 'Shop not found' });
    }

    const query = `
      SELECT 
        id, part_id, description, category, quantity_on_hand, reorder_point,
        reorder_quantity, supplier
      FROM parts_inventory 
      WHERE shop_id = $1 AND quantity_on_hand <= reorder_point AND is_active = true
      ORDER BY (quantity_on_hand::FLOAT / reorder_point::FLOAT)
    `;

    const result = await pool.query(query, [req.user.shopId]);

    res.json({
      lowStockParts: result.rows.map(row => ({
        id: row.id,
        partId: row.part_id,
        description: row.description,
        category: row.category,
        quantityOnHand: row.quantity_on_hand,
        reorderPoint: row.reorder_point,
        reorderQuantity: row.reorder_quantity,
        supplier: row.supplier
      }))
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;