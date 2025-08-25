const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testDirectTenantCreation() {
  console.log('🧪 Testing direct tenant creation with elevated role...\n');
  
  const pool = new Pool({
    user: 'postgres',
    password: 'ZxOp1029!!%%',
    host: 'localhost',
    port: 5432,
    database: 'venuedb'
  });

  try {
    console.log('1️⃣ Creating tenant as postgres superuser...');
    
    const tenantResult = await pool.query(`
      INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
      VALUES ($1, $2, (SELECT id FROM subscription_packages LIMIT 1), 'active', NOW())
      RETURNING *
    `, ['Test Direct Tenant', 'test-direct-tenant']);
    
    console.log('✅ Tenant created successfully:');
    console.log(`   ID: ${tenantResult.rows[0].id}`);
    console.log(`   Name: ${tenantResult.rows[0].name}`);
    
    console.log('\n2️⃣ Creating user for the tenant...');
    
    const userResult = await pool.query(`
      INSERT INTO users (tenant_id, username, password, name, email, role, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [
      tenantResult.rows[0].id,
      'testadmin',
      '$2b$10$hashedPasswordExample',
      'Test Admin',
      'testadmin@direct.com',
      'tenant_admin',
      true
    ]);
    
    console.log('✅ User created successfully:');
    console.log(`   ID: ${userResult.rows[0].id}`);
    console.log(`   Email: ${userResult.rows[0].email}`);
    
    console.log('\n🎉 Direct tenant creation works with postgres superuser');
    console.log('   The issue is with role permissions, not SQL syntax');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await pool.query('DELETE FROM users WHERE email = $1', ['testadmin@direct.com']);
    await pool.query('DELETE FROM tenants WHERE slug = $1', ['test-direct-tenant']);
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDirectTenantCreation();