import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic test endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Backend is running!',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Simple auth endpoints for testing
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required'
    });
  }

  // For now, just return success (in real implementation, save to database)
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: '1',
        name,
        email,
        role: 'ADMIN'
      },
      token: 'demo-jwt-token'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // For demo purposes, accept any login
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        name: 'Demo User',
        email,
        role: 'ADMIN'
      },
      token: 'demo-jwt-token'
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'ADMIN'
    }
  });
});

// Error handling
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API test: http://localhost:${PORT}/api/test`);
});