import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { VehicleController } from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const vehicleController = new VehicleController();

// All routes require authentication
router.use(authenticate);

// Get all vehicles with pagination and search
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('clientId').optional().isUUID(),
  ],
  validateRequest,
  vehicleController.getAll
);

// Get single vehicle
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  vehicleController.getById
);

// Get vehicle by license plate
router.get(
  '/plate/:plate',
  [param('plate').notEmpty()],
  validateRequest,
  vehicleController.getByPlate
);

// Create new vehicle
router.post(
  '/',
  [
    body('clientId').isUUID(),
    body('licensePlate').notEmpty().trim(),
    body('vin').optional().trim(),
    body('brand').notEmpty().trim(),
    body('model').notEmpty().trim(),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    body('color').optional().trim(),
    body('mileage').optional().isInt({ min: 0 }),
    body('notes').optional().trim(),
  ],
  validateRequest,
  vehicleController.create
);

// Update vehicle
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('licensePlate').optional().notEmpty().trim(),
    body('vin').optional().trim(),
    body('brand').optional().notEmpty().trim(),
    body('model').optional().notEmpty().trim(),
    body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    body('color').optional().trim(),
    body('mileage').optional().isInt({ min: 0 }),
    body('notes').optional().trim(),
  ],
  validateRequest,
  vehicleController.update
);

// Delete vehicle
router.delete(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  vehicleController.delete
);

// Get vehicle work orders
router.get(
  '/:id/work-orders',
  [param('id').isUUID()],
  validateRequest,
  vehicleController.getWorkOrders
);

// Get vehicle service history
router.get(
  '/:id/history',
  [param('id').isUUID()],
  validateRequest,
  vehicleController.getServiceHistory
);

export default router;