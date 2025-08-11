import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        slug: string;
        name: string;
      };
      userRole?: string;
    }
  }
}

export interface TenantRequest extends Request {
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  userRole: string;
}

// Tenant context middleware - gets tenant from slug in URL or user's primary tenant
export const tenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let tenantSlug: string | undefined;

    // Try to get tenant slug from URL path (/t/:slug/*)
    const slugMatch = req.path.match(/^\/t\/([^\/]+)/);
    if (slugMatch) {
      tenantSlug = slugMatch[1];
    }

    // Get tenant and user role
    let tenant;
    let userRole;

    if (tenantSlug) {
      // Get tenant by slug
      tenant = await storage.getTenantBySlug(tenantSlug);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      // Verify user has access to this tenant
      const tenantUser = await storage.getUserTenantRole(tenant.id, req.user.id);
      if (!tenantUser) {
        return res.status(403).json({ message: 'Access denied to this tenant' });
      }

      userRole = tenantUser.role;
    } else {
      // Get user's primary tenant
      const primaryTenant = await storage.getUserPrimaryTenant(req.user.id);
      if (!primaryTenant) {
        return res.status(404).json({ message: 'No tenant found for user' });
      }

      tenant = primaryTenant.tenant;
      userRole = primaryTenant.role;
    }

    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    };
    req.userRole = userRole;

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Owner or admin access
export const requireOwnerOrAdmin = requireRole(['owner', 'admin']);

// Manager or above access
export const requireManagerOrAbove = requireRole(['owner', 'admin', 'manager']);