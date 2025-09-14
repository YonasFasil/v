const { Pool } = require('pg');

async function findTenantWithBookings() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Finding tenants with bookings...');

    const tenantBookings = await pool.query(`
      SELECT t.id, t.name, COUNT(b.id) as booking_count
      FROM tenants t
      LEFT JOIN bookings b ON t.id = b.tenant_id
      GROUP BY t.id, t.name
      HAVING COUNT(b.id) > 0
      ORDER BY COUNT(b.id) DESC
    `);

    console.log('Tenants with bookings:');
    tenantBookings.rows.forEach(tenant => {
      console.log(`  ${tenant.name}: ${tenant.booking_count} bookings (ID: ${tenant.id})`);
    });

    if (tenantBookings.rows.length > 0) {
      const tenantWithMostBookings = tenantBookings.rows[0];
      console.log(`\n🧪 Testing with tenant that has most bookings: ${tenantWithMostBookings.name}`);

      const events = await pool.query(`SELECT b.*,
               b.event_name as title,
               b.event_date as start_date,
               b.guest_count as estimated_guests,
               c.name as customer_name,
               v.name as venue_name,
               s.name as space_name
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id AND c.tenant_id = $1
        LEFT JOIN venues v ON b.venue_id = v.id AND v.tenant_id = $1
        LEFT JOIN spaces s ON b.space_id = s.id
        WHERE b.tenant_id = $1
        ORDER BY b.event_date DESC`, [tenantWithMostBookings.id]);

      console.log('📅 Sample events for this tenant:');
      events.rows.slice(0, 3).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}`);
        console.log(`     Status: ${event.status}`);
        console.log(`     Date: ${new Date(event.start_date).toDateString()}`);
        console.log(`     Guests: ${event.estimated_guests}`);
        console.log(`     Customer: ${event.customer_name || 'None'}`);
        console.log(`     Venue: ${event.venue_name || 'None'}`);
        console.log(`     Amount: $${event.total_amount || '0'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findTenantWithBookings();