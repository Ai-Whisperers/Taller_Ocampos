import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const paymentController = new PaymentController();

// All routes require authentication
router.use(authenticate);

// Get all payments with filters
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('clientId').optional().isUUID(),
    query('invoiceId').optional().isUUID(),
    query('method').optional().isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validateRequest,
  paymentController.getAll
);

// Get single payment
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  paymentController.getById
);

// Create new payment
router.post(
  '/',
  [
    body('invoiceId').isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('method').isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER']),
    body('reference').optional().trim(),
    body('notes').optional().trim(),
    body('paymentDate').optional().isISO8601(),
  ],
  validateRequest,
  paymentController.create
);

// Update payment
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('method').optional().isIn(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER']),
    body('reference').optional().trim(),
    body('notes').optional().trim(),
    body('paymentDate').optional().isISO8601(),
  ],
  validateRequest,
  paymentController.update
);

// Delete payment
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  paymentController.delete
);

// Get payment receipt
router.get(
  '/:id/receipt',
  [param('id').isUUID()],
  validateRequest,
  paymentController.getReceipt
);

// Get daily payment summary
router.get(
  '/summary/daily',
  [
    query('date').optional().isISO8601(),
  ],
  validateRequest,
  paymentController.getDailySummary
);

// Get monthly payment summary
router.get(
  '/summary/monthly',
  [
    query('year').optional().isInt({ min: 2020 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
  ],
  validateRequest,
  paymentController.getMonthlySummary
);

export default router;