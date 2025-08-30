import { Pool } from 'pg';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const databaseUrl = process.env.DATABASE_URL;

/**
 * Tenant-aware Supabase PostgreSQL wrapper
 * Ensures all database operations run within proper tenant context using transactions
 */
export async function withTenantSupabase<T>(
  tenantId: string, 
  userRole: string, 
  run: (tx: any) => Promise<T>
): Promise<T> {
  // Use PostgreSQL with node-postgres for Supabase
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    return await pool.connect().then(async (client) => {
      try {
        await client.query('BEGIN');
        
        // Set tenant context within transaction
        await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);
        await client.query('SET LOCAL app.current_user_role = $1', [userRole]);
        
        // Create drizzle instance for this transaction
        const tx = drizzleNode(client, { schema });
        
        const result = await run(tx);
        
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  } finally {
    await pool.end();
  }
}

/**
 * Get the Supabase database instance (for non-tenant operations)
 */
export function getDatabase() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    min: 2,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 5000,
  });
  
  return drizzleNode(pool, { 
    schema,
    logger: process.env.NODE_ENV === 'development' 
  });
}

export const isLocal = false; // Always use Supabase connection