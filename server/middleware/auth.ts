import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

interface AuthUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  currentTenant?: {
    id: string;
    slug: string;
    name: string;
    role: 'super_admin' | 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
    permissions: any;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user: AuthUser;
}

// Authentication middleware
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check session first
    if ((req.session as any)?.user) {
      req.user = (req.session as any).user;
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

    // Get user's primary tenant for proper role-based access
    const primaryTenant = await storage.getUserPrimaryTenant(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin || false,
      currentTenant: primaryTenant ? {
        id: primaryTenant.tenant.id,
        slug: primaryTenant.tenant.slug,
        name: primaryTenant.tenant.name,
        role: primaryTenant.role as any,
        permissions: (primaryTenant as any).permissions || {},
      } : undefined,
    };

    // Store in session for future requests
    (req.session as any).user = req.user;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Super admin middleware - Platform Owner (Level 1)
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // Ensure user is authenticated first
  if (!req.user) {
    await requireAuth(req, res, () => {});
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
  }
  
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Tenant admin middleware - Account Owner (Level 2)
export const requireTenantAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Super admin can access any tenant
  if (user.isSuperAdmin) {
    return next();
  }
  
  // Must be tenant owner/admin
  if (!user.currentTenant || !['owner', 'admin'].includes(user.currentTenant.role)) {
    return res.status(403).json({ message: 'Tenant admin access required' });
  }
  
  next();
};

// Staff access middleware - Team Member (Level 3)
export const requireStaffAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Super admin can access anything
  if (user.isSuperAdmin) {
    return next();
  }
  
  // Must be part of a tenant with staff+ privileges
  if (!user.currentTenant || !['owner', 'admin', 'manager', 'staff'].includes(user.currentTenant.role)) {
    return res.status(403).json({ message: 'Staff access required' });
  }
  
  next();
};

// Viewer access middleware - Read-Only (Level 4)  
export const requireViewerAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Super admin can access anything
  if (user.isSuperAdmin) {
    return next();
  }
  
  // Must be part of a tenant
  if (!user.currentTenant) {
    return res.status(403).json({ message: 'Tenant access required' });
  }
  
  next();
};

// Permission checker for specific actions
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Super admin has all permissions
    if (user.isSuperAdmin) {
      return next();
    }
    
    // Check tenant-level permissions
    if (!user.currentTenant) {
      return res.status(403).json({ message: 'Tenant access required' });
    }
    
    // Owner and admin have all permissions by default
    if (['owner', 'admin'].includes(user.currentTenant.role)) {
      return next();
    }
    
    // Check specific permission for other roles
    const permissions = user.currentTenant.permissions || {};
    if (!permissions[permission]) {
      return res.status(403).json({ message: `Permission required: ${permission}` });
    }
    
    next();
  };
};

// Feature access control middleware
export const requireFeature = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Super admin has access to all features
    if (user.isSuperAdmin) {
      return next();
    }
    
    // Check if user has access through their tenant's package
    if (!user.currentTenant) {
      return res.status(403).json({ message: 'Tenant access required' });
    }
    
    try {
      const tenant = await storage.getTenant(user.currentTenant.tenantId);
      if (!tenant?.planId) {
        return res.status(403).json({ message: 'No plan assigned to tenant' });
      }
      
      const featurePackage = await storage.getFeaturePackage(tenant.planId);
      if (!featurePackage) {
        return res.status(403).json({ message: 'Invalid plan configuration' });
      }
      
      const features = featurePackage.features as Record<string, boolean>;
      if (!features[feature]) {
        return res.status(403).json({ 
          message: `Feature '${feature}' not available in your current plan`,
          featureRequired: feature
        });
      }
      
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ message: 'Error checking feature access' });
    }
  };
};

// Check usage limits middleware
export const checkUsageLimit = (limitType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Super admin bypasses all limits
    if (user.isSuperAdmin) {
      return next();
    }
    
    if (!user.currentTenant) {
      return res.status(403).json({ message: 'Tenant access required' });
    }
    
    try {
      const tenant = await storage.getTenant(user.currentTenant.tenantId);
      if (!tenant?.planId) {
        return res.status(403).json({ message: 'No plan assigned to tenant' });
      }
      
      const featurePackage = await storage.getFeaturePackage(tenant.planId);
      if (!featurePackage) {
        return res.status(403).json({ message: 'Invalid plan configuration' });
      }
      
      const limits = featurePackage.limits as Record<string, number>;
      const limit = limits[limitType];
      
      if (limit !== undefined && limit > 0) {
        // Check current usage based on limit type
        let currentUsage = 0;
        
        switch (limitType) {
          case 'maxUsers':
          case 'staff':
            const tenantUsers = await storage.getTenantUsers(user.currentTenant.tenantId);
            currentUsage = tenantUsers.length;
            break;
          case 'maxVenues':
          case 'venues':
            const venues = await storage.getVenues(user.currentTenant.tenantId);
            currentUsage = venues.length;
            break;
          // Add more limit checks as needed
        }
        
        if (currentUsage >= limit) {
          return res.status(403).json({ 
            message: `Usage limit exceeded for ${limitType}. Current: ${currentUsage}, Limit: ${limit}`,
            limitType,
            currentUsage,
            limit
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ message: 'Error checking usage limits' });
    }
  };
};

// Generate JWT token
export const generateToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};