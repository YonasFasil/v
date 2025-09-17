const { Pool } = require('pg');

async function debugEditModalDataSafe() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log('Debugging edit modal data format (safe mode)...\n');

    // Get bookings with ANY service data (even empty)
    const result = await pool.query(`
      SELECT
        id, event_name,
        package_id,
        selected_services,
        item_quantities,
        pricing_overrides,
        service_tax_overrides
      FROM bookings
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 3
    `, ['f50ed3e1-944b-49b7-bd1f-d50622f76172']);

    console.log('Found', result.rows.length, 'recent bookings');

    result.rows.forEach((booking, i) => {
      console.log(`\n${i + 1}. ${booking.event_name} (${booking.id})`);

      console.log('  package_id:', booking.package_id, `(${typeof booking.package_id})`);
      console.log('  selected_services:', booking.selected_services, `(${typeof booking.selected_services})`);
      console.log('  item_quantities:', booking.item_quantities, `(${typeof booking.item_quantities})`);
      console.log('  pricing_overrides:', booking.pricing_overrides, `(${typeof booking.pricing_overrides})`);

      // Check if selected_services is a valid UUID or JSON
      if (booking.selected_services) {
        const str = booking.selected_services.toString();
        console.log('  selected_services length:', str.length);
        console.log('  selected_services content:', JSON.stringify(str));

        // Check if it looks like a UUID
        if (str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log('  ✅ Looks like a UUID (single service)');
        } else if (str.startsWith('[') || str.startsWith('{')) {
          console.log('  ✅ Looks like JSON (multiple services)');
        } else {
          console.log('  ❓ Unknown format');
        }
      }
    });

    console.log('\n=== ISSUE ANALYSIS ===');
    console.log('Based on the data structure, the issue could be:');
    console.log('1. Frontend expects selectedServices as array but gets string UUID');
    console.log('2. Frontend expects JSON format but gets raw UUID');
    console.log('3. Edit modal form fields not bound to correct data properties');

    // Now let's check what packages and services are available
    console.log('\n=== AVAILABLE PACKAGES ===');
    const packagesResult = await pool.query(`
      SELECT id, name FROM packages WHERE tenant_id = $1 AND is_active = true
    `, ['f50ed3e1-944b-49b7-bd1f-d50622f76172']);

    packagesResult.rows.forEach(pkg => {
      console.log(`  ${pkg.id}: ${pkg.name}`);
    });

    console.log('\n=== AVAILABLE SERVICES ===');
    const servicesResult = await pool.query(`
      SELECT id, name FROM services WHERE tenant_id = $1 AND is_active = true
    `, ['f50ed3e1-944b-49b7-bd1f-d50622f76172']);

    servicesResult.rows.forEach(service => {
      console.log(`  ${service.id}: ${service.name}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugEditModalDataSafe();