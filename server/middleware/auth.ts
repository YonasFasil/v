import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
    tenantId?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string | null;
    role: string;
    name: string;
    email: string;
    staffType?: string;
    venueIds?: string[];
  };
}

// Authentication middleware
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      return res.status(401).json({ message: 'Invalid session' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      email: user.email,
      staffType: user.staffType || undefined,
      venueIds: user.assignedVenueIds || [],
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Optional authentication middleware (doesn't require login)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.userId;
    
    if (userId) {
      const user = await storage.getUser(userId);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          tenantId: user.tenantId,
          role: user.role,
          name: user.name,
          email: user.email,
          staffType: user.staffType || undefined,
          venueIds: user.assignedVenueIds || [],
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue without authentication
  }
};

// Helper function to hash passwords
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Helper function to verify passwords
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};