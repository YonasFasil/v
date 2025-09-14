const { Pool } = require('pg');

// Test contract modal date fields
async function testContractModals() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing contract modal date fields fix...\n");

    // Simulate the bookings API call that groups contracts
    const bookingsQuery = `
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
      LEFT JOIN customers c ON b.customer_id = c.id AND c.tenant_id = $1
      LEFT JOIN venues v ON b.venue_id = v.id AND v.tenant_id = $1
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1
      ORDER BY b.event_date DESC
    `;

    const result = await pool.query(bookingsQuery, [CORRECT_TENANT_ID]);

    console.log(`Found ${result.rows.length} total bookings`);

    // Simulate the contract grouping logic from tenant.js
    const contracts = new Map();
    const regularBookings = [];

    result.rows.forEach(booking => {
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
            // These are the fields I added to fix modal crashes
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
      } else {
        regularBookings.push({
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
      }
    });

    console.log(`\nContract grouping results:`);
    console.log(`- Regular bookings: ${regularBookings.length}`);
    console.log(`- Contracts: ${contracts.size}`);

    if (contracts.size > 0) {
      console.log("\nContract objects that would be sent to frontend:\n");

      let contractIndex = 1;
      contracts.forEach((contract, contractId) => {
        console.log(`${contractIndex}. Contract ${contractId}`);
        console.log(`   Contract Name: ${contract.contractInfo.contractName}`);
        console.log(`   Event Count: ${contract.eventCount}`);

        // Test the date fields that caused crashes
        console.log(`   Date Fields for Modal:`);
        console.log(`     eventName: ${contract.eventName || 'NULL'}`);
        console.log(`     eventDate: ${contract.eventDate || 'NULL'}`);
        console.log(`     startTime: ${contract.startTime || 'NULL'}`);
        console.log(`     endTime: ${contract.endTime || 'NULL'}`);
        console.log(`     guestCount: ${contract.guestCount || 'NULL'}`);

        // Test if these would cause "Invalid time value" errors
        let dateValid = true;
        let timeValid = true;

        if (contract.eventDate) {
          try {
            const dateObj = new Date(contract.eventDate);
            if (isNaN(dateObj.getTime())) {
              dateValid = false;
            }
          } catch (e) {
            dateValid = false;
          }
        } else {
          dateValid = false;
        }

        if (!contract.startTime || !contract.endTime) {
          timeValid = false;
        }

        console.log(`     Date Valid: ${dateValid ? '✅' : '❌'}`);
        console.log(`     Time Valid: ${timeValid ? '✅' : '❌'}`);
        console.log(`     Modal Safe: ${dateValid && timeValid ? '✅' : '❌'}`);

        if (contract.contractEvents.length > 0) {
          console.log(`   Contract Events:`);
          contract.contractEvents.slice(0, 3).forEach((event, i) => {
            console.log(`     ${i + 1}. ${event.eventName} on ${event.eventDate}`);
            console.log(`        Time: ${event.startTime} - ${event.endTime}`);
          });
          if (contract.contractEvents.length > 3) {
            console.log(`     ... and ${contract.contractEvents.length - 3} more`);
          }
        }

        console.log();
        contractIndex++;
      });

      // Check for potential modal crashes
      const crashProneContracts = Array.from(contracts.values()).filter(contract => {
        return !contract.eventDate || !contract.startTime || !contract.endTime ||
               isNaN(new Date(contract.eventDate).getTime());
      });

      if (crashProneContracts.length > 0) {
        console.log("⚠️  WARNING: Found contracts that could still cause modal crashes:");
        crashProneContracts.forEach(contract => {
          console.log(`   - Contract ${contract.id}: Missing or invalid date fields`);
        });
      } else {
        console.log("✅ ALL CONTRACTS HAVE VALID DATE FIELDS - MODALS SHOULD NOT CRASH");
      }

    } else {
      console.log("No contracts found in the database");
    }

  } catch (error) {
    console.error('Error testing contract modals:', error.message);
  } finally {
    await pool.end();
  }
}

testContractModals();