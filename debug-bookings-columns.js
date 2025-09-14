const { Pool } = require('pg');

async function debugBookingsColumns() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Debugging bookings column names...');

    // Get a sample booking with original columns
    const original = await pool.query(`SELECT * FROM bookings LIMIT 1`);

    if (original.rows.length > 0) {
      const booking = original.rows[0];
      console.log('\n📋 Original database columns:');
      Object.keys(booking).forEach(col => {
        console.log(`  ${col}: ${booking[col]}`);
      });

      console.log('\n🧪 Testing the problematic query...');
      // Test just the alias query
      const aliasTest = await pool.query(`
        SELECT
          event_name as eventName,
          event_date as eventDate,
          start_time as startTime,
          end_time as endTime,
          guest_count as guestCount,
          total_amount as totalAmount
        FROM bookings
        LIMIT 1
      `);

      if (aliasTest.rows.length > 0) {
        const result = aliasTest.rows[0];
        console.log('\n✅ Aliased columns:');
        Object.keys(result).forEach(col => {
          console.log(`  ${col}: ${result[col]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugBookingsColumns();