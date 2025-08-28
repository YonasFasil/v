import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireEnv } from '../utils/requireEnv';

// JWT secret from environment variable
const JWT_SECRET = requireEnv('JWT_SECRET');


export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role: string;
    permissions?: string[];
    tenantId?: string;
  };
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Compare password utility
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(payload: { id: string; email: string; name?: string; role: string; permissions?: string[]; tenantId?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token: string): { id: string; email: string; role: string; permissions?: string[]; tenantId?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; permissions?: string[]; tenantId?: string };
    console.log('✅ Token verified successfully:', { id: decoded.id, email: decoded.email, role: decoded.role });
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
}

// Super admin authentication
export async function authenticateSuperAdmin(email: string, password: string): Promise<{ token: string; user: any } | null> {
  try {
    // Direct database query to bypass Drizzle/Neon compatibility issues
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    let superAdmin;
    try {
      const result = await pool.query(
        'SELECT id, email, password, name, role, permissions FROM users WHERE email = $1 AND role = $2 LIMIT 1',
        [email, 'super_admin']
      );
      superAdmin = result.rows[0];
    } finally {
      await pool.end();
    }

    if (!superAdmin) {
      console.log('Super admin user not found with email:', email);
      return null;
    }

    const isValidPassword = await comparePassword(password, superAdmin.password);
    if (!isValidPassword) {
      console.log('Invalid password for super admin');
      return null;
    }

    const user = {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: superAdmin.role,
      permissions: superAdmin.permissions || []
    };

    const token = generateToken(user);
    return { token, user };
  } catch (error) {
    console.error('Error authenticating super admin:', error);
    return null;
  }
}

// Middleware to require super admin authentication
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }

  req.user = decoded;
  next();
}

// Middleware to require any authentication
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}