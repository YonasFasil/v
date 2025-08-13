import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string | null;
        role: string;
        permissions: string[];
      };
      tenant?: {
        id: string;
        name: string;
        status: string;
        subscriptionPackageId: string;
      };
    }
  }
}

/**
 * Extract tenant information from subdomain or custom domain
 */
export function extractTenantFromHost(hostname: string): string | null {
  // Handle localhost development
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    return null; // Super admin or development mode
  }

  // Extract subdomain (e.g., "marriott" from "marriott.yourdomain.com")
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0]; // subdomain
  }

  // Could also handle custom domains here by looking up in database
  return null;
}

/**
 * Middleware to identify and validate tenant based on request
 */
export async function tenantIdentification(req: Request, res: Response, next: NextFunction) {
  try {
    const hostname = req.get('host') || '';
    const tenantSubdomain = extractTenantFromHost(hostname);

    if (tenantSubdomain) {
      // Look up tenant by subdomain
      const tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, tenantSubdomain))
        .limit(1);

      if (tenant.length === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const tenantData = tenant[0];

      // Check if tenant is active
      if (tenantData.status === 'suspended' || tenantData.status === 'cancelled') {
        return res.status(403).json({ error: 'Account suspended' });
      }

      // Add tenant info to request
      req.tenant = {
        id: tenantData.id,
        name: tenantData.name,
        status: tenantData.status,
        subscriptionPackageId: tenantData.subscriptionPackageId,
      };
    }

    next();
  } catch (error) {
    console.error('Tenant identification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to ensure user belongs to the current tenant
 */
export function requireTenantUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.tenant) {
    return res.status(400).json({ error: 'No tenant context' });
  }

  // Super admin can access any tenant
  if (req.user.role === 'super_admin') {
    return next();
  }

  // User must belong to the current tenant
  if (req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}

/**
 * Middleware to require super admin role
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

/**
 * Middleware to require tenant admin role
 */
export function requireTenantAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admin can act as tenant admin
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Must be tenant admin for the current tenant
  if (req.user.role !== 'tenant_admin' || req.user.tenantId !== req.tenant?.id) {
    return res.status(403).json({ error: 'Tenant admin access required' });
  }

  next();
}

/**
 * Helper function to add tenant filter to queries
 */
export function addTenantFilter(req: Request): string | null {
  // Super admin sees all data
  if (req.user?.role === 'super_admin') {
    return null;
  }

  // Return current tenant ID for filtering
  return req.tenant?.id || null;
}

/**
 * Validate that user can only access their tenant's data
 */
export function validateTenantAccess(userTenantId: string | null, requestTenantId: string, req: Request): boolean {
  // Super admin can access any tenant's data
  if (req.user?.role === 'super_admin') {
    return true;
  }

  // User can only access their own tenant's data
  return userTenantId === requestTenantId;
}