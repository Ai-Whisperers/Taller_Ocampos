import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().trim(),
    body('phone').optional().isMobilePhone('any'),
  ],
  validateRequest,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  authController.login
);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getCurrentUser);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  validateRequest,
  authController.changePassword
);

router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validateRequest,
  authController.resetPassword
);

export default router;