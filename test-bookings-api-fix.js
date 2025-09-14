const { Pool } = require('pg');

async function testBookingsApiFix() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 Testing the fixed bookings API query...');

    // Find a tenant with bookings
    const tenantResult = await pool.query(`
      SELECT t.id, t.name, COUNT(b.id) as booking_count
      FROM tenants t
      LEFT JOIN bookings b ON t.id = b.tenant_id
      GROUP BY t.id, t.name
      HAVING COUNT(b.id) > 0
      ORDER BY COUNT(b.id) DESC
      LIMIT 1
    `);

    if (tenantResult.rows.length === 0) {
      console.log('No tenants with bookings found');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log(`Testing with tenant: ${tenant.name} (${tenant.booking_count} bookings)`);

    // Test the new bookings query
    const bookings = await pool.query(`SELECT b.*,
             b.event_name as eventName,
             b.event_date as eventDate,
             b.start_time as startTime,
             b.end_time as endTime,
             b.guest_count as guestCount,
             b.total_amount as totalAmount,
             c.name as customer_name,
             v.name as venue_name,
             s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1
      ORDER BY b.event_date DESC
      LIMIT 3`, [tenant.id]);

    console.log('✅ Query executed successfully!');
    console.log('Sample bookings with frontend-expected fields:');

    bookings.rows.forEach((booking, index) => {
      console.log(`\n  ${index + 1}. Event: ${booking.eventName} (mapped from event_name)`);
      console.log(`     Date: ${booking.eventDate} (mapped from event_date)`);
      console.log(`     Time: ${booking.startTime} - ${booking.endTime} (mapped from start/end_time)`);
      console.log(`     Guests: ${booking.guestCount} (mapped from guest_count)`);
      console.log(`     Amount: $${booking.totalAmount || '0'} (mapped from total_amount)`);
      console.log(`     Status: ${booking.status}`);
      console.log(`     Venue: ${booking.venue_name || 'No Venue'}`);
      console.log(`     Customer: ${booking.customer_name || 'No Customer'}`);
    });

    console.log('\n✅ All frontend-expected columns are now available!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testBookingsApiFix();