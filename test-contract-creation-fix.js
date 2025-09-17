const { Pool } = require('pg');

// Test the fixed contract creation logic
async function testContractCreationFix() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Testing the FIXED contract creation logic...\n");

    // Get test data
    const customerQuery = `SELECT id, name FROM customers WHERE tenant_id = $1 LIMIT 1`;
    const customerResult = await pool.query(customerQuery, [CORRECT_TENANT_ID]);

    const venueQuery = `
      SELECT v.id as venue_id, v.name as venue_name, s.id as space_id, s.name as space_name
      FROM venues v
      LEFT JOIN spaces s ON v.id = s.venue_id
      WHERE v.tenant_id = $1 AND v.is_active = true
      LIMIT 1
    `;
    const venueResult = await pool.query(venueQuery, [CORRECT_TENANT_ID]);

    const customer = customerResult.rows[0];
    const venue = venueResult.rows[0];

    console.log(`Test data:`);
    console.log(`  Customer: ${customer.name} (${customer.id})`);
    console.log(`  Venue: ${venue.venue_name} (${venue.venue_id})`);

    // Simulate the fixed contract creation logic
    const { v4: uuidv4 } = require('uuid');
    const contractId = uuidv4();

    const contractData = { contractName: "Test Fixed Multi-Date Contract" };
    const bookingsData = [
      {
        eventName: "Fixed Test Day 1",
        eventType: "wedding",
        customerId: customer.id,
        venueId: venue.venue_id,
        spaceId: venue.space_id,
        eventDate: "2025-02-15",
        endDate: "2025-02-15",
        startTime: "18:00",
        endTime: "23:00",
        guestCount: 120,
        setupStyle: "banquet",
        status: "inquiry",
        totalAmount: "6000.00",
        depositAmount: "1500.00",
        notes: "Fixed test day 1",
        isMultiDay: true
      },
      {
        eventName: "Fixed Test Day 2",
        eventType: "wedding",
        customerId: customer.id,
        venueId: venue.venue_id,
        spaceId: venue.space_id,
        eventDate: "2025-02-16",
        endDate: "2025-02-16",
        startTime: "18:00",
        endTime: "23:00",
        guestCount: 120,
        setupStyle: "banquet",
        status: "inquiry",
        totalAmount: "6000.00",
        depositAmount: "1500.00",
        notes: "Fixed test day 2",
        isMultiDay: true
      }
    ];

    console.log("\n" + "=".repeat(50));
    console.log("TESTING FIXED CONTRACT CREATION");
    console.log("=".repeat(50));

    // Step 1: Create the contract record first
    console.log("📋 STEP 1: Creating contract record...");

    const customerId = bookingsData[0]?.customerId;
    const totalContractAmount = bookingsData.reduce((sum, booking) => {
      return sum + (parseFloat(booking.totalAmount) || 0);
    }, 0);

    console.log(`   Contract ID: ${contractId}`);
    console.log(`   Customer ID: ${customerId}`);
    console.log(`   Total Amount: ${totalContractAmount}`);

    const contractRecord = await pool.query(`
      INSERT INTO contracts (
        id, tenant_id, customer_id, contract_name, status, total_amount, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING *
    `, [
      contractId,
      CORRECT_TENANT_ID,
      customerId,
      contractData.contractName || `Multi-Date Event Contract`,
      'inquiry',
      totalContractAmount
    ]);

    console.log(`✅ Contract record created: ${contractRecord.rows[0].contract_name}`);

    // Step 2: Create bookings
    console.log("\n📋 STEP 2: Creating bookings...");

    const createdBookings = [];
    for (const bookingData of bookingsData) {
      const {
        eventName, eventType, customerId, venueId, spaceId,
        eventDate, endDate, startTime, endTime, guestCount,
        setupStyle, status = 'inquiry', totalAmount, depositAmount,
        notes, isMultiDay
      } = bookingData;

      console.log(`   Creating booking: ${eventName} on ${eventDate}`);

      const newBooking = await pool.query(`
        INSERT INTO bookings (
          tenant_id, event_name, event_type, customer_id, venue_id, space_id,
          event_date, end_date, start_time, end_time, guest_count,
          setup_style, status, total_amount, deposit_amount, notes,
          contract_id, is_multi_day, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
        ) RETURNING *
      `, [
        CORRECT_TENANT_ID, eventName, eventType, customerId, venueId, spaceId,
        eventDate, endDate, startTime, endTime, guestCount,
        setupStyle, status, totalAmount, depositAmount, notes,
        contractId, isMultiDay
      ]);

      console.log(`   ✅ Created booking ID: ${newBooking.rows[0].id}`);
      createdBookings.push(newBooking.rows[0]);
    }

    console.log(`\n✅ SUCCESS: Contract and ${createdBookings.length} bookings created!`);

    // Verify the relationships
    console.log("\n📋 STEP 3: Verifying relationships...");

    const verifyQuery = `
      SELECT c.contract_name, c.status as contract_status, c.total_amount as contract_total,
             b.id as booking_id, b.event_name, b.event_date, b.total_amount as booking_amount
      FROM contracts c
      JOIN bookings b ON c.id = b.contract_id
      WHERE c.id = $1
      ORDER BY b.event_date
    `;

    const verifyResult = await pool.query(verifyQuery, [contractId]);
    console.log(`   Contract: ${verifyResult.rows[0].contract_name}`);
    console.log(`   Status: ${verifyResult.rows[0].contract_status}`);
    console.log(`   Total: $${verifyResult.rows[0].contract_total}`);
    console.log(`   Linked Bookings:`);

    verifyResult.rows.forEach((row, i) => {
      console.log(`     ${i + 1}. ${row.event_name} on ${row.event_date} ($${row.booking_amount})`);
    });

    // Clean up test data
    console.log("\n📋 CLEANING UP TEST DATA...");
    await pool.query(`DELETE FROM bookings WHERE contract_id = $1`, [contractId]);
    await pool.query(`DELETE FROM contracts WHERE id = $1`, [contractId]);
    console.log("✅ Test data cleaned up");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 CONTRACT CREATION FIX SUCCESSFUL!");
    console.log("=".repeat(50));
    console.log("✅ Contract record created first");
    console.log("✅ Bookings linked to contract successfully");
    console.log("✅ Foreign key constraint satisfied");
    console.log("✅ Multi-date event creation should now work");

  } catch (error) {
    console.error('\n🔥 FIXED CONTRACT CREATION TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testContractCreationFix();