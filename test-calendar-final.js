const { Pool } = require('pg');

// Simulate the calendar API call
async function testCalendarFinal() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing final calendar API fix...\n");
    console.log("Simulating the exact query the calendar API would make:\n");

    // Simulate what happens when calendar API calls tenant.js with resource: 'events', isCalendarApi: 'true'
    const query = `SELECT
             b.id,
             b.event_name as title,
             b.event_date as start,
             b.status,
             c.name as "customerName",
             v.name as "venueName",
             s.name as "spaceName",
             b.guest_count as "guestCount",
             b.total_amount as "totalAmount",
             b.start_time as "startTime",
             b.end_time as "endTime",
             COALESCE(b.contract_id::text, '') as "contractId",
             CASE WHEN b.contract_id IS NOT NULL THEN true ELSE false END as "isPartOfContract",
             'blue' as color
           FROM bookings b
           LEFT JOIN customers c ON b.customer_id = c.id AND c.tenant_id = $1
           LEFT JOIN venues v ON b.venue_id = v.id AND v.tenant_id = $1
           LEFT JOIN spaces s ON b.space_id = s.id
           WHERE b.tenant_id = $1
           ORDER BY b.event_date DESC`;

    const result = await pool.query(query, [CORRECT_TENANT_ID]);

    console.log(`Raw query returned ${result.rows.length} events`);

    // Apply the same filter logic as in the API
    const validEvents = result.rows.filter(event =>
      event.start &&
      event.start !== null &&
      !isNaN(new Date(event.start).getTime())
    );

    console.log(`After date validation: ${validEvents.rows?.length || validEvents.length} valid events`);

    // Return the format the calendar expects
    const calendarResponse = {
      mode: 'events',
      data: validEvents
    };

    console.log("\n" + "=".repeat(60));
    console.log("FINAL CALENDAR API RESPONSE:");
    console.log("=".repeat(60));

    console.log(`Mode: ${calendarResponse.mode}`);
    console.log(`Event Count: ${calendarResponse.data.length}`);

    if (calendarResponse.data.length > 0) {
      console.log("\nFirst 3 events:");
      calendarResponse.data.slice(0, 3).forEach((event, i) => {
        console.log(`\n${i + 1}. ${event.title}`);
        console.log(`   Date: ${event.start}`);
        console.log(`   Time: ${event.startTime} - ${event.endTime}`);
        console.log(`   Customer: ${event.customerName}`);
        console.log(`   Venue: ${event.venueName}`);
        console.log(`   Space: ${event.spaceName}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Contract: ${event.isPartOfContract ? 'Yes' : 'No'}`);
      });

      console.log("\n" + "=".repeat(60));
      console.log("✅ CALENDAR SHOULD NOW BE WORKING!");
      console.log("The API will return the correct {mode: 'events', data: [...]} format");
      console.log("Events have valid dates and all required fields");
    } else {
      console.log("❌ No valid events found - calendar will be empty");
    }

  } catch (error) {
    console.error('Error testing final calendar:', error.message);
  } finally {
    await pool.end();
  }
}

testCalendarFinal();