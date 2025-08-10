import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tenantUsers, tenants, superAdmins } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Extended Request interface to include tenant context
export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: any;
  userRole?: string;
  user?: any;
}

// Tenant context middleware - extracts tenant from user session
export const tenantContext = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    // Skip tenant context for superadmin routes and non-authenticated routes
    if (req.path.startsWith('/api/superadmin') || !req.user?.id) {
      return next();
    }

    const userId = req.user.id;

    // Get user's tenant context
    const tenantUser = await db
      .select({
        tenantId: tenantUsers.tenantId,
        role: tenantUsers.role,
        tenant: {
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          status: tenants.status,
        }
      })
      .from(tenantUsers)
      .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
      .where(and(
        eq(tenantUsers.userId, userId),
        eq(tenantUsers.status, 'active'),
        eq(tenants.status, 'active')
      ))
      .limit(1);

    if (!tenantUser.length) {
      return res.status(403).json({ 
        message: 'No active tenant found for user' 
      });
    }

    // Set tenant context on request
    req.tenantId = tenantUser[0].tenantId;
    req.tenant = tenantUser[0].tenant;
    req.userRole = tenantUser[0].role;

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    res.status(500).json({ 
      message: 'Error establishing tenant context' 
    });
  }
};

// Super admin middleware - checks if user is a super admin
export const requireSuperAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is a super admin
    const [superAdmin] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.userId, req.user.id))
      .limit(1);

    if (!superAdmin) {
      return res.status(403).json({ 
        message: 'Super admin access required' 
      });
    }

    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ 
      message: 'Error checking super admin status' 
    });
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(403).json({ 
        message: 'No role found for user' 
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};