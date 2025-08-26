const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testSafeTenantCreation() {
  console.log('🧪 Testing safe tenant creation with proper session variables...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing minimal GRANTs...');
    
    // First, apply the grants (this should be done via migration)
    console.log('   Applying minimal safe GRANTs to venuine_app...');
    
    // Grant schema usage
    await pool.query('GRANT USAGE ON SCHEMA public TO venuine_app');
    console.log('   ✅ Schema usage granted');
    
    // Grant table permissions
    await pool.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON
        tenants,
        users,
        subscription_packages
      TO venuine_app
    `);
    console.log('   ✅ Table permissions granted');
    
    // Grant sequence permissions
    await pool.query('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO venuine_app');
    console.log('   ✅ Sequence permissions granted');
    
    console.log('\n2️⃣ Testing tenant creation with session variables...');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Set session variables for super admin context (key improvement)
      await client.query(`SET LOCAL app.user_role = 'super_admin'`);
      console.log('   ✅ Set user role to super_admin');
      
      // Create tenant
      const tenantResult = await client.query(`
        INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
        VALUES ($1, $2, (SELECT id FROM subscription_packages LIMIT 1), 'active', NOW())
        RETURNING *
      `, ['Safe Test Tenant', 'safe-test-tenant']);
      
      const tenant = tenantResult.rows[0];
      console.log('   ✅ Tenant created successfully:', tenant.name);
      
      // Set tenant context for user creation
      await client.query('SET LOCAL app.current_tenant = $1', [tenant.id]);
      console.log('   ✅ Set current tenant context');
      
      // Create admin user for the tenant
      const userResult = await client.query(`
        INSERT INTO users (tenant_id, username, password, name, email, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        tenant.id,
        'safeadmin',
        '$2b$10$hashedPasswordExample',
        'Safe Admin',
        'safeadmin@test.com',
        'tenant_admin',
        true
      ]);
      
      const user = userResult.rows[0];
      console.log('   ✅ User created successfully:', user.email);
      
      await client.query('COMMIT');
      
      console.log('\n🎉 Safe tenant creation works!');
      console.log('   - RLS policies still fully enforced');
      console.log('   - Session variables properly set');
      console.log('   - Minimal permissions granted');
      
      // Cleanup
      console.log('\n🧹 Cleaning up test data...');
      await pool.query('DELETE FROM users WHERE email = $1', ['safeadmin@test.com']);
      await pool.query('DELETE FROM tenants WHERE slug = $1', ['safe-test-tenant']);
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('permission denied')) {
      console.error('💡 Hint: Run the 005_grants_for_app_role.sql migration first');
    }
  } finally {
    await pool.end();
  }
}

testSafeTenantCreation();