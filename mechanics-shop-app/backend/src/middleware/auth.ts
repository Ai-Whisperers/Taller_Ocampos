import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../server';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    shopId?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Get user details from database
    const userQuery = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's shop(s)
    const shopQuery = await pool.query(
      'SELECT shop_id FROM users_shops WHERE user_id = $1 AND is_active = true LIMIT 1',
      [decoded.userId]
    );

    req.user = {
      id: userQuery.rows[0].id,
      email: userQuery.rows[0].email,
      role: userQuery.rows[0].role,
      shopId: shopQuery.rows[0]?.shop_id
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};