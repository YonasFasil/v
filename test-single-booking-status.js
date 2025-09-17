const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testSingleBookingStatusUpdate() {
  try {
    console.log('Testing single booking status update...');

    // Find a single (non-contract) booking
    const bookingsResult = await pool.query(`
      SELECT id, status, contract_id, customer_id, tenant_id
      FROM bookings
      WHERE contract_id IS NULL
      LIMIT 3
    `);

    console.log('Available single bookings:');
    bookingsResult.rows.forEach((booking, index) => {
      console.log(`${index + 1}. ID: ${booking.id}, Status: ${booking.status}, Customer: ${booking.customer_id}`);
    });

    if (bookingsResult.rows.length === 0) {
      console.log('No single bookings found. Creating a test booking...');

      // Get a customer and venue for test booking
      const customerResult = await pool.query('SELECT id, tenant_id FROM customers LIMIT 1');
      const venueResult = await pool.query('SELECT id FROM venues LIMIT 1');

      if (customerResult.rows.length === 0 || venueResult.rows.length === 0) {
        console.log('Need customer and venue to create test booking');
        return;
      }

      const testBookingId = 'test-single-booking-' + Date.now();
      await pool.query(`
        INSERT INTO bookings (
          id, tenant_id, customer_id, venue_id, status, date_start, date_end,
          total_amount, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        testBookingId,
        customerResult.rows[0].tenant_id,
        customerResult.rows[0].id,
        venueResult.rows[0].id,
        'inquiry',
        new Date(),
        new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
        500.00
      ]);

      console.log(`Created test booking: ${testBookingId}`);

      // Test status update
      const updateResult = await pool.query(`
        UPDATE bookings
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, updated_at
      `, ['confirmed', testBookingId]);

      console.log('Update result:', updateResult.rows[0]);

    } else {
      // Test updating an existing single booking
      const booking = bookingsResult.rows[0];
      const newStatus = booking.status === 'inquiry' ? 'confirmed' : 'inquiry';

      console.log(`\nTesting status update on booking ${booking.id}`);
      console.log(`Current status: ${booking.status} -> New status: ${newStatus}`);

      const updateResult = await pool.query(`
        UPDATE bookings
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, status, updated_at
      `, [newStatus, booking.id]);

      console.log('Update successful:', updateResult.rows[0]);

      // Test the API endpoint pattern (simulating the frontend request)
      console.log('\n--- Simulating API endpoint logic ---');

      // This is what the PATCH /api/bookings/:id endpoint should do
      const apiTestResult = await pool.query(`
        UPDATE bookings
        SET status = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING id, status, updated_at, customer_id, venue_id, date_start, date_end, total_amount
      `, [booking.status, booking.id, booking.tenant_id]); // Revert back

      console.log('API-style update result:', apiTestResult.rows[0]);
    }

  } catch (error) {
    console.error('Error testing single booking status update:', error);
  } finally {
    await pool.end();
  }
}

testSingleBookingStatusUpdate();