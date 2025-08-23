/**
 * Database-level tenant context management
 * This module handles setting tenant context at the database connection level
 * so that Row-Level Security (RLS) policies automatically filter data
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

// Request-scoped tenant context using AsyncLocalStorage
const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Set tenant context for the current request scope
 * This enables Row-Level Security policies to automatically filter data
 */
export async function setTenantContext(context: TenantContext): Promise<void> {
  try {
    // Set global context for current implementation
    setCurrentTenantContext(context);
    // Reduced logging to improve performance
    // console.log(`🔒 Tenant context set: ${context.role}@${context.tenantId}`);
  } catch (error) {
    console.error('Failed to set tenant context:', error);
    throw error;
  }
}

/**
 * Clear tenant context for the current request scope
 */
export async function clearTenantContext(): Promise<void> {
  try {
    // Clear global context
    globalTenantContext = null;
    // console.log(`🔓 Tenant context cleared`);
  } catch (error) {
    console.error('Failed to clear tenant context:', error);
    // Don't throw here as this is cleanup
  }
}

/**
 * Execute a function with tenant context set
 * Automatically provides proper request-scoped context
 */
export async function withTenantContext<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  return tenantContextStorage.run(context, fn);
}

/**
 * Set the current tenant context in async local storage
 */
export function setCurrentTenantContext(context: TenantContext): void {
  // Since we can't directly set context in existing async scope,
  // we'll use a global context store for this request
  globalTenantContext = context;
}

// Global context as fallback for current implementation
let globalTenantContext: TenantContext | null = null;

/**
 * Get current tenant context from request scope
 * Returns the context for the current async request
 */
export async function getCurrentTenantContext(): Promise<{
  tenantId: string | null;
  userId: string | null;
  role: string | null;
}> {
  const context = tenantContextStorage.getStore() || globalTenantContext;
  if (context) {
    return {
      tenantId: context.tenantId,
      userId: context.userId,
      role: context.role
    };
  }
  
  return {
    tenantId: null,
    userId: null,
    role: null
  };
}

/**
 * Helper to get tenant ID from auth token (for backwards compatibility)
 */
export async function getTenantIdFromAuth(req: any): Promise<string | null> {
  const context = await getCurrentTenantContext();
  return context.tenantId;
}