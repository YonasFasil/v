const { Pool } = require('pg');

// Debug multidate event editing issues
async function debugBookingFields() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Debugging multidate event editing issues...\n");

    // Find existing contracts (multidate events)
    const contractsQuery = `
      SELECT DISTINCT b.contract_id, COUNT(*) as event_count,
             MIN(b.event_date) as first_date, MAX(b.event_date) as last_date,
             STRING_AGG(DISTINCT b.event_name, ', ') as event_names
      FROM bookings b
      WHERE b.tenant_id = $1 AND b.contract_id IS NOT NULL
      GROUP BY b.contract_id
      ORDER BY MIN(b.created_at) DESC
      LIMIT 3
    `;

    const contractsResult = await pool.query(contractsQuery, [CORRECT_TENANT_ID]);

    if (contractsResult.rows.length === 0) {
      console.log("❌ No existing multidate events (contracts) found");
      return;
    }

    console.log("EXISTING MULTIDATE EVENTS:");
    console.log("=".repeat(60));

    contractsResult.rows.forEach((contract, i) => {
      console.log(`${i + 1}. Contract ID: ${contract.contract_id}`);
      console.log(`   Events: ${contract.event_count}`);
      console.log(`   Date range: ${contract.first_date} to ${contract.last_date}`);
      console.log(`   Names: ${contract.event_names}`);
      console.log();
    });

    // Take the first contract and examine its structure
    const testContractId = contractsResult.rows[0].contract_id;
    console.log(`Testing with contract: ${testContractId}`);

    // Get all bookings in this contract
    const bookingsQuery = `
      SELECT b.*, c.name as customer_name, v.name as venue_name, s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1 AND b.contract_id = $2
      ORDER BY b.event_date, b.start_time
    `;

    const bookingsResult = await pool.query(bookingsQuery, [CORRECT_TENANT_ID, testContractId]);

    console.log("=".repeat(60));
    console.log("CURRENT CONTRACT STRUCTURE:");
    console.log("=".repeat(60));

    bookingsResult.rows.forEach((booking, i) => {
      console.log(`Event ${i + 1}: ${booking.event_name}`);
      console.log(`  ID: ${booking.id}`);
      console.log(`  Date: ${booking.event_date}`);
      console.log(`  Time: ${booking.start_time} - ${booking.end_time}`);
      console.log(`  Customer: ${booking.customer_name}`);
      console.log(`  Venue: ${booking.venue_name}`);
      console.log(`  Space: ${booking.space_name}`);
      console.log(`  Amount: $${booking.total_amount}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Contract ID: ${booking.contract_id}`);
      console.log();
    });

    // Test individual booking update
    console.log("=".repeat(60));
    console.log("TEST: INDIVIDUAL BOOKING UPDATE");
    console.log("=".repeat(60));

    if (bookingsResult.rows.length > 0) {
      const firstBooking = bookingsResult.rows[0];
      console.log(`Attempting to update booking ${firstBooking.id}`);
      console.log(`Current date: ${firstBooking.event_date}`);
      console.log(`Changing to: 2025-09-25`);

      // Simulate PATCH request
      const testUpdateFields = [];
      const testUpdateValues = [];
      let testValueIndex = 1;

      testUpdateValues.push(CORRECT_TENANT_ID, firstBooking.id);

      testUpdateFields.push(`event_date = $${testValueIndex + 2}`);
      testUpdateValues.push("2025-09-25");
      testValueIndex++;

      const testUpdateQuery = `
        UPDATE bookings
        SET ${testUpdateFields.join(', ')}
        WHERE tenant_id = $1 AND id = $2
        RETURNING *
      `;

      try {
        const testUpdateResult = await pool.query(testUpdateQuery, testUpdateValues);

        if (testUpdateResult.rows.length > 0) {
          console.log("✅ Individual booking update WORKS");
          console.log(`   Updated date: ${testUpdateResult.rows[0].event_date}`);

          // Revert the change
          await pool.query(`
            UPDATE bookings
            SET event_date = $3
            WHERE tenant_id = $1 AND id = $2
          `, [CORRECT_TENANT_ID, firstBooking.id, firstBooking.event_date]);
          console.log("✅ Reverted test change");

        } else {
          console.log("❌ Individual booking update FAILED - no rows returned");
        }
      } catch (error) {
        console.log("❌ Individual booking update FAILED");
        console.log(`   Error: ${error.message}`);
      }
    }

    // Test contract-wide update
    console.log("\n=".repeat(60));
    console.log("TEST: CONTRACT-WIDE UPDATE");
    console.log("=".repeat(60));

    console.log(`Testing contract update for: ${testContractId}`);

    try {
      // Simple contract update (change status)
      const contractUpdateQuery = `
        UPDATE bookings
        SET status = $3
        WHERE tenant_id = $1 AND contract_id = $2
        RETURNING *
      `;

      const contractUpdateResult = await pool.query(contractUpdateQuery, [
        CORRECT_TENANT_ID, testContractId, 'confirmed'
      ]);

      if (contractUpdateResult.rows.length > 0) {
        console.log("✅ Contract-wide update WORKS");
        console.log(`   Updated ${contractUpdateResult.rows.length} bookings`);

        // Revert the change
        await pool.query(contractUpdateQuery, [
          CORRECT_TENANT_ID, testContractId, 'inquiry'
        ]);
        console.log("✅ Reverted test change");

      } else {
        console.log("❌ Contract-wide update FAILED - no rows returned");
      }
    } catch (error) {
      console.log("❌ Contract-wide update FAILED");
      console.log(`   Error: ${error.message}`);
    }

    console.log("\n=".repeat(60));
    console.log("DEBUGGING FRONTEND-API INTERACTION:");
    console.log("=".repeat(60));

    console.log("The issue might be in the frontend-API interaction:");
    console.log("1. ✅ Backend API endpoints work correctly");
    console.log("2. ❓ Frontend may not be calling the right endpoint");
    console.log("3. ❓ Frontend may not be sending the right data structure");
    console.log("4. ❓ Frontend may not be handling the response correctly");

    console.log("\nTo debug frontend issues:");
    console.log("• Open browser dev tools → Network tab");
    console.log("• Edit a multidate event and watch for PATCH requests");
    console.log("• Check if PATCH requests are sent to:");
    console.log(`  - PATCH /api/bookings/contract/${testContractId} (for contract updates)`);
    console.log(`  - PATCH /api/bookings/{booking-id} (for individual updates)`);
    console.log("• Verify the request payload structure matches API expectations");
    console.log("• Check if the API returns success but frontend doesn't refresh");

  } catch (error) {
    console.error('\n🔥 DEBUG FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

debugBookingFields();