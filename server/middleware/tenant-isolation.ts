import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';

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

// ============================================================================
// ROW-LEVEL SECURITY SESSION VARIABLE ENFORCEMENT
// ============================================================================

// Database pool for session variable setting
let rlsPool: Pool | null = null;

function getRLSPool(): Pool {
  if (!rlsPool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL must be set for RLS tenant isolation');
    }
    
    // Support both local PostgreSQL and Supabase for session variables
    // Supabase supports persistent session state within transactions
    const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    const isSupabase = databaseUrl.includes('supabase.co');
    
    if (!isLocal && !isSupabase) {
      throw new Error('RLS tenant isolation requires local PostgreSQL or Supabase connection');
    }
    
    rlsPool = new Pool({
      connectionString: databaseUrl,
      max: 15, // Slightly higher for RLS connections
      min: 3,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    });
    
    rlsPool.on('error', (err) => {
      console.error('🚨 RLS Pool error:', err);
    });
  }
  
  return rlsPool;
}

/**
 * Middleware to enforce Row-Level Security through PostgreSQL session variables
 * 
 * This sets the database session variables that RLS policies use:
 * - app.current_tenant = tenant_uuid
 * - app.user_role = user_role
 * 
 * MUST be applied after authentication middleware.
 */
export async function enforceRLSTenantIsolation(req: Request, res: Response, next: NextFunction) {
  // Skip if no authenticated user
  if (!req.user) {
    return next();
  }
  
  try {
    const pool = getRLSPool();
    const client = await pool.connect();
    
    try {
      // Determine tenant context
      const tenantId = req.user.tenantId || req.tenant?.id || null;
      const userRole = req.user.role;
      
      console.log(`🔒 Setting RLS context: tenant=${tenantId || 'NULL'}, role=${userRole}`);
      
      // Begin transaction to make SET LOCAL work properly
      await client.query('BEGIN');
      
      // Set app.current_tenant - used by RLS policies for tenant filtering
      if (tenantId) {
        await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
      } else {
        // For super_admin or users without tenant context
        await client.query('SET LOCAL app.current_tenant = \'\'');
      }
      
      // Set app.user_role - used by RLS policies for role-based access
      await client.query(`SET LOCAL app.user_role = '${userRole}'`);
      
      // Attach the RLS-aware client to the request
      // This client has the session variables set and persists for the request
      (req as any).rlsClient = client;
      
      // Cleanup when request ends
      res.on('finish', async () => {
        if ((req as any).rlsClient) {
          try {
            await (req as any).rlsClient.query('COMMIT');
          } catch (e) {
            console.log('⚠️ Transaction already ended');
          }
          (req as any).rlsClient.release();
          console.log('🔓 Released RLS tenant context connection');
        }
      });
      
      res.on('close', async () => {
        if ((req as any).rlsClient) {
          try {
            await (req as any).rlsClient.query('ROLLBACK');
          } catch (e) {
            console.log('⚠️ Transaction already ended');
          }
          (req as any).rlsClient.release();
          console.log('🔓 Released RLS tenant context connection (close)');
        }
      });
      
      next();
      
    } catch (sessionError) {
      client.release();
      console.error('❌ Failed to set RLS session variables:', sessionError);
      return res.status(500).json({ 
        error: 'Database tenant isolation setup failed',
        message: sessionError.message 
      });
    }
    
  } catch (connectionError) {
    console.error('❌ Failed to connect for RLS tenant isolation:', connectionError);
    return res.status(500).json({ 
      error: 'Database connection failed for tenant isolation',
      message: connectionError.message 
    });
  }
}

/**
 * Get the RLS-aware database client from request
 * Use this instead of the global `db` to ensure tenant isolation
 */
export function getRLSClient(req: Request) {
  const client = (req as any).rlsClient;
  if (!client) {
    throw new Error('RLS client not available. Ensure enforceRLSTenantIsolation middleware is applied.');
  }
  return client;
}

/**
 * Execute database operation with specific tenant context
 * Useful for background jobs or operations outside request context
 */
export async function withTenantRLSContext<T>(
  tenantId: string | null,
  userRole: string,
  operation: (client: any) => Promise<T>
): Promise<T> {
  const pool = getRLSPool();
  const client = await pool.connect();
  
  try {
    console.log(`🔒 Setting background RLS context: tenant=${tenantId || 'NULL'}, role=${userRole}`);
    
    // Begin transaction for SET LOCAL
    await client.query('BEGIN');
    
    // Set session variables
    if (tenantId) {
      await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    } else {
      await client.query('SET LOCAL app.current_tenant = \'\'');
    }
    
    await client.query(`SET LOCAL app.user_role = '${userRole}'`);
    
    // Execute operation with RLS context
    const result = await operation(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return result;
    
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.log('⚠️ Rollback error:', rollbackError.message);
    }
    throw error;
  } finally {
    client.release();
    console.log('🔓 Released background RLS context');
  }
}