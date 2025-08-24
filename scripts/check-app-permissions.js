const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkAppPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('📋 Checking venuine_app role permissions...\n');
    
    // Check table-level grants
    const grants = await pool.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE grantee = 'venuine_app' 
      ORDER BY table_name, privilege_type
    `);
    
    console.log('Table Grants:');
    grants.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.privilege_type}`);
    });
    
    console.log('\n📋 Checking schema permissions...\n');
    
    // Check schema grants
    const schemaGrants = await pool.query(`
      SELECT grantee, object_name as schema_name, privilege_type 
      FROM information_schema.usage_privileges 
      WHERE grantee = 'venuine_app'
    `);
    
    console.log('Schema Grants:');
    schemaGrants.rows.forEach(row => {
      console.log(`   ${row.schema_name}: ${row.privilege_type}`);
    });
    
    console.log('\n📋 Testing connection as venuine_app...\n');
    
    // Test connection as venuine_app
    const appUrl = process.env.DATABASE_URL.replace(/\/\/[^:]*:[^@]*@/, '//venuine_app:venuine_app_secure_password_2024!@');
    const appPool = new Pool({ connectionString: appUrl });
    
    try {
      const appClient = await appPool.connect();
      try {
        const testResult = await appClient.query('SELECT COUNT(*) as count FROM customers LIMIT 1');
        console.log(`✅ Connection successful, can read customers table (${testResult.rows[0].count} rows)`);
      } finally {
        appClient.release();
      }
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
    } finally {
      await appPool.end();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAppPermissions();