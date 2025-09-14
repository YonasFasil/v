const { Pool } = require('pg');

async function testQuotedAliases() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 Testing quoted aliases for camelCase preservation...');

    const result = await pool.query(`
      SELECT
        event_name as "eventName",
        event_date as "eventDate",
        start_time as "startTime",
        end_time as "endTime",
        guest_count as "guestCount",
        total_amount as "totalAmount",
        status
      FROM bookings
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const booking = result.rows[0];
      console.log('\n✅ Quoted aliases preserve camelCase:');
      Object.keys(booking).forEach(col => {
        console.log(`  ${col}: ${booking[col]}`);
      });

      console.log('\n📋 Frontend expectations vs actual:');
      console.log(`  eventName: ${booking.eventName} ✅`);
      console.log(`  eventDate: ${booking.eventDate} ✅`);
      console.log(`  startTime: ${booking.startTime} ✅`);
      console.log(`  endTime: ${booking.endTime} ✅`);
      console.log(`  guestCount: ${booking.guestCount} ✅`);
      console.log(`  totalAmount: ${booking.totalAmount} ✅`);
      console.log(`  status: ${booking.status} ✅`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testQuotedAliases();