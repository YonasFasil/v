import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

/**
 * Execute operations with super-admin privileges
 * Uses role switching to temporarily elevate permissions
 */
export async function withSuperAdminRole<T>(
  operation: (client: any) => Promise<T>
): Promise<T> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const client = await pool.connect();
  
  try {
    // Switch to super-admin role for elevated permissions
    await client.query('SET ROLE venuine_super_admin');
    
    // Execute the operation
    const result = await operation(client);
    
    return result;
  } finally {
    // Always reset role and release connection
    try {
      await client.query('RESET ROLE');
    } catch (error) {
      console.warn('Warning: Could not reset role:', error.message);
    }
    client.release();
    await pool.end();
  }
}

/**
 * Create tenant with super-admin privileges
 */
export async function createTenantAsSuperAdmin(tenantData: any, userData: any): Promise<{ tenant: any, user: any }> {
  return await withSuperAdminRole(async (client) => {
    // Begin transaction
    await client.query('BEGIN');
    
    try {
      // Create tenant
      const tenantResult = await client.query(`
        INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [tenantData.name, tenantData.slug, tenantData.subscriptionPackageId, tenantData.status]);
      
      const tenant = tenantResult.rows[0];
      
      // Create admin user for the tenant
      const userResult = await client.query(`
        INSERT INTO users (tenant_id, username, password, name, email, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        tenant.id,
        userData.username,
        userData.password,
        userData.name,
        userData.email,
        userData.role,
        userData.isActive || true
      ]);
      
      const user = userResult.rows[0];
      
      // Commit transaction
      await client.query('COMMIT');
      
      return { tenant, user };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}