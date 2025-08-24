const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkPolicyFormat() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('📋 Checking RLS policy format...\n');
    
    // Check one policy format
    const result = await pool.query(`
      SELECT policyname, cmd, qual::text as condition 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'bookings' 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const policy = result.rows[0];
      console.log('Policy:', policy.policyname);
      console.log('Command:', policy.cmd);
      console.log('Condition:', policy.condition);
      console.log();
    }
    
    // Test current_setting behavior
    console.log('📋 Testing current_setting behavior...\n');
    
    const client = await pool.connect();
    try {
      // Test setting and getting a variable
      await client.query("SET LOCAL app.current_tenant = 'test-tenant-123'");
      await client.query("SET LOCAL app.user_role = 'tenant_admin'");
      
      const tenantResult = await client.query("SELECT current_setting('app.current_tenant', true) as value");
      const roleResult = await client.query("SELECT current_setting('app.user_role', true) as value");
      const nonExistentResult = await client.query("SELECT current_setting('app.nonexistent', true) as value");
      
      console.log('Set tenant:', tenantResult.rows[0].value);
      console.log('Set role:', roleResult.rows[0].value);
      console.log('Non-existent setting:', `"${nonExistentResult.rows[0].value}"`);
      console.log('Non-existent length:', nonExistentResult.rows[0].value.length);
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPolicyFormat();