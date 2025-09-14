const { Pool } = require('pg');

// Test the calendar events API with correct tenant ID
async function testCalendarWithCorrectTenant() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing calendar events query with correct tenant ID...\n");
    console.log(`Using tenant ID: ${CORRECT_TENANT_ID}`);

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
        CASE WHEN b.contract_id IS NOT NULL THEN true ELSE false END as "isPartOfContract",
        'blue' as color
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1
        AND b.event_date IS NOT NULL
        AND b.start_time IS NOT NULL
        AND b.end_time IS NOT NULL
        AND b.status != 'cancelled'
      ORDER BY b.event_date ASC
      LIMIT 10
    `;

    const result = await pool.query(query, [CORRECT_TENANT_ID]);

    console.log(`Found ${result.rows.length} calendar events (non-cancelled with valid dates):\n`);

    result.rows.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Date: ${event.start}`);
      console.log(`   Time: ${event.startTime} - ${event.endTime}`);
      console.log(`   Customer: ${event.customerName || 'No customer'}`);
      console.log(`   Venue: ${event.venueName || 'No venue'}`);
      console.log(`   Space: ${event.spaceName || 'No space'}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Guests: ${event.guestCount}`);
      console.log(`   Contract: ${event.isPartOfContract ? 'Yes' : 'No'}`);
      console.log(`   Amount: $${event.totalAmount || '0'}`);
      console.log();
    });

    // Test the calendar API response format
    console.log("=".repeat(60));
    console.log("Testing calendar API response format...\n");

    const calendarResponse = {
      mode: 'events',
      data: result.rows
    };

    console.log("Calendar API would return:");
    console.log(JSON.stringify(calendarResponse, null, 2));

    // Test contract grouping
    console.log("\n" + "=".repeat(60));
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
      WHERE b.tenant_id = $1
        AND b.contract_id IS NOT NULL
      ORDER BY b.contract_id, b.event_date ASC
      LIMIT 10
    `;

    const contractResult = await pool.query(contractQuery, [CORRECT_TENANT_ID]);

    if (contractResult.rows.length > 0) {
      console.log(`Found ${contractResult.rows.length} contract events:`);

      // Group by contract_id as the API does
      const contracts = new Map();

      contractResult.rows.forEach(booking => {
        if (booking.contract_id) {
          if (!contracts.has(booking.contract_id)) {
            contracts.set(booking.contract_id, {
              id: booking.contract_id,
              isContract: true,
              contractInfo: {
                id: booking.contract_id,
                contractName: `${booking.eventName} (Multi-Date)`
              },
              contractEvents: [],
              eventCount: 0,
              // Added these fields to fix modal crashes
              eventName: booking.eventName,
              eventDate: booking.eventDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              guestCount: booking.guestCount
            });
          }

          contracts.get(booking.contract_id).contractEvents.push({
            id: booking.id,
            eventName: booking.eventName,
            eventDate: booking.eventDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            guestCount: booking.guestCount,
            status: booking.status,
            customerName: booking.customer_name,
            venueName: booking.venue_name,
            spaceName: booking.space_name,
            totalAmount: booking.totalAmount
          });
          contracts.get(booking.contract_id).eventCount++;
        }
      });

      console.log(`\nGrouped into ${contracts.size} contracts:`);

      contracts.forEach((contract, contractId) => {
        console.log(`\nContract ${contractId}:`);
        console.log(`  Name: ${contract.contractInfo.contractName}`);
        console.log(`  Event Count: ${contract.eventCount}`);
        console.log(`  First Event Date: ${contract.eventDate}`);
        console.log(`  First Event Time: ${contract.startTime} - ${contract.endTime}`);
        console.log(`  Has required modal fields: ${
          contract.eventName && contract.eventDate && contract.startTime && contract.endTime ? 'Yes ✓' : 'No ✗'
        }`);

        console.log(`  Events in contract:`);
        contract.contractEvents.forEach((event, i) => {
          console.log(`    ${i + 1}. ${event.eventName} on ${event.eventDate}`);
        });
      });
    } else {
      console.log("No contract events found");
    }

  } catch (error) {
    console.error('Error testing calendar with correct tenant:', error.message);
  } finally {
    await pool.end();
  }
}

testCalendarWithCorrectTenant();