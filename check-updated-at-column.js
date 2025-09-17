const { Pool } = require('pg');

async function checkUpdatedAtColumn() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Checking if bookings table has updated_at column...\n");

    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY column_name
    `);

    console.log('Bookings table columns:');
    result.rows.forEach(row => console.log('  -', row.column_name));

    const hasUpdatedAt = result.rows.some(row => row.column_name === 'updated_at');
    console.log('\nHas updated_at column:', hasUpdatedAt);

    if (!hasUpdatedAt) {
      console.log('\n❌ PROBLEM FOUND:');
      console.log('The individual booking PATCH handler tries to set updated_at = NOW()');
      console.log('But the updated_at column does not exist in the bookings table!');
      console.log('This is causing the 500 error when editing single day events.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUpdatedAtColumn();