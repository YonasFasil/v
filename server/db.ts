// Clean Drizzle ORM setup - re-export from drizzle.ts
export { db, default } from './db/drizzle';
export * from './db/drizzle';

// Export isLocal helper for compatibility
export const isLocal = process.env.NODE_ENV === "development";

// Tenant isolation function for Neon
export async function withTenantNeon<T>(
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  // For Neon with Drizzle, we rely on RLS policies and application-level filtering
  // The tenantId is used in queries and storage methods for proper isolation
  return callback();
}
