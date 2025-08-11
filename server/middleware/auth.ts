import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isSuperAdmin: boolean;
      };
      session: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    isSuperAdmin: boolean;
  };
}

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session first
    if (req.session?.user) {
      req.user = req.session.user;
      return next();
    }

    // Check JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
    };

    // Store in session for future requests
    req.session.user = req.user;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Super admin middleware
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Generate JWT token
export const generateToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};