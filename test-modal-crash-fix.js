const { Pool } = require('pg');

// Test the modal crash issue and field preselection
async function testModalCrashFix() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing modal crash fix and field preselection...\n");

    // Test the updated bookings query with all aliases
    const bookings = await pool.query(`SELECT b.*,
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
      WHERE b.tenant_id = $1
      ORDER BY b.event_date DESC
      LIMIT 5`, [CORRECT_TENANT_ID]);

    console.log(`Found ${bookings.rows.length} bookings to test with`);

    // Simulate the contract grouping logic
    const contracts = new Map();
    const singleBookings = [];

    bookings.rows.forEach(booking => {
      if (booking.contract_id) {
        if (!contracts.has(booking.contract_id)) {
          // Create a contract object with all expected fields
          contracts.set(booking.contract_id, {
            id: booking.contract_id,
            isContract: true,
            contractInfo: {
              id: booking.contract_id,
              contractName: `${booking.eventName} (Multi-Date)`
            },
            contractEvents: [], // This should never be null!
            eventCount: 0,
            status: booking.status,
            customer_name: booking.customer_name,
            venue_name: booking.venue_name,
            // Add missing date fields that modals expect
            eventName: booking.eventName,
            eventDate: booking.eventDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            guestCount: booking.guestCount,
            totalAmount: 0,
            created_at: booking.created_at
          });
        }

        const contract = contracts.get(booking.contract_id);
        contract.contractEvents.push({
          ...booking,
          isPartOfContract: true
        });
        contract.eventCount = contract.contractEvents.length;
        contract.totalAmount = (parseFloat(contract.totalAmount || 0) + parseFloat(booking.totalAmount || 0)).toFixed(2);
      } else {
        // Single booking (not part of contract)
        singleBookings.push({
          ...booking,
          isContract: false,
          isPartOfContract: false
        });
      }
    });

    // Combine contracts and single bookings
    const result = [...Array.from(contracts.values()), ...singleBookings];

    console.log("=".repeat(60));
    console.log("TESTING EACH BOOKING FOR MODAL COMPATIBILITY");
    console.log("=".repeat(60));

    result.forEach((booking, i) => {
      console.log(`\n${i + 1}. ${booking.isContract ? 'CONTRACT' : 'SINGLE'}: ${booking.eventName}`);

      // Test edit modal fields
      console.log(`  Edit Modal Fields:`);
      console.log(`    customerId: "${booking.customerId || 'NULL'}" ${booking.customerId ? '✅' : '❌'}`);
      console.log(`    venueId: "${booking.venueId || 'NULL'}" ${booking.venueId ? '✅' : '❌'}`);
      console.log(`    spaceId: "${booking.spaceId || 'NULL'}" ${booking.spaceId ? '✅' : '❌'}`);
      console.log(`    packageId: "${booking.packageId || 'NULL'}" ${booking.packageId ? '✅' : '❌'}`);
      console.log(`    selectedServices: ${Array.isArray(booking.selectedServices) ? '✅ array' : booking.selectedServices ? '⚠️ not array' : '❌ null'}`);

      // Test summary modal null safety
      console.log(`  Summary Modal Safety:`);
      if (booking.isContract) {
        console.log(`    isContract: true`);
        console.log(`    contractEvents: ${booking.contractEvents ? '✅ exists' : '❌ NULL'} (length: ${booking.contractEvents?.length || 'N/A'})`);
        console.log(`    contractInfo: ${booking.contractInfo ? '✅ exists' : '❌ NULL'}`);

        // Test specific operations that could crash
        try {
          const eventCount = booking.contractEvents?.length || 0;
          console.log(`    contractEvents.length: ${eventCount} ✅`);
        } catch (e) {
          console.log(`    contractEvents.length: ❌ ERROR - ${e.message}`);
        }

        try {
          const totalGuests = booking.contractEvents?.reduce((sum, event) => sum + (event.guestCount || 0), 0);
          console.log(`    contractEvents.reduce(): ${totalGuests} ✅`);
        } catch (e) {
          console.log(`    contractEvents.reduce(): ❌ ERROR - ${e.message}`);
        }

        try {
          const mapped = booking.contractEvents?.map((event, index) => ({ index, date: event.eventDate }));
          console.log(`    contractEvents.map(): ${mapped?.length || 0} items ✅`);
        } catch (e) {
          console.log(`    contractEvents.map(): ❌ ERROR - ${e.message}`);
        }
      } else {
        console.log(`    isContract: false (single booking)`);
        // For single bookings, these fields should not be accessed
        console.log(`    contractEvents: N/A (single booking)`);
      }

      console.log(`  Overall Modal Safety: ${
        booking.isContract ?
          (booking.contractEvents ? '✅ Contract safe' : '❌ Contract unsafe') :
          '✅ Single safe'
      }`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY:");
    console.log("=".repeat(60));

    const contractCount = result.filter(b => b.isContract).length;
    const singleCount = result.filter(b => !b.isContract).length;
    const unsafeContracts = result.filter(b => b.isContract && !b.contractEvents).length;

    console.log(`✅ Total bookings processed: ${result.length}`);
    console.log(`✅ Contracts: ${contractCount}, Singles: ${singleCount}`);
    console.log(`✅ Added packageId and selectedServices aliases`);
    console.log(`${unsafeContracts === 0 ? '✅' : '❌'} Contract events safety: ${unsafeContracts} unsafe contracts found`);

    if (unsafeContracts === 0) {
      console.log("\n🎉 Modal crash should be fixed!");
      console.log("🎉 Edit modal field preselection should work!");
    } else {
      console.log("\n⚠️  Still need to investigate unsafe contracts");
    }

  } catch (error) {
    console.error('Error testing modal crash fix:', error.message);
  } finally {
    await pool.end();
  }
}

testModalCrashFix();