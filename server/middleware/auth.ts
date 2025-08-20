import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Super admin credentials from environment variables
const SUPER_ADMIN_CREDENTIALS = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@yourcompany.com',
  // Hash of 'admin123' - generated using bcrypt
  passwordHash: process.env.SUPER_ADMIN_PASSWORD_HASH || '$2b$10$k2KY5y8NLuW62L1cMITlQeV/f05mB7uOiyGz2OgIByabbtp4T8Utq'
};

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
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; permissions?: string[]; tenantId?: string };
  } catch (error) {
    return null;
  }
}

// Super admin authentication
export async function authenticateSuperAdmin(email: string, password: string): Promise<{ token: string; user: any } | null> {
  if (email !== SUPER_ADMIN_CREDENTIALS.email) {
    return null;
  }

  const isValidPassword = await comparePassword(password, SUPER_ADMIN_CREDENTIALS.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  const user = {
    id: 'super-admin-1',
    email: SUPER_ADMIN_CREDENTIALS.email,
    role: 'super_admin'
  };

  const token = generateToken(user);
  return { token, user };
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