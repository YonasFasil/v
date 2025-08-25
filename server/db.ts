// Legacy db export for backward compatibility
// NEW CODE SHOULD USE withTenantNeon() from ./db/tenant-neon.ts
import { getDatabase } from './db/tenant-neon';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Export legacy db instance for existing code
export const db = getDatabase();

// Re-export tenant-aware helpers
export { withTenantNeon, isLocal } from './db/tenant-neon';
