import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { WorkOrderController } from '../controllers/workOrder.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const workOrderController = new WorkOrderController();

// All routes require authentication
router.use(authenticate);

// Get all work orders with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']),
    query('clientId').optional().isUUID(),
    query('vehicleId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  workOrderController.getAll
);

// Get single work order
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  workOrderController.getById
);

// Create new work order
router.post(
  '/',
  [
    body('clientId').isUUID(),
    body('vehicleId').isUUID(),
    body('description').notEmpty().trim(),
    body('diagnostics').optional().trim(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('laborRate').isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('internalNotes').optional().trim(),
  ],
  validateRequest,
  workOrderController.create
);

// Update work order
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('status').optional().isIn(['DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']),
    body('description').optional().notEmpty().trim(),
    body('diagnostics').optional().trim(),
    body('estimatedHours').optional().isFloat({ min: 0 }),
    body('actualHours').optional().isFloat({ min: 0 }),
    body('laborRate').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('internalNotes').optional().trim(),
  ],
  validateRequest,
  workOrderController.update
);

// Delete work order
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  workOrderController.delete
);

// Add service to work order
router.post(
  '/:id/services',
  [
    param('id').isUUID(),
    body('serviceId').isUUID(),
    body('quantity').isInt({ min: 1 }),
    body('unitPrice').isFloat({ min: 0 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
  ],
  validateRequest,
  workOrderController.addService
);

// Add part to work order
router.post(
  '/:id/parts',
  [
    param('id').isUUID(),
    body('partId').isUUID(),
    body('quantity').isInt({ min: 1 }),
    body('unitPrice').isFloat({ min: 0 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
  ],
  validateRequest,
  workOrderController.addPart
);

// Update work order status
router.patch(
  '/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']),
  ],
  validateRequest,
  workOrderController.updateStatus
);

// Generate invoice from work order
router.post(
  '/:id/generate-invoice',
  [param('id').isUUID()],
  validateRequest,
  workOrderController.generateInvoice
);

export default router;