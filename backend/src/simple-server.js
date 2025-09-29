const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3004', 'http://localhost:3006', 'http://localhost:3007'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is running!',
    environment: process.env.NODE_ENV || 'development',
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

  // For demo purposes, just return success
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
      token: 'demo-jwt-token-' + Date.now()
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
      token: 'demo-jwt-token-' + Date.now()
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
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth register: http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Auth login: http://localhost:${PORT}/api/auth/login`);
});