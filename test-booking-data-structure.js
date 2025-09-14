const { Pool } = require('pg');

// Test booking data structure returned by API vs expected by edit modal
async function testBookingDataStructure() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing booking data structure for edit modal...\n");

    // Get actual booking data as returned by the API
    const bookingsQuery = `
      SELECT
        b.id,
        b.event_name as "eventName",
        b.event_date as "eventDate",
        b.start_time as "startTime",
        b.end_time as "endTime",
        b.guest_count as "guestCount",
        b.total_amount as "totalAmount",
        b.status,
        b.notes,
        b.customer_id,
        b.venue_id,
        b.space_id,
        b.contract_id as "contractId",
        CASE WHEN b.contract_id IS NOT NULL THEN true ELSE false END as "isPartOfContract",
        c.name as customer_name,
        v.name as venue_name,
        s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id AND c.tenant_id = $1
      LEFT JOIN venues v ON b.venue_id = v.id AND v.tenant_id = $1
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1
      ORDER BY b.event_date DESC
      LIMIT 3
    `;

    const result = await pool.query(bookingsQuery, [CORRECT_TENANT_ID]);

    if (result.rows.length === 0) {
      console.log("No bookings found for testing");
      return;
    }

    console.log("Sample booking data structure from API:");
    console.log("=".repeat(50));

    result.rows.forEach((booking, i) => {
      console.log(`\nBooking ${i + 1}: ${booking.eventName}`);
      console.log(`Fields expected by edit modal:`);
      console.log(`  eventName: "${booking.eventName || 'NULL'}" ${booking.eventName ? '✅' : '❌'}`);
      console.log(`  guestCount: ${booking.guestCount || 'NULL'} ${booking.guestCount ? '✅' : '❌'}`);
      console.log(`  startTime: "${booking.startTime || 'NULL'}" ${booking.startTime ? '✅' : '❌'}`);
      console.log(`  endTime: "${booking.endTime || 'NULL'}" ${booking.endTime ? '✅' : '❌'}`);
      console.log(`  status: "${booking.status || 'NULL'}" ${booking.status ? '✅' : '❌'}`);
      console.log(`  notes: "${booking.notes || 'NULL'}" ${booking.notes ? '✅' : '❌'}`);
      console.log(`  customerId: "${booking.customer_id || 'NULL'}" ${booking.customer_id ? '✅' : '❌'}`);
      console.log(`  venueId: "${booking.venue_id || 'NULL'}" ${booking.venue_id ? '✅' : '❌'}`);

      console.log(`\nRaw booking object:`);
      console.log(JSON.stringify(booking, null, 2));
    });

    // Check what fields the edit modal actually looks for
    console.log("\n" + "=".repeat(60));
    console.log("EDIT MODAL EXPECTATIONS (from component code):");
    console.log("=".repeat(60));
    console.log(`booking.eventName - Event name field`);
    console.log(`booking.guestCount - Guest count field`);
    console.log(`booking.startTime - Start time field`);
    console.log(`booking.endTime - End time field`);
    console.log(`booking.status - Status field`);
    console.log(`booking.notes - Notes field`);
    console.log(`booking.customerId - Customer selection (via customers.find(c => c.id === booking?.customerId))`);
    console.log(`booking.venueId - Venue selection (via venues.find(v => v.id === booking?.venueId))`);

    // Test camelCase vs snake_case issues
    console.log("\n" + "=".repeat(60));
    console.log("POTENTIAL CAMELCASE ISSUES:");
    console.log("=".repeat(60));

    const testBooking = result.rows[0];
    console.log(`Database has customer_id: ${testBooking.customer_id}`);
    console.log(`Edit modal expects customerId: ${testBooking.customerId || 'MISSING'}`);
    console.log(`Database has venue_id: ${testBooking.venue_id}`);
    console.log(`Edit modal expects venueId: ${testBooking.venueId || 'MISSING'}`);

    // Check if this is a SQL query alias issue
    if (!testBooking.customerId && testBooking.customer_id) {
      console.log(`\n❌ FOUND ISSUE: API returns customer_id but edit modal expects customerId`);
      console.log(`❌ FOUND ISSUE: API returns venue_id but edit modal expects venueId`);
      console.log(`\n💡 SOLUTION: Add SQL aliases in bookings query`);
      console.log(`   b.customer_id as "customerId"`);
      console.log(`   b.venue_id as "venueId"`);
      console.log(`   b.space_id as "spaceId"`);
    } else {
      console.log(`\n✅ Field naming looks correct`);
    }

  } catch (error) {
    console.error('Error testing booking data structure:', error.message);
  } finally {
    await pool.end();
  }
}

testBookingDataStructure();