const { Pool } = require('pg');

async function testBookingsQuery() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test the new bookings query with a real tenant
    console.log('🧪 Testing the fixed bookings query...');

    const tenantResult = await pool.query('SELECT id, name FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('No tenants found');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log('Testing with tenant:', tenantResult.rows[0].name, '(', tenantId, ')');

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
      ORDER BY b.event_date DESC`, [tenantId]);

    console.log('✅ Query executed successfully!');
    console.log('Events/Bookings found:', events.rows.length);

    if (events.rows.length > 0) {
      console.log('\n📅 Sample events:');
      events.rows.slice(0, 3).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title} (${event.event_name})`);
        console.log(`     Status: ${event.status}`);
        console.log(`     Date: ${event.start_date || event.event_date}`);
        console.log(`     Guests: ${event.estimated_guests || event.guest_count}`);
        console.log(`     Customer: ${event.customer_name || 'None'}`);
        console.log(`     Venue: ${event.venue_name || 'None'}`);
        console.log(`     Amount: $${event.total_amount || '0'}`);
        console.log('');
      });
    } else {
      console.log('No bookings found for this tenant');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testBookingsQuery();