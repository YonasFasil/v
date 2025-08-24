const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testAppRoleInsert() {
  // Test as venuine_app role
  const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb";
  const appRoleUrl = databaseUrl.replace(/\/\/[^:]*:[^@]*@/, '//venuine_app:venuine_app_secure_password_2024!@');
  
  const pool = new Pool({ connectionString: appRoleUrl });

  try {
    console.log('📋 Testing INSERT as venuine_app role...\n');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Set context first
      await client.query('SELECT set_config($1, $2, true)', ['app.user_role', 'super_admin']);
      await client.query('SELECT set_config($1, $2, true)', ['app.current_tenant', '']);
      
      // Try to insert a test record
      const testId = '99999999-9999-9999-9999-999999999999';
      const testTenantId = '88888888-8888-8888-8888-888888888888';
      
      await client.query(`
        INSERT INTO customers (id, tenant_id, name, email, phone, status) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [testId, testTenantId, 'Test App Role', 'test@approle.com', '999-999-9999', 'active']);
      
      console.log('✅ INSERT successful as venuine_app');
      
      // Try to select it back
      const result = await client.query('SELECT name FROM customers WHERE id = $1', [testId]);
      console.log(`✅ SELECT successful: ${result.rows[0]?.name || 'not found'}`);
      
      // Clean up
      await client.query('DELETE FROM customers WHERE id = $1', [testId]);
      console.log('✅ DELETE successful (cleanup)');
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Operation failed: ${error.message}`);
      console.error(`   Code: ${error.code}`);
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
  } finally {
    await pool.end();
  }
}

testAppRoleInsert();