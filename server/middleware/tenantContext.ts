import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tenantUsers, tenants, superAdmins } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

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
    // Skip tenant context for superadmin routes, public routes, and non-authenticated routes
    if (req.path.startsWith('/api/superadmin') || 
        req.path.startsWith('/api/public') || 
        req.path.startsWith('/api/auth') || 
        !req.user?.id) {
      return next();
    }

    // Check if user is superadmin - superadmins should not have tenant access
    try {
      const superAdminCheck = await db.execute(sql`
        SELECT role FROM users WHERE id = ${req.user.id} AND role = 'superadmin'
      `);
      
      if (superAdminCheck.rows.length > 0) {
        return res.status(403).json({ 
          message: 'Superadmin users cannot access tenant routes' 
        });
      }
    } catch (error) {
      console.error('Superadmin check error:', error);
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
    // Check session-based authentication first
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.session.userId;

    // Check if user has superadmin role directly from users table
    const result = await db.execute(sql`
      SELECT role FROM users WHERE id = ${userId} AND role = 'superadmin'
    `);

    if (!result.rows.length) {
      return res.status(403).json({ 
        message: 'Super admin access required' 
      });
    }

    // Set req.user for consistency
    req.user = req.session.user || { id: userId };

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