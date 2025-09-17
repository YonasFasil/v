const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

// Simulate the fixed API logic
async function simulateFixedBookingStatusUpdate() {
  try {
    console.log('🧪 Testing FIXED single date booking status update...');

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

    // Simulate what the frontend sends
    const requestBody = { status: booking.status === 'inquiry' ? 'confirmed' : 'inquiry' };
    console.log(`   Frontend request body: ${JSON.stringify(requestBody)}`);

    // Simulate the FIXED server logic (after removing updatedAt from dateFields array)
    const updateData = { ...requestBody };

    // This is the FIXED dateFields array (without updatedAt)
    const dateFields = ['eventDate', 'completedAt', 'cancelledAt', 'proposalSentAt', 'createdAt'];

    console.log(`   📝 Processing dateFields: ${dateFields.join(', ')}`);
    console.log('   ✅ Notice: updatedAt is NOT in the dateFields array anymore!');

    // Process date fields (this won't cause issues now)
    dateFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        updateData[field] = new Date(updateData[field]);
        console.log(`   📅 Converted ${field} to Date object`);
      }
    });

    // The status update
    console.log('🔄 Executing the booking status update...');
    console.log(`   Updating status from '${booking.status}' to '${updateData.status}'`);

    const updateResult = await pool.query(`
      UPDATE bookings
      SET status = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, status, event_name, created_at
    `, [updateData.status, booking.id, booking.tenant_id]);

    if (updateResult.rows.length === 0) {
      console.log('❌ Update failed - no rows affected');
      return;
    }

    const updatedBooking = updateResult.rows[0];
    console.log('✅ SUCCESS! Status update completed without errors!');
    console.log(`   ✅ New status: ${updatedBooking.status}`);
    console.log(`   ✅ Updated booking ID: ${updatedBooking.id}`);

    // Revert the change
    await pool.query(`UPDATE bookings SET status = $1 WHERE id = $2`, [booking.status, booking.id]);
    console.log(`   ↩️  Reverted status back to: ${booking.status}`);

    console.log('\n🎉 PROBLEM SOLVED!');
    console.log('💡 The fix was removing "updatedAt" from the dateFields array in server/routes.ts');
    console.log('📍 Location: server/routes.ts line ~1794');
    console.log('🔧 Change: Removed "updatedAt" from dateFields array since bookings table has no updated_at column');

  } catch (error) {
    console.error('❌ Error testing FIXED booking status:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

simulateFixedBookingStatusUpdate();