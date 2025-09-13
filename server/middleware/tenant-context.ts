import { Request, Response, NextFunction } from 'express';
import { setTenantContext, clearTenantContext, TenantContext } from '../db/tenant-context';
import { verifyToken } from './auth';
import { storage, setMemStorageTenantContext } from '../storage';

/**
 * Helper to get tenant ID from auth token
 * Supports super-admin assumed tenant context
 */
async function getTenantIdFromAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }
  
  // Check if super-admin has assumed a tenant
  if (decoded.role === 'super_admin' && decoded.assumedTenantId) {
    console.log(`🔐 Super-admin assuming tenant context: ${decoded.assumedTenantId}`);
    return decoded.assumedTenantId;
  }
  
  // Get user to find their tenant ID (using direct lookup to avoid circular dependency)
  const user = await storage.getUserByIdDirect(decoded.id);
  return user?.tenantId || null;
}

/**
 * Helper to get user from auth token
 */
async function getUserFromAuth(req: Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }
  
  // Get user details (using direct lookup to avoid circular dependency)
  const user = await storage.getUserByIdDirect(decoded.id);
  return user || null;
}

/**
 * Middleware to set database-level tenant context
 * This enables Row-Level Security policies to automatically filter data
 */
export async function setDatabaseTenantContext(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract tenant and user info from auth
    const tenantId = await getTenantIdFromAuth(req);
    const user = await getUserFromAuth(req);
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // For super admin, check if they've assumed a tenant
    if (user.role === 'super_admin') {
      const context: TenantContext = {
        tenantId: tenantId || 'super_admin',
        userId: user.id,
        role: 'super_admin'
      };
      await setTenantContext(context);
      
      // If assuming tenant, use the assumed tenant for data filtering
      const effectiveTenantId = tenantId && tenantId !== 'super_admin' ? tenantId : 'super_admin';
      setMemStorageTenantContext(effectiveTenantId, context.role);
      
      if (tenantId && tenantId !== 'super_admin') {
        console.log(`🔐 Super-admin operating with tenant context: ${tenantId}`);
      }
    } else {
      // For tenant users, require tenant context
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      
      const context: TenantContext = {
        tenantId,
        userId: user.id,
        role: user.role
      };
      await setTenantContext(context);
      // Also set in-memory context for MemStorage
      setMemStorageTenantContext(context.tenantId, context.role);
    }

    // Store context in request for potential use
    req.tenantContext = {
      tenantId: tenantId || 'super_admin',
      userId: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Tenant context middleware error:', error);
    res.status(500).json({ message: 'Failed to set tenant context' });
  }
}

/**
 * Middleware to clear database tenant context after request
 */
export async function clearDatabaseTenantContext(req: Request, res: Response, next: NextFunction) {
  // Clear context after response is sent
  res.on('finish', async () => {
    try {
      await clearTenantContext();
    } catch (error) {
      console.error('Failed to clear tenant context:', error);
    }
  });
  
  next();
}

/**
 * Combined middleware that sets context before and clears after
 */
export function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  setDatabaseTenantContext(req, res, (err) => {
    if (err) return next(err);
    
    // Set up cleanup
    clearDatabaseTenantContext(req, res, next);
  });
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        tenantId: string;
        userId: string;
        role: string;
      };
    }
  }
}