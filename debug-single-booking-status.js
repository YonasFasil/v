const { Pool } = require('pg');

async function testSingleBookingStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // First, let's find a single-date booking to test with
    const result = await pool.query(`
      SELECT b.id, b.event_name, b.status, b.tenant_id,
             CASE WHEN c.id IS NOT NULL THEN true ELSE false END as is_contract
      FROM bookings b
      LEFT JOIN contracts c ON b.contract_id = c.id
      WHERE c.id IS NULL
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ No single-date bookings found');
      return;
    }

    const booking = result.rows[0];
    console.log('📅 Found single-date booking:', {
      id: booking.id,
      name: booking.event_name,
      currentStatus: booking.status,
      isContract: booking.is_contract
    });

    // Test the API endpoint that's failing
    const testUrl = `http://localhost:3001/api/bookings/${booking.id}`;
    console.log('🔍 Testing API endpoint:', testUrl);

    // First test with GET to see if the booking exists
    const getResponse = await fetch(testUrl);
    console.log('GET Response status:', getResponse.status);

    if (getResponse.ok) {
      const bookingData = await getResponse.json();
      console.log('✅ GET successful - booking data:', {
        id: bookingData.id,
        status: bookingData.status
      });
    } else {
      console.log('❌ GET failed:', await getResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testSingleBookingStatus();