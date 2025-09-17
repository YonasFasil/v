const { Pool } = require('pg');

// Debug the actual contract creation POST request logic
async function debugContractPost() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Debugging contract creation POST logic...\n");

    // First, get a valid customer and venue/space for testing
    const customerQuery = `SELECT id, name FROM customers WHERE tenant_id = $1 LIMIT 1`;
    const customerResult = await pool.query(customerQuery, [CORRECT_TENANT_ID]);

    if (customerResult.rows.length === 0) {
      console.log("❌ No customers found for testing");
      return;
    }

    const venueQuery = `
      SELECT v.id as venue_id, v.name as venue_name, s.id as space_id, s.name as space_name
      FROM venues v
      LEFT JOIN spaces s ON v.id = s.venue_id
      WHERE v.tenant_id = $1 AND v.is_active = true
      LIMIT 1
    `;
    const venueResult = await pool.query(venueQuery, [CORRECT_TENANT_ID]);

    if (venueResult.rows.length === 0) {
      console.log("❌ No venues found for testing");
      return;
    }

    const customer = customerResult.rows[0];
    const venue = venueResult.rows[0];

    console.log(`✅ Test data found:`);
    console.log(`   Customer: ${customer.name} (${customer.id})`);
    console.log(`   Venue: ${venue.venue_name} (${venue.venue_id})`);
    console.log(`   Space: ${venue.space_name} (${venue.space_id || 'null'})`);

    // Simulate the exact payload structure the frontend sends
    const { v4: uuidv4 } = require('uuid');
    const contractId = uuidv4();

    const testPayload = {
      contractData: {
        contractName: "Test Multi-Date Event Contract"
      },
      bookingsData: [
        {
          eventName: "Test Event Day 1",
          eventType: "wedding",
          customerId: customer.id,
          venueId: venue.venue_id,
          spaceId: venue.space_id,
          eventDate: "2025-01-15",
          endDate: "2025-01-15",
          startTime: "18:00",
          endTime: "23:00",
          guestCount: 100,
          setupStyle: "banquet",
          status: "inquiry",
          totalAmount: "5000.00",
          depositAmount: "1000.00",
          notes: "Test event day 1",
          isMultiDay: true,
          proposalId: null,
          proposalStatus: null,
          proposalSentAt: null
        },
        {
          eventName: "Test Event Day 2",
          eventType: "wedding",
          customerId: customer.id,
          venueId: venue.venue_id,
          spaceId: venue.space_id,
          eventDate: "2025-01-16",
          endDate: "2025-01-16",
          startTime: "18:00",
          endTime: "23:00",
          guestCount: 100,
          setupStyle: "banquet",
          status: "inquiry",
          totalAmount: "5000.00",
          depositAmount: "1000.00",
          notes: "Test event day 2",
          isMultiDay: true,
          proposalId: null,
          proposalStatus: null,
          proposalSentAt: null
        }
      ]
    };

    console.log("\n" + "=".repeat(50));
    console.log("TESTING CONTRACT CREATION LOGIC");
    console.log("=".repeat(50));

    console.log("Payload structure:");
    console.log(`  Contract Data: ${JSON.stringify(testPayload.contractData)}`);
    console.log(`  Bookings Count: ${testPayload.bookingsData.length}`);
    console.log(`  Generated Contract ID: ${contractId}`);

    // Step 1: Test availability check logic (the part that might be failing)
    console.log("\n📋 STEP 1: Testing availability check logic...");

    const conflicts = [];
    for (const bookingData of testPayload.bookingsData) {
      const { spaceId, eventDate, startTime, endTime } = bookingData;

      if (spaceId) {
        console.log(`   Checking availability for ${eventDate} ${startTime}-${endTime} in space ${spaceId}`);

        const conflictQuery = `
          SELECT id, event_name, event_date, start_time, end_time
          FROM bookings
          WHERE tenant_id = $1
            AND space_id = $2
            AND event_date = $3
            AND status != 'cancelled'
            AND (
              (start_time <= $4 AND end_time > $4) OR
              (start_time < $5 AND end_time >= $5) OR
              (start_time >= $4 AND end_time <= $5)
            )
        `;

        try {
          const conflictResult = await pool.query(conflictQuery, [
            CORRECT_TENANT_ID, spaceId, eventDate, startTime, endTime
          ]);

          if (conflictResult.rows.length > 0) {
            console.log(`   ❌ CONFLICT FOUND: ${conflictResult.rows[0].event_name} on ${conflictResult.rows[0].event_date}`);
            conflicts.push({
              eventDate,
              conflictingBooking: conflictResult.rows[0]
            });
          } else {
            console.log(`   ✅ No conflicts found for ${eventDate}`);
          }
        } catch (error) {
          console.log(`   🔥 ERROR in availability check: ${error.message}`);
          console.log(`   Query: ${conflictQuery}`);
          console.log(`   Params: [${CORRECT_TENANT_ID}, ${spaceId}, ${eventDate}, ${startTime}, ${endTime}]`);
          throw error;
        }
      } else {
        console.log(`   ✅ No space ID - skipping availability check for ${eventDate}`);
      }
    }

    if (conflicts.length > 0) {
      console.log(`\n❌ Found ${conflicts.length} conflicts - would return 409 error`);
      return;
    }

    // Step 2: Test the INSERT operations
    console.log("\n📋 STEP 2: Testing INSERT operations...");

    const createdBookings = [];
    for (const bookingData of testPayload.bookingsData) {
      const {
        eventName, eventType, customerId, venueId, spaceId,
        eventDate, endDate, startTime, endTime, guestCount,
        setupStyle, status = 'inquiry', totalAmount, depositAmount,
        notes, isMultiDay, proposalId, proposalStatus, proposalSentAt
      } = bookingData;

      console.log(`   Creating booking: ${eventName} on ${eventDate}`);

      try {
        const insertQuery = `
          INSERT INTO bookings (
            tenant_id, event_name, event_type, customer_id, venue_id, space_id,
            event_date, end_date, start_time, end_time, guest_count,
            setup_style, status, total_amount, deposit_amount, notes,
            contract_id, is_multi_day, proposal_id, proposal_status,
            proposal_sent_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
          ) RETURNING *
        `;

        const newBooking = await pool.query(insertQuery, [
          CORRECT_TENANT_ID, eventName, eventType, customerId, venueId, spaceId,
          eventDate, endDate, startTime, endTime, guestCount,
          setupStyle, status, totalAmount, depositAmount, notes,
          contractId, isMultiDay, proposalId, proposalStatus, proposalSentAt
        ]);

        console.log(`   ✅ Created booking ID: ${newBooking.rows[0].id}`);
        createdBookings.push(newBooking.rows[0]);

      } catch (error) {
        console.log(`   🔥 ERROR creating booking: ${error.message}`);
        console.log(`   Error code: ${error.code}`);
        console.log(`   Error detail: ${error.detail}`);

        // Print the actual values being inserted
        console.log("\n   Values being inserted:");
        console.log(`     tenant_id: ${CORRECT_TENANT_ID}`);
        console.log(`     event_name: ${eventName}`);
        console.log(`     event_type: ${eventType}`);
        console.log(`     customer_id: ${customerId}`);
        console.log(`     venue_id: ${venueId}`);
        console.log(`     space_id: ${spaceId}`);
        console.log(`     event_date: ${eventDate}`);
        console.log(`     end_date: ${endDate}`);
        console.log(`     start_time: ${startTime}`);
        console.log(`     end_time: ${endTime}`);
        console.log(`     guest_count: ${guestCount}`);
        console.log(`     setup_style: ${setupStyle}`);
        console.log(`     status: ${status}`);
        console.log(`     total_amount: ${totalAmount}`);
        console.log(`     deposit_amount: ${depositAmount}`);
        console.log(`     notes: ${notes}`);
        console.log(`     contract_id: ${contractId}`);
        console.log(`     is_multi_day: ${isMultiDay}`);
        console.log(`     proposal_id: ${proposalId}`);
        console.log(`     proposal_status: ${proposalStatus}`);
        console.log(`     proposal_sent_at: ${proposalSentAt}`);

        throw error;
      }
    }

    console.log(`\n✅ SUCCESS: Created ${createdBookings.length} bookings with contract ID: ${contractId}`);

    // Clean up test data
    console.log("\n📋 CLEANING UP TEST DATA...");
    await pool.query(`DELETE FROM bookings WHERE contract_id = $1`, [contractId]);
    console.log("✅ Test data cleaned up");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 CONTRACT CREATION TEST PASSED");
    console.log("=".repeat(50));
    console.log("The contract creation logic appears to be working correctly.");
    console.log("The 500 error might be related to:");
    console.log("1. Invalid data being sent from frontend");
    console.log("2. Authorization/authentication issues");
    console.log("3. Database constraint violations with actual production data");
    console.log("4. Environment-specific issues (Vercel vs local)");

  } catch (error) {
    console.error('\n🔥 CONTRACT CREATION TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugContractPost();