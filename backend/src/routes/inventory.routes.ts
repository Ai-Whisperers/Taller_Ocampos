import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication
router.use(authenticate);

// Get all parts with filters
router.get(
  '/parts',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('category').optional().trim(),
    query('lowStock').optional().isBoolean(),
    query('supplierId').optional().isUUID(),
  ],
  validateRequest,
  inventoryController.getAllParts
);

// Get single part
router.get(
  '/parts/:id',
  [param('id').isUUID()],
  validateRequest,
  inventoryController.getPartById
);

// Create new part
router.post(
  '/parts',
  [
    body('code').notEmpty().trim(),
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('brand').optional().trim(),
    body('costPrice').isFloat({ min: 0 }),
    body('salePrice').isFloat({ min: 0 }),
    body('currentStock').isInt({ min: 0 }),
    body('minStock').isInt({ min: 0 }),
    body('maxStock').optional().isInt({ min: 0 }),
    body('location').optional().trim(),
    body('supplierId').optional().isUUID(),
  ],
  validateRequest,
  inventoryController.createPart
);

// Update part
router.put(
  '/parts/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('category').optional().trim(),
    body('brand').optional().trim(),
    body('costPrice').optional().isFloat({ min: 0 }),
    body('salePrice').optional().isFloat({ min: 0 }),
    body('minStock').optional().isInt({ min: 0 }),
    body('maxStock').optional().isInt({ min: 0 }),
    body('location').optional().trim(),
    body('supplierId').optional().isUUID(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  inventoryController.updatePart
);

// Delete part
router.delete(
  '/parts/:id',
  [param('id').isUUID()],
  validateRequest,
  authorize('ADMIN'),
  inventoryController.deletePart
);

// Adjust stock
router.post(
  '/parts/:id/adjust-stock',
  [
    param('id').isUUID(),
    body('quantity').isInt(),
    body('type').isIn(['IN', 'OUT', 'ADJUSTMENT']),
    body('reference').optional().trim(),
    body('notes').optional().trim(),
  ],
  validateRequest,
  inventoryController.adjustStock
);

// Get stock movements
router.get(
  '/parts/:id/movements',
  [
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  inventoryController.getStockMovements
);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStock);

// Get all suppliers
router.get(
  '/suppliers',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
  ],
  validateRequest,
  inventoryController.getAllSuppliers
);

// Create supplier
router.post(
  '/suppliers',
  [
    body('name').notEmpty().trim(),
    body('taxId').optional().trim(),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('address').optional().trim(),
    body('website').optional().isURL(),
    body('notes').optional().trim(),
  ],
  validateRequest,
  inventoryController.createSupplier
);

// Update supplier
router.put(
  '/suppliers/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty().trim(),
    body('taxId').optional().trim(),
    body('email').optional().isEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('address').optional().trim(),
    body('website').optional().isURL(),
    body('notes').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  inventoryController.updateSupplier
);

export default router;