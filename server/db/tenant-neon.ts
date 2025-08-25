import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const databaseUrl = process.env.DATABASE_URL;
const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

/**
 * Tenant-aware Neon/PostgreSQL wrapper
 * Ensures all database operations run within proper tenant context using transactions
 */
export async function withTenantNeon<T>(
  tenantId: string, 
  userRole: string, 
  run: (tx: any) => Promise<T>
): Promise<T> {
  if (isLocal) {
    // Local PostgreSQL with node-postgres
    const pool = new Pool({ connectionString: databaseUrl });
    
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
  } else {
    // Neon database with neon-http
    const sql = neon(databaseUrl);
    const db = drizzleNeon(sql, { schema });
    
    // For Neon, use transaction with SET LOCAL
    return await db.transaction(async (tx) => {
      // Set tenant context within transaction
      await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
      await tx.execute(sql`SET LOCAL app.current_user_role = ${userRole}`);
      
      return await run(tx);
    });
  }
}

/**
 * Get the appropriate database instance (for non-tenant operations)
 */
export function getDatabase() {
  if (isLocal) {
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 10,
      min: 2,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 5000,
    });
    
    return drizzleNode(pool, { 
      schema,
      logger: process.env.NODE_ENV === 'development' 
    });
  } else {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { 
      schema,
      logger: process.env.NODE_ENV === 'development' 
    });
  }
}

export { isLocal };