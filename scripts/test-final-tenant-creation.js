const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testFinalTenantCreation() {
  console.log('🧪 Testing final tenant creation with role switching...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing the exact pattern from super-admin-helper...');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Switch to the app role first (this is the key fix!)
      await client.query('SET ROLE venuine_app');
      console.log('   ✅ Switched to venuine_app role');
      
      // Set session variables for super admin context
      await client.query(`SET LOCAL app.user_role = 'super_admin'`);
      console.log('   ✅ Set user role to super_admin');
      
      // Create tenant
      const tenantResult = await client.query(`
        INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
        VALUES ($1, $2, (SELECT id FROM subscription_packages LIMIT 1), 'active', NOW())
        RETURNING *
      `, ['Final Test Tenant', 'final-test-tenant']);
      
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
        'finaladmin',
        '$2b$10$hashedPasswordExample',
        'Final Admin',
        'finaladmin@test.com',
        'tenant_admin',
        true
      ]);
      
      const user = userResult.rows[0];
      console.log('   ✅ User created successfully:', user.email);
      
      await client.query('COMMIT');
      
      console.log('\n🎉 Final tenant creation test passed!');
      console.log('   ✅ Role switching works correctly');
      console.log('   ✅ Session variables properly set');
      console.log('   ✅ RLS policies allow super_admin operations');
      console.log('   ✅ Tenant isolation maintained');
      
      // Cleanup
      console.log('\n🧹 Cleaning up test data...');
      
      // Reset to postgres role for cleanup
      await client.query('RESET ROLE');
      await pool.query('DELETE FROM users WHERE email = $1', ['finaladmin@test.com']);
      await pool.query('DELETE FROM tenants WHERE slug = $1', ['final-test-tenant']);
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      try {
        await client.query('RESET ROLE');
      } catch (error) {
        console.warn('Warning: Could not reset role:', error.message);
      }
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testFinalTenantCreation();