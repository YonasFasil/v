const { Pool } = require('pg');

// Debug the frontend-API communication issue
async function debugFrontendAPI() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Debugging frontend-API communication issue...\n");

    // Find existing multidate events to test with
    const contractsQuery = `
      SELECT contract_id, COUNT(*) as event_count,
             MIN(event_date) as first_date, MAX(event_date) as last_date
      FROM bookings
      WHERE tenant_id = $1 AND contract_id IS NOT NULL
      GROUP BY contract_id
      LIMIT 1
    `;

    const contractsResult = await pool.query(contractsQuery, [CORRECT_TENANT_ID]);

    if (contractsResult.rows.length === 0) {
      console.log("❌ No existing multidate events found for testing");
      return;
    }

    const testContract = contractsResult.rows[0];
    console.log(`Found test contract: ${testContract.contract_id}`);
    console.log(`Events: ${testContract.event_count}`);
    console.log(`Date range: ${testContract.first_date} to ${testContract.last_date}`);

    // Get detailed info about this contract
    const bookingsQuery = `
      SELECT id, event_name, event_date, start_time, end_time, status
      FROM bookings
      WHERE tenant_id = $1 AND contract_id = $2
      ORDER BY event_date
    `;

    const bookingsResult = await pool.query(bookingsQuery, [CORRECT_TENANT_ID, testContract.contract_id]);

    console.log("\nCurrent contract structure:");
    bookingsResult.rows.forEach((booking, i) => {
      console.log(`  ${i + 1}. ${booking.event_name} on ${booking.event_date} (ID: ${booking.id})`);
    });

    console.log("\n" + "=".repeat(70));
    console.log("IDENTIFYING THE API ENDPOINT ISSUE:");
    console.log("=".repeat(70));

    console.log("When you edit a multidate event, the frontend might be calling:");
    console.log("❓ Wrong endpoint: PATCH /api/bookings/{single-booking-id}");
    console.log("✅ Correct endpoint: PATCH /api/bookings/contract/{contract-id}");
    console.log("❓ Or: Multiple individual PATCH calls for each booking");

    console.log("\nLet's test each scenario to see which one works:");

    // Scenario 1: Test individual booking update (wrong for multidate)
    console.log("\n📋 SCENARIO 1: Individual booking update (likely what frontend is doing)");
    const firstBooking = bookingsResult.rows[0];
    console.log(`Testing: PATCH /api/bookings/${firstBooking.id}`);

    // Simulate what happens when frontend tries to update just one booking
    const individualUpdateQuery = `
      UPDATE bookings
      SET event_date = $3
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;

    const originalDate = firstBooking.event_date;
    const testDate = "2025-11-15";

    const individualResult = await pool.query(individualUpdateQuery, [
      CORRECT_TENANT_ID, firstBooking.id, testDate
    ]);

    if (individualResult.rows.length > 0) {
      console.log("✅ Individual booking update works");
      console.log(`   Updated booking ${firstBooking.id} from ${originalDate} to ${individualResult.rows[0].event_date}`);

      // But check if this affects the whole contract
      const afterIndividualQuery = await pool.query(bookingsQuery, [CORRECT_TENANT_ID, testContract.contract_id]);
      console.log("   After individual update, contract looks like:");
      afterIndividualQuery.rows.forEach((booking, i) => {
        console.log(`     ${i + 1}. ${booking.event_name} on ${booking.event_date}`);
      });

      // Revert
      await pool.query(individualUpdateQuery, [CORRECT_TENANT_ID, firstBooking.id, originalDate]);
      console.log("   ✅ Reverted test change");
    }

    // Scenario 2: Test contract-wide update (correct for multidate)
    console.log(`\n📋 SCENARIO 2: Contract-wide update (correct approach)`);
    console.log(`Testing: PATCH /api/bookings/contract/${testContract.contract_id}`);

    // Test simple contract update
    const contractUpdateQuery = `
      UPDATE bookings
      SET status = $3
      WHERE tenant_id = $1 AND contract_id = $2
      RETURNING *
    `;

    const contractResult = await pool.query(contractUpdateQuery, [
      CORRECT_TENANT_ID, testContract.contract_id, 'confirmed'
    ]);

    if (contractResult.rows.length > 0) {
      console.log("✅ Contract-wide update works");
      console.log(`   Updated ${contractResult.rows.length} bookings to 'confirmed' status`);

      // Revert
      await pool.query(contractUpdateQuery, [CORRECT_TENANT_ID, testContract.contract_id, 'inquiry']);
      console.log("   ✅ Reverted test change");
    }

    console.log("\n" + "=".repeat(70));
    console.log("FRONTEND DEBUGGING CHECKLIST:");
    console.log("=".repeat(70));

    console.log("🔍 TO FIND THE EXACT ISSUE:");
    console.log("1. Open browser dev tools → Network tab");
    console.log("2. Edit your multidate event (change dates, add dates)");
    console.log("3. Click 'Save Changes'");
    console.log("4. Watch for HTTP requests and check:");

    console.log("\n📡 EXPECTED API CALLS FOR MULTIDATE EDITING:");
    console.log(`   ✅ PATCH /api/bookings/contract/${testContract.contract_id}`);
    console.log("   ✅ With payload: { bookingsData: [...] } (for complex changes)");
    console.log("   ✅ OR: { status: '...', notes: '...' } (for simple changes)");

    console.log("\n❌ WRONG API CALLS (that show success but don't work):");
    console.log(`   ❌ PATCH /api/bookings/{individual-booking-id}`);
    console.log("   ❌ Multiple individual PATCH calls");
    console.log("   ❌ POST /api/bookings (trying to create new instead of update)");

    console.log("\n🔧 POSSIBLE ISSUES TO CHECK:");
    console.log("1. Frontend is calling individual booking endpoints instead of contract endpoint");
    console.log("2. Frontend is sending wrong data format (missing bookingsData array)");
    console.log("3. Frontend is not refreshing the data after successful API calls");
    console.log("4. Frontend edit modal is bound to wrong form submission handler");

    console.log("\n💡 QUICK TEST:");
    console.log("Try making a simple change (like status or notes) vs complex change (dates)");
    console.log("If simple changes work but date changes don't = wrong endpoint for complex operations");

    // Let's also check what the GET endpoint returns for this contract
    console.log("\n📋 TESTING GET /api/bookings (what frontend sees):");

    const frontendDataQuery = `SELECT b.*,
             b.event_name as "eventName",
             b.event_date as "eventDate",
             b.start_time as "startTime",
             b.end_time as "endTime",
             b.guest_count as "guestCount",
             b.total_amount as "totalAmount",
             b.customer_id as "customerId",
             b.venue_id as "venueId",
             b.space_id as "spaceId",
             c.name as customer_name,
             v.name as venue_name,
             s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1 AND b.contract_id = $2`;

    const frontendData = await pool.query(frontendDataQuery, [CORRECT_TENANT_ID, testContract.contract_id]);

    console.log("Frontend sees this contract data:");
    frontendData.rows.forEach((booking, i) => {
      console.log(`  ${i + 1}. ID: ${booking.id}, Name: ${booking.eventName}, Date: ${booking.eventDate}`);
      console.log(`     customerId: ${booking.customerId} ${booking.customerId ? '✅' : '❌'}`);
      console.log(`     contract_id: ${booking.contract_id}`);
    });

    console.log("\n🎯 NEXT STEPS:");
    console.log("1. Check browser Network tab to see actual API calls");
    console.log("2. Verify if frontend is calling contract endpoint or individual booking endpoints");
    console.log("3. If calling wrong endpoint, the frontend routing/form handling needs to be fixed");

  } catch (error) {
    console.error('\n🔥 DEBUG FAILED');
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugFrontendAPI();