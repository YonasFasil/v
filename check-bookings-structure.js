const { Pool } = require('pg');

async function checkBookingsTable() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📋 Bookings table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Get sample bookings data
    console.log('\n📊 Sample bookings data:');
    const sampleBookings = await pool.query('SELECT * FROM bookings LIMIT 3');
    console.log('Total bookings:', sampleBookings.rows.length);

    if (sampleBookings.rows.length > 0) {
      console.log('Available columns in bookings data:', Object.keys(sampleBookings.rows[0]));
      console.log('\nSample booking:');
      const booking = sampleBookings.rows[0];
      console.log(`  ID: ${booking.id}`);
      console.log(`  Title/Event Name: ${booking.title || booking.event_name || booking.name || 'NULL'}`);
      console.log(`  Status: ${booking.status || 'NULL'}`);
      console.log(`  Date: ${booking.start_date || booking.event_date || booking.date || 'NULL'}`);
      console.log(`  Venue ID: ${booking.venue_id || 'NULL'}`);
      console.log(`  Customer ID: ${booking.customer_id || 'NULL'}`);
      console.log(`  Tenant ID: ${booking.tenant_id || 'NULL'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBookingsTable();