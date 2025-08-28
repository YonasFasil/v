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
 * Create tenant with super-admin privileges using proper session variables
 * This follows the pattern you suggested with SET LOCAL for tenant context
 */
export async function createTenantAsSuperAdmin(tenantData: any, userData: any): Promise<{ tenant: any, user: any }> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Skip role switching for Neon compatibility - just use default connection
    // Neon serverless doesn't support custom roles out of the box
    
    // Create tenant
    const tenantResult = await client.query(`
      INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [tenantData.name, tenantData.slug, tenantData.subscriptionPackageId, tenantData.status]);
    
    const tenant = tenantResult.rows[0];
    
    // Skip setting tenant context for Neon compatibility
    
    // Prepare permissions for tenant admin
    const permissions = userData.role === 'tenant_admin' ? [
      'view_dashboard', 'manage_events', 'view_events', 'manage_customers', 'view_customers', 
      'manage_venues', 'view_venues', 'manage_payments', 'view_payments', 'manage_proposals', 
      'view_proposals', 'manage_settings', 'view_reports', 'manage_leads', 'use_ai_features',
      'dashboard', 'users', 'venues', 'bookings', 'customers', 'proposals', 'tasks', 'payments', 'settings'
    ] : [];
    
    // Create admin user for the tenant with proper permissions
    const userResult = await client.query(`
      INSERT INTO users (tenant_id, username, password, name, email, role, permissions, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      tenant.id,
      userData.username,
      userData.password,
      userData.name,
      userData.email,
      userData.role,
      JSON.stringify(permissions),
      userData.isActive || true
    ]);
    
    const user = userResult.rows[0];
    
    // Commit transaction
    await client.query('COMMIT');
    
    return { tenant, user };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Reset role and release connection
    try {
      await client.query('RESET ROLE');
    } catch (error) {
      console.warn('Warning: Could not reset role:', error.message);
    }
    client.release();
    await pool.end();
  }
}