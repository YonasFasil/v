const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkVersion() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    const result = await pool.query('SELECT version()');
    console.log('PostgreSQL Version:', result.rows[0].version);
    
    // Check if relforcerowsecurity column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pg_class' 
        AND column_name = 'relforcerowsecurity'
    `);
    
    console.log('FORCE RLS support:', columnCheck.rows.length > 0 ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVersion();