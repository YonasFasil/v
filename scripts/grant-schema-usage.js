const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function grantSchemaUsage() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('📋 Granting schema usage to venuine_app...\n');
    
    await pool.query('GRANT USAGE ON SCHEMA public TO venuine_app');
    console.log('✅ Granted USAGE on SCHEMA public to venuine_app');
    
    // Also grant sequence usage for INSERT operations
    await pool.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO venuine_app');
    console.log('✅ Granted USAGE, SELECT on all sequences to venuine_app');
    
    console.log('\n✅ Schema permissions granted successfully');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

grantSchemaUsage();