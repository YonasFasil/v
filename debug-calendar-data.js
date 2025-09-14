const { Pool } = require('pg');

async function debugCalendarData() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Checking all bookings data structure...\n");

    // First, check what columns exist
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `;

    const columnsResult = await pool.query(columnsQuery);
    console.log("Bookings table columns:");
    columnsResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log("\n" + "=".repeat(50));

    // Check all bookings regardless of date validity
    const allBookingsQuery = `
      SELECT
        b.id,
        b.event_name,
        b.event_date,
        b.start_time,
        b.end_time,
        b.status,
        b.guest_count,
        b.total_amount,
        b.contract_id,
        c.name as customer_name,
        v.name as venue_name,
        s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = '018c2e25-4973-4c75-b79e-22894700bf89'
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    const allBookingsResult = await pool.query(allBookingsQuery);

    console.log(`Found ${allBookingsResult.rows.length} total bookings:`);

    allBookingsResult.rows.forEach((booking, i) => {
      console.log(`\n${i + 1}. Event: ${booking.event_name || 'NULL'}`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Date: ${booking.event_date || 'NULL'}`);
      console.log(`   Start Time: ${booking.start_time || 'NULL'}`);
      console.log(`   End Time: ${booking.end_time || 'NULL'}`);
      console.log(`   Status: ${booking.status || 'NULL'}`);
      console.log(`   Guest Count: ${booking.guest_count || 'NULL'}`);
      console.log(`   Contract ID: ${booking.contract_id || 'NULL'}`);
      console.log(`   Customer: ${booking.customer_name || 'NULL'}`);
      console.log(`   Venue: ${booking.venue_name || 'NULL'}`);
      console.log(`   Space: ${booking.space_name || 'NULL'}`);

      const hasRequiredFields = booking.event_name && booking.event_date && booking.start_time;
      console.log(`   Calendar Ready: ${hasRequiredFields ? 'Yes ✓' : 'No ✗'}`);
    });

    // Check for any events at all
    console.log("\n" + "=".repeat(50));
    console.log("Checking total count by status...\n");

    const countQuery = `
      SELECT
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN event_date IS NOT NULL THEN 1 END) as with_date,
        COUNT(CASE WHEN start_time IS NOT NULL THEN 1 END) as with_start_time
      FROM bookings
      WHERE tenant_id = '018c2e25-4973-4c75-b79e-22894700bf89'
      GROUP BY status
    `;

    const countResult = await pool.query(countQuery);

    countResult.rows.forEach(row => {
      console.log(`Status "${row.status}": ${row.count} total, ${row.with_date} with dates, ${row.with_start_time} with times`);
    });

  } catch (error) {
    console.error('Error debugging calendar data:', error.message);
  } finally {
    await pool.end();
  }
}

debugCalendarData();