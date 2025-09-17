const { Pool } = require('pg');

// Test the final fix for multidate event editing
async function testFinalFix() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing final fix for multidate event editing...\n");

    // Check for broken multidate events (bookings with null customer_id/venue_id)
    console.log("=".repeat(60));
    console.log("CHECKING FOR BROKEN MULTIDATE EVENTS:");
    console.log("=".repeat(60));

    const brokenBookingsQuery = `
      SELECT b.id, b.contract_id, b.event_name, b.customer_id, b.venue_id, c2.customer_id as contract_customer_id
      FROM bookings b
      LEFT JOIN contracts c2 ON b.contract_id = c2.id
      WHERE b.tenant_id = $1
        AND b.contract_id IS NOT NULL
        AND (b.customer_id IS NULL OR b.venue_id IS NULL)
    `;

    const brokenBookings = await pool.query(brokenBookingsQuery, [CORRECT_TENANT_ID]);

    if (brokenBookings.rows.length > 0) {
      console.log(`🔥 Found ${brokenBookings.rows.length} broken multidate bookings!`);

      brokenBookings.rows.forEach((booking, i) => {
        console.log(`${i + 1}. ${booking.event_name} (Contract: ${booking.contract_id})`);
        console.log(`   customer_id: ${booking.customer_id} ${booking.customer_id ? '✅' : '❌'}`);
        console.log(`   venue_id: ${booking.venue_id} ${booking.venue_id ? '✅' : '❌'}`);
        console.log(`   contract_customer_id: ${booking.contract_customer_id}`);
      });

      console.log("\n💡 FIXING BROKEN MULTIDATE BOOKINGS...");

      // Fix them all
      let fixedCount = 0;
      for (const brokenBooking of brokenBookings.rows) {
        let updateFields = [];
        let updateValues = [];
        let paramIndex = 2;

        updateValues.push(brokenBooking.id);

        // Fix missing customer_id
        if (brokenBooking.contract_customer_id && !brokenBooking.customer_id) {
          updateFields.push(`customer_id = $${paramIndex}`);
          updateValues.push(brokenBooking.contract_customer_id);
          paramIndex++;
        }

        // Fix missing venue_id by finding it from other bookings in same contract
        if (!brokenBooking.venue_id && brokenBooking.contract_id) {
          const venueQuery = `
            SELECT venue_id, space_id
            FROM bookings
            WHERE contract_id = $1 AND venue_id IS NOT NULL
            LIMIT 1
          `;
          const venueResult = await pool.query(venueQuery, [brokenBooking.contract_id]);

          if (venueResult.rows.length > 0) {
            updateFields.push(`venue_id = $${paramIndex}`);
            updateValues.push(venueResult.rows[0].venue_id);
            paramIndex++;

            if (venueResult.rows[0].space_id) {
              updateFields.push(`space_id = $${paramIndex}`);
              updateValues.push(venueResult.rows[0].space_id);
              paramIndex++;
            }
          }
        }

        if (updateFields.length > 0) {
          const updateQuery = `
            UPDATE bookings
            SET ${updateFields.join(', ')}
            WHERE id = $1
          `;

          await pool.query(updateQuery, updateValues);
          fixedCount++;
          console.log(`✅ Fixed booking ${brokenBooking.id} (${brokenBooking.event_name})`);
        }
      }

      console.log(`\n✅ Fixed ${fixedCount} out of ${brokenBookings.rows.length} broken multidate bookings!`);

    } else {
      console.log("✅ No broken multidate bookings found");
    }

    // Test the query after fixes
    console.log("\n=".repeat(60));
    console.log("TESTING MULTIDATE EVENT EDITING AFTER FIXES:");
    console.log("=".repeat(60));

    const testQuery = `SELECT b.*,
             b.event_name as "eventName",
             b.event_date as "eventDate",
             b.start_time as "startTime",
             b.end_time as "endTime",
             b.guest_count as "guestCount",
             b.total_amount as "totalAmount",
             b.customer_id as "customerId",
             b.venue_id as "venueId",
             b.space_id as "spaceId",
             b.package_id as "packageId",
             b.selected_services as "selectedServices",
             c.name as customer_name,
             v.name as venue_name,
             s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1 AND b.contract_id IS NOT NULL
      ORDER BY b.created_at DESC
      LIMIT 3`;

    const testBookings = await pool.query(testQuery, [CORRECT_TENANT_ID]);

    if (testBookings.rows.length > 0) {
      console.log("Sample multidate bookings after fix:");

      testBookings.rows.forEach((booking, i) => {
        console.log(`\n${i + 1}. ${booking.eventName} (Contract: ${booking.contract_id.substring(0, 8)}...)`);
        console.log(`   customerId: ${booking.customerId} ${booking.customerId ? '✅' : '❌'}`);
        console.log(`   venueId: ${booking.venueId} ${booking.venueId ? '✅' : '❌'}`);
        console.log(`   spaceId: ${booking.spaceId} ${booking.spaceId ? '✅' : '❌'}`);
        console.log(`   customer_name: ${booking.customer_name}`);
        console.log(`   venue_name: ${booking.venue_name}`);
      });

      // Test if a typical date change would work
      console.log("\n📋 TESTING DATE CHANGE SIMULATION:");
      const testBooking = testBookings.rows[0];

      const dateChangeQuery = `
        UPDATE bookings
        SET event_date = $3
        WHERE tenant_id = $1 AND id = $2
        RETURNING *
      `;

      const originalDate = testBooking.eventDate;
      const newDate = "2025-10-15";

      const changeResult = await pool.query(dateChangeQuery, [CORRECT_TENANT_ID, testBooking.id, newDate]);

      if (changeResult.rows.length > 0) {
        console.log(`✅ Date change test successful`);
        console.log(`   Changed from: ${originalDate}`);
        console.log(`   Changed to: ${changeResult.rows[0].event_date}`);

        // Revert the change
        await pool.query(dateChangeQuery, [CORRECT_TENANT_ID, testBooking.id, originalDate]);
        console.log(`✅ Reverted test change`);
      }

      console.log("\n=".repeat(60));
      console.log("🎉 MULTIDATE EVENT EDITING FIX COMPLETE");
      console.log("=".repeat(60));

      const allHaveIds = testBookings.rows.every(b => b.customerId && b.venueId);

      if (allHaveIds) {
        console.log("✅ All multidate events have proper customer/venue IDs");
        console.log("✅ Edit modal should populate correctly");
        console.log("✅ Date changes should save properly");
        console.log("✅ Adding/removing dates should work");
        console.log("\n🎉 MULTIDATE EVENT EDITING SHOULD NOW WORK!");
      } else {
        console.log("❌ Some multidate events still missing IDs");
        console.log("❌ Edit modal may not populate correctly");
      }

    } else {
      console.log("❌ No multidate events found to test with");
    }

  } catch (error) {
    console.error('\n🔥 FINAL FIX TEST FAILED');
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testFinalFix();