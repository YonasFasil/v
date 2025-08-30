// Database exports using Neon
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const sql = neon(process.env.DATABASE_URL);

// Export db instance for existing code
export const db = drizzle(sql, { schema });

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
