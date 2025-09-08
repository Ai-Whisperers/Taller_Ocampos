import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { pool } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const userQuery = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user's shop
    const shopQuery = await pool.query(
      'SELECT s.id, s.name FROM users_shops us JOIN shops s ON us.shop_id = s.id WHERE us.user_id = $1 AND us.is_active = true LIMIT 1',
      [user.id]
    );

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        shop: shopQuery.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (for demo purposes - in production this would be more restricted)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, shopName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email.toLowerCase(), passwordHash, firstName, lastName, 'owner']
    );

    const userId = userResult.rows[0].id;

    // Create shop if provided
    let shopId = null;
    if (shopName) {
      const shopResult = await pool.query(
        'INSERT INTO shops (name, owner_id) VALUES ($1, $2) RETURNING id',
        [shopName, userId]
      );
      shopId = shopResult.rows[0].id;

      // Link user to shop
      await pool.query(
        'INSERT INTO users_shops (user_id, shop_id, role) VALUES ($1, $2, $3)',
        [userId, shopId, 'owner']
      );
    }

    res.status(201).json({ 
      message: 'User created successfully',
      userId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userQuery = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userQuery.rows[0];

    // Get user's shop
    const shopQuery = await pool.query(
      'SELECT s.id, s.name FROM users_shops us JOIN shops s ON us.shop_id = s.id WHERE us.user_id = $1 AND us.is_active = true LIMIT 1',
      [user.id]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        shop: shopQuery.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;