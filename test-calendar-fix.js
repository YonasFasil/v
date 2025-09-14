const { Pool } = require('pg');

// Test the calendar events API fix
async function testCalendarFix() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Testing calendar events query with date validation...\n");

    const query = `
      SELECT
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
        CASE WHEN b.contract_id IS NOT NULL THEN true ELSE false END as "isPartOfContract"
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = '018c2e25-4973-4c75-b79e-22894700bf89'
        AND b.event_date IS NOT NULL
        AND b.start_time IS NOT NULL
        AND b.end_time IS NOT NULL
      ORDER BY b.event_date ASC
      LIMIT 10
    `;

    const result = await pool.query(query);

    console.log(`Found ${result.rows.length} calendar events with valid dates:`);

    result.rows.forEach((event, i) => {
      console.log(`\n${i + 1}. ${event.title}`);
      console.log(`   Date: ${event.start}`);
      console.log(`   Time: ${event.startTime} - ${event.endTime}`);
      console.log(`   Customer: ${event.customerName}`);
      console.log(`   Venue: ${event.venueName}`);
      console.log(`   Space: ${event.spaceName}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Contract: ${event.isPartOfContract ? 'Yes' : 'No'}`);
    });

    // Test contract grouping
    console.log("\n" + "=".repeat(50));
    console.log("Testing contract grouping logic...\n");

    const contractQuery = `
      SELECT
        b.*,
        b.event_name as "eventName",
        b.event_date as "eventDate",
        b.start_time as "startTime",
        b.end_time as "endTime",
        b.guest_count as "guestCount",
        b.total_amount as "totalAmount",
        c.name as customer_name,
        v.name as venue_name,
        s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = '018c2e25-4973-4c75-b79e-22894700bf89'
        AND b.contract_id IS NOT NULL
      ORDER BY b.contract_id, b.event_date ASC
      LIMIT 5
    `;

    const contractResult = await pool.query(contractQuery);

    if (contractResult.rows.length > 0) {
      console.log(`Found ${contractResult.rows.length} contract events:`);

      contractResult.rows.forEach((booking, i) => {
        console.log(`\n${i + 1}. ${booking.eventName}`);
        console.log(`   Contract ID: ${booking.contract_id}`);
        console.log(`   Date: ${booking.eventDate}`);
        console.log(`   Time: ${booking.startTime} - ${booking.endTime}`);
        console.log(`   Guest Count: ${booking.guestCount}`);
        console.log(`   Customer: ${booking.customer_name}`);

        // Verify the contract object would have all required fields
        const hasAllDateFields = booking.eventName && booking.eventDate && booking.startTime && booking.endTime;
        console.log(`   Has all date fields: ${hasAllDateFields ? 'Yes ✓' : 'No ✗'}`);
      });
    } else {
      console.log("No contract events found in database");
    }

  } catch (error) {
    console.error('Error testing calendar fix:', error.message);
  } finally {
    await pool.end();
  }
}

testCalendarFix();