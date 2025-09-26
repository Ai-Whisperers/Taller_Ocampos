import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const invoiceController = new InvoiceController();

// All routes require authentication
router.use(authenticate);

// Get all invoices with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']),
    query('clientId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  invoiceController.getAll
);

// Get single invoice
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  invoiceController.getById
);

// Create new invoice
router.post(
  '/',
  [
    body('workOrderId').optional().isUUID(),
    body('clientId').isUUID(),
    body('dueDate').isISO8601(),
    body('items').isArray({ min: 1 }),
    body('items.*.description').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    body('taxRate').isFloat({ min: 0, max: 100 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('terms').optional().trim(),
  ],
  validateRequest,
  invoiceController.create
);

// Update invoice
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('status').optional().isIn(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']),
    body('dueDate').optional().isISO8601(),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
    body('terms').optional().trim(),
  ],
  validateRequest,
  invoiceController.update
);

// Delete invoice
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  invoiceController.delete
);

// Send invoice by email
router.post(
  '/:id/send',
  [
    param('id').isUUID(),
    body('email').optional().isEmail(),
  ],
  validateRequest,
  invoiceController.sendByEmail
);

// Export invoice as PDF
router.get(
  '/:id/export/pdf',
  [param('id').isUUID()],
  validateRequest,
  invoiceController.exportPDF
);

// Export invoice as Excel
router.get(
  '/:id/export/excel',
  [param('id').isUUID()],
  validateRequest,
  invoiceController.exportExcel
);

// Mark invoice as paid
router.post(
  '/:id/mark-paid',
  [param('id').isUUID()],
  validateRequest,
  invoiceController.markAsPaid
);

// Get invoice payments
router.get(
  '/:id/payments',
  [param('id').isUUID()],
  validateRequest,
  invoiceController.getPayments
);

export default router;