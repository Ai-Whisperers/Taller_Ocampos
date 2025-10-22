import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import 'express-async-errors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

// Route imports
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import vehicleRoutes from './routes/vehicle.routes';
import workOrderRoutes from './routes/workOrder.routes';
import inventoryRoutes from './routes/inventory.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.MOBILE_URL || 'exp://localhost:8081'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.MOBILE_URL || 'exp://localhost:8081'],
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-shop', (shopId) => {
    socket.join(`shop-${shopId}`);
    logger.info(`Socket ${socket.id} joined shop-${shopId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const SOCKET_PORT = process.env.SOCKET_PORT || 3002;

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket.IO running on port ${SOCKET_PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Export app for testing
export default app;
export { httpServer, io };