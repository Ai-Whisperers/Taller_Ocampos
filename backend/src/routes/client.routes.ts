import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ClientController } from '../controllers/client.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const clientController = new ClientController();

// All routes require authentication
router.use(authenticate);

// Get all clients with pagination and search
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
  ],
  validateRequest,
  clientController.getAll
);

// Get single client
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  clientController.getById
);

// Create new client
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').notEmpty().isMobilePhone('any'),
    body('address').optional().trim(),
    body('taxId').optional().trim(),
    body('notes').optional().trim(),
  ],
  validateRequest,
  clientController.create
);

// Update client
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('address').optional().trim(),
    body('taxId').optional().trim(),
    body('notes').optional().trim(),
  ],
  validateRequest,
  clientController.update
);

// Delete client
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  authorize('ADMIN'),
  clientController.delete
);

// Get client vehicles
router.get(
  '/:id/vehicles',
  [param('id').isUUID()],
  validateRequest,
  clientController.getVehicles
);

// Get client work orders
router.get(
  '/:id/work-orders',
  [param('id').isUUID()],
  validateRequest,
  clientController.getWorkOrders
);

// Get client invoices
router.get(
  '/:id/invoices',
  [param('id').isUUID()],
  validateRequest,
  clientController.getInvoices
);

export default router;