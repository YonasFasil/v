/**
 * Database-level tenant context management
 * This module handles setting tenant context at the database connection level
 * so that Row-Level Security (RLS) policies automatically filter data
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * Set tenant context for the current database session
 * This enables Row-Level Security policies to automatically filter data
 */
export async function setTenantContext(context: TenantContext): Promise<void> {
  try {
    // Check if we're using in-memory storage (skip database operations)
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.log(`🔒 Tenant context set (in-memory): ${context.role}@${context.tenantId}`);
      return;
    }
    
    // Set tenant context in database session using Drizzle
    await db.execute(sql`SET app.current_tenant = ${context.tenantId}`);
    await db.execute(sql`SET app.current_user = ${context.userId}`);
    await db.execute(sql`SET app.user_role = ${context.role}`);
    
    console.log(`🔒 Tenant context set: ${context.role}@${context.tenantId}`);
  } catch (error) {
    console.error('Failed to set tenant context:', error);
    // In development, don't throw error to allow in-memory storage to work
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Tenant context set (fallback): ${context.role}@${context.tenantId}`);
      return;
    }
    throw new Error('Database tenant context setup failed');
  }
}

/**
 * Clear tenant context for the current database session
 */
export async function clearTenantContext(): Promise<void> {
  try {
    // Skip database operations if using in-memory storage
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      return;
    }
    
    await db.execute(sql`SET app.current_tenant = ''`);
    await db.execute(sql`SET app.current_user = ''`);
    await db.execute(sql`SET app.user_role = ''`);
  } catch (error) {
    console.error('Failed to clear tenant context:', error);
  }
}

/**
 * Execute a function with tenant context set
 * Automatically cleans up context after execution
 */
export async function withTenantContext<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  await setTenantContext(context);
  try {
    return await fn();
  } finally {
    await clearTenantContext();
  }
}

/**
 * Get current tenant context from database session
 */
export async function getCurrentTenantContext(): Promise<{
  tenantId: string | null;
  userId: string | null;
  role: string | null;
}> {
  try {
    const tenantIdResult = await db.execute(sql`SELECT current_setting('app.current_tenant', true) as tenant_id`);
    const userIdResult = await db.execute(sql`SELECT current_setting('app.current_user', true) as user_id`);
    const roleResult = await db.execute(sql`SELECT current_setting('app.user_role', true) as role`);
    
    return {
      tenantId: (tenantIdResult.rows[0] as any)?.tenant_id as string || null,
      userId: (userIdResult.rows[0] as any)?.user_id as string || null,
      role: (roleResult.rows[0] as any)?.role as string || null,
    };
  } catch (error) {
    console.error('Failed to get tenant context:', error);
    return { tenantId: null, userId: null, role: null };
  }
}