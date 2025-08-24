const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugSessionVars() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  const client = await pool.connect();
  
  try {
    console.log('📋 Testing different session variable approaches...\n');
    
    // Method 1: SET LOCAL with quotes
    console.log('Method 1: SET LOCAL with quotes');
    await client.query("SET LOCAL app.current_tenant = 'test-tenant-123'");
    await client.query("SET LOCAL app.user_role = 'tenant_admin'");
    
    const result1 = await client.query("SHOW app.current_tenant");
    console.log('SHOW result:', result1.rows[0]);
    
    // Method 2: current_setting
    const result2 = await client.query("SELECT current_setting('app.current_tenant') as value");
    console.log('current_setting result:', result2.rows[0].value);
    
    // Method 3: Check if setting exists
    const result3 = await client.query(`
      SELECT name, setting 
      FROM pg_settings 
      WHERE name LIKE 'app.%'
    `);
    console.log('pg_settings:', result3.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Try alternative approach with SET without LOCAL
    console.log('\nTrying SET without LOCAL...');
    try {
      await client.query("SET app.current_tenant = 'test-tenant-123'");
      await client.query("SET app.user_role = 'tenant_admin'");
      
      const altResult = await client.query("SELECT current_setting('app.current_tenant') as value");
      console.log('Alternative result:', altResult.rows[0].value);
      
    } catch (altError) {
      console.error('Alternative error:', altError.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

debugSessionVars();