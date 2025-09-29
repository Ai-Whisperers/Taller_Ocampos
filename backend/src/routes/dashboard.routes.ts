import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/stats', dashboardController.getStats.bind(dashboardController));
router.get('/revenue-chart', dashboardController.getRevenueChart.bind(dashboardController));
router.get('/top-clients', dashboardController.getTopClients.bind(dashboardController));
router.get('/work-order-stats', dashboardController.getWorkOrderStats.bind(dashboardController));

export default router;