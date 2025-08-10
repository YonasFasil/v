import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { tenantUsers, tenants } from '@shared/schema';
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
        !(req.session as any)?.userId) {
      return next();
    }

    // Check if user is superadmin - superadmins should not have tenant access
    try {
      const superAdminCheck = await db.execute(sql`
        SELECT user_id FROM super_admins WHERE user_id = ${(req.session as any).userId}
      `);
      
      if (superAdminCheck.rows.length > 0) {
        console.log('Blocking super admin from accessing tenant route:', req.path);
        return res.status(403).json({ 
          message: 'Super admin users cannot access tenant routes. Please use super admin dashboard.' 
        });
      }
    } catch (error) {
      console.error('Superadmin check error:', error);
    }

    const userId = (req.session as any).userId;

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

    // Get user permissions from database
    const userPermissions = await db
      .select({ permissions: tenantUsers.permissions })
      .from(tenantUsers)
      .where(and(
        eq(tenantUsers.tenantId, tenantUser[0].tenantId),
        eq(tenantUsers.userId, userId)
      ))
      .limit(1);

    (req as any).userPermissions = userPermissions[0]?.permissions || {};

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
    console.log('requireSuperAdmin: session check', req.session?.userId);
    
    // Check session-based authentication first
    if (!(req.session as any)?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = (req.session as any).userId;
    console.log('requireSuperAdmin: checking userId:', userId);

    // Check if user is super admin using super_admins table
    const result = await db.execute(sql`
      SELECT user_id FROM super_admins WHERE user_id = ${userId}
    `);
    
    console.log('requireSuperAdmin: super admin query result:', result.rows);

    if (!result.rows.length) {
      return res.status(403).json({ 
        message: 'Super admin access required' 
      });
    }

    // Set req.user for consistency with audit logging
    req.user = {
      id: userId,
      claims: { sub: userId }
    };

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