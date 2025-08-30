// Database exports using Supabase
import { getDatabase } from './db/tenant-supabase';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Export db instance for existing code
export const db = getDatabase();

// Export tenant-aware helpers
export { withTenantSupabase as withTenantNeon, isLocal } from './db/tenant-supabase';
