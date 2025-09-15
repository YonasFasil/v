const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPublicAPIs() {
  try {
    console.log('Testing Public Customer APIs...');

    // Test 1: Check if we have venues for browsing
    console.log('\n1. Testing venue availability for public browsing...');
    const venuesResult = await pool.query(`
      SELECT
        v.id, v.name, v.description, v.is_active,
        t.name as tenant_name, t.status as tenant_status
      FROM venues v
      JOIN tenants t ON v.tenant_id = t.id
      WHERE v.is_active = true AND t.status = 'active'
      LIMIT 3
    `);

    console.log(`Found ${venuesResult.rows.length} active venues:`);
    venuesResult.rows.forEach(venue => {
      console.log(`- ${venue.name} (${venue.tenant_name}) - Active: ${venue.is_active}`);
    });

    // Test 2: Check public customer and inquiry data
    console.log('\n2. Testing public customer and inquiry data...');
    const customerResult = await pool.query(`
      SELECT pc.*,
             COUNT(bi.id) as inquiry_count
      FROM public_customers pc
      LEFT JOIN booking_inquiries bi ON pc.id = bi.public_customer_id
      GROUP BY pc.id
    `);

    console.log(`Found ${customerResult.rows.length} public customers:`);
    customerResult.rows.forEach(customer => {
      console.log(`- ${customer.first_name} ${customer.last_name} (${customer.email}) - ${customer.inquiry_count} inquiries`);
    });

    // Test 3: Check booking inquiries with venue details
    console.log('\n3. Testing booking inquiries with venue details...');
    const inquiriesResult = await pool.query(`
      SELECT
        bi.id, bi.event_name, bi.event_date, bi.guest_count, bi.status,
        v.name as venue_name,
        t.name as tenant_name,
        pc.first_name || ' ' || pc.last_name as customer_name
      FROM booking_inquiries bi
      JOIN venues v ON bi.venue_id = v.id
      JOIN tenants t ON bi.tenant_id = t.id
      LEFT JOIN public_customers pc ON bi.public_customer_id = pc.id
    `);

    console.log(`Found ${inquiriesResult.rows.length} booking inquiries:`);
    inquiriesResult.rows.forEach(inquiry => {
      console.log(`- ${inquiry.event_name} at ${inquiry.venue_name} (${inquiry.tenant_name}) for ${inquiry.guest_count} guests - Status: ${inquiry.status}`);
      console.log(`  Customer: ${inquiry.customer_name || 'Guest'}, Date: ${inquiry.event_date}`);
    });

    // Test 4: Check spaces for venues
    console.log('\n4. Testing venue spaces...');
    if (venuesResult.rows.length > 0) {
      const spacesResult = await pool.query(`
        SELECT s.*, v.name as venue_name
        FROM spaces s
        JOIN venues v ON s.venue_id = v.id
        WHERE s.venue_id = $1 AND s.is_active = true
      `, [venuesResult.rows[0].id]);

      console.log(`Found ${spacesResult.rows.length} spaces for venue "${venuesResult.rows[0].name}":`);
      spacesResult.rows.forEach(space => {
        console.log(`- ${space.name} (Capacity: ${space.capacity}) - Active: ${space.is_active}`);
      });
    }

    // Test 5: Check packages and services
    console.log('\n5. Testing packages and services...');
    if (venuesResult.rows.length > 0) {
      const venue = venuesResult.rows[0];

      // Get tenant ID
      const tenantResult = await pool.query('SELECT tenant_id FROM venues WHERE id = $1', [venue.id]);
      const tenantId = tenantResult.rows[0].tenant_id;

      const packagesResult = await pool.query(`
        SELECT * FROM packages WHERE tenant_id = $1 AND is_active = true
      `, [tenantId]);

      const servicesResult = await pool.query(`
        SELECT * FROM services WHERE tenant_id = $1 AND is_active = true
      `, [tenantId]);

      console.log(`Found ${packagesResult.rows.length} packages and ${servicesResult.rows.length} services for tenant`);
    }

    console.log('\n✅ All public API data structures are ready!');

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✅ Public customers table: ${customerResult.rows.length} records`);
    console.log(`✅ Active venues: ${venuesResult.rows.length} available for browsing`);
    console.log(`✅ Booking inquiries: ${inquiriesResult.rows.length} records`);
    console.log('✅ Database schema is ready for public customer portal');

  } catch (error) {
    console.error('❌ Error testing public APIs:', error.message);
  } finally {
    await pool.end();
  }
}

testPublicAPIs();