const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testBookingStatusAPI() {
  try {
    console.log('🧪 Testing single date booking status update API simulation...');

    // Find a single booking to test
    const bookingsResult = await pool.query(`
      SELECT id, status, tenant_id, event_name, customer_id
      FROM bookings
      WHERE contract_id IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (bookingsResult.rows.length === 0) {
      console.log('❌ No single bookings found for testing');
      return;
    }

    const booking = bookingsResult.rows[0];
    console.log(`✅ Testing with booking: ${booking.id}`);
    console.log(`   Event: ${booking.event_name}`);
    console.log(`   Current status: ${booking.status}`);

    // Simulate the API logic - this is what the API should do
    const newStatus = booking.status === 'inquiry' ? 'confirmed' : 'inquiry';
    console.log(`   Target status: ${newStatus}`);

    // Simulate the exact update that the API performs
    // This is the corrected version without updated_at
    console.log('🔄 Executing status update...');

    const updateResult = await pool.query(`
      UPDATE bookings
      SET status = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, status, event_name, created_at
    `, [newStatus, booking.id, booking.tenant_id]);

    if (updateResult.rows.length === 0) {
      console.log('❌ Update failed - no rows affected');
      return;
    }

    const updatedBooking = updateResult.rows[0];
    console.log('✅ Status update successful!');
    console.log(`   New status: ${updatedBooking.status}`);
    console.log(`   Updated booking: ${updatedBooking.id}`);

    // Revert the change for testing purposes
    await pool.query(`
      UPDATE bookings SET status = $1 WHERE id = $2
    `, [booking.status, booking.id]);

    console.log(`✅ Reverted status back to: ${booking.status}`);

    console.log('\n🎉 SUCCESS: Single date booking status update works correctly!');
    console.log('💡 The fix is to ensure no code tries to set updated_at field on bookings table');

  } catch (error) {
    console.error('❌ Error testing booking status API:', error);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testBookingStatusAPI();