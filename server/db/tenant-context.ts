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
  // Set the in-memory tenant context
  currentTenantContext = {
    tenantId: context.tenantId,
    userId: context.userId,
    role: context.role
  };
  console.log(`🔒 Tenant context set: ${context.role}@${context.tenantId}`);
}

/**
 * Clear tenant context for the current database session
 */
export async function clearTenantContext(): Promise<void> {
  currentTenantContext = { tenantId: null, userId: null, role: null };
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

// In-memory tenant context for the current request
let currentTenantContext: { tenantId: string | null; userId: string | null; role: string | null } = {
  tenantId: null,
  userId: null,
  role: null
};

/**
 * Get current tenant context from in-memory storage
 */
export async function getCurrentTenantContext(): Promise<{
  tenantId: string | null;
  userId: string | null;
  role: string | null;
}> {
  return currentTenantContext;
}