import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Extended Request interface to include tenant context
export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  userRole?: string;
  user?: any;
}

// Tenant context middleware - extracts tenant from PostgreSQL user session
export const tenantContext = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    // Skip tenant context for admin routes, public routes, and non-authenticated routes
    if (req.path.startsWith('/api/admin') || 
        req.path.startsWith('/api/public') || 
        req.path.startsWith('/api/auth') || 
        !req.user) {
      return next();
    }

    const user = req.user;

    // Block super admins from accessing tenant routes
    if (user.isSuperAdmin) {
      console.log('Blocking super admin from accessing tenant route:', req.path);
      return res.status(403).json({ 
        message: 'Super admin users cannot access tenant routes. Please use super admin dashboard.' 
      });
    }

    // Check if user has tenant context from auth middleware
    if (!user.currentTenant) {
      return res.status(403).json({ 
        message: 'Tenant access required' 
      });
    }

    // Get full tenant information
    const tenant = await storage.getTenant(user.currentTenant.id);
    
    if (!tenant || tenant.status !== 'active') {
      return res.status(403).json({ 
        message: 'No active tenant found for user' 
      });
    }

    // Set tenant context on request
    req.tenantId = tenant.id;
    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    };
    req.userRole = user.currentTenant.role;
    req.user = { id: user.id };

    next();
  } catch (error) {
    console.error('Tenant context middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};