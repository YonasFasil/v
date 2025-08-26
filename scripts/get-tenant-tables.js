const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function getTenantTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' 
        AND table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables with tenant_id column:');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.table_name}`);
    });
    
    console.log(`\nTotal: ${result.rows.length} tables`);
    
    // Return array for use in migration
    return result.rows.map(row => row.table_name);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

getTenantTables();