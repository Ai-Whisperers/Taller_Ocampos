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
    body('phone').optional().trim().isLength({ min: 6, max: 20 }),
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
    body('phone').optional().trim().isLength({ min: 6, max: 20 }),
    body('address').optional().trim(),
    body('website').optional().isURL(),
    body('notes').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  inventoryController.updateSupplier
);

// Get all services
router.get(
  '/services',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('categoryId').optional().isUUID(),
  ],
  validateRequest,
  inventoryController.getAllServices
);

// Get single service
router.get(
  '/services/:id',
  [param('id').isUUID()],
  validateRequest,
  inventoryController.getServiceById
);

// Create new service
router.post(
  '/services',
  [
    body('code').notEmpty().trim(),
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('categoryId').optional().isUUID(),
    body('basePrice').isFloat({ min: 0 }),
    body('estimatedHours').optional().isFloat({ min: 0 }),
  ],
  validateRequest,
  inventoryController.createService
);

// Update service
router.put(
  '/services/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('categoryId').optional().isUUID(),
    body('basePrice').optional().isFloat({ min: 0 }),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  inventoryController.updateService
);

// Delete service
router.delete(
  '/services/:id',
  [param('id').isUUID()],
  validateRequest,
  authorize('ADMIN'),
  inventoryController.deleteService
);

// Get all service categories
router.get('/service-categories', inventoryController.getAllServiceCategories);

// Create service category
router.post(
  '/service-categories',
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
  ],
  validateRequest,
  inventoryController.createServiceCategory
);

export default router;