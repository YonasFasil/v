const { Pool } = require('pg');

async function checkPackageServiceData() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log('Checking recent bookings for package/service data...\n');

    const result = await pool.query(`
      SELECT
        id, event_name, event_date,
        package_id, selected_services,
        item_quantities, pricing_overrides,
        service_tax_overrides, total_amount,
        notes, created_at
      FROM bookings
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, ['f50ed3e1-944b-49b7-bd1f-d50622f76172']);

    console.log('Recent bookings with package/service data:');
    result.rows.forEach((booking, i) => {
      console.log(`${i + 1}. ${booking.event_name} (${booking.event_date ? booking.event_date.toISOString().split('T')[0] : 'No date'})`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Package ID: ${booking.package_id || 'None'}`);
      console.log(`   Selected Services: ${booking.selected_services || 'None'}`);
      console.log(`   Item Quantities: ${booking.item_quantities || 'None'}`);
      console.log(`   Pricing Overrides: ${booking.pricing_overrides || 'None'}`);
      console.log(`   Service Tax Overrides: ${booking.service_tax_overrides || 'None'}`);
      console.log(`   Total Amount: ${booking.total_amount}`);
      console.log(`   Notes: ${booking.notes || 'None'}`);
      console.log(`   Created: ${booking.created_at ? booking.created_at.toISOString() : 'No date'}`);
      console.log('');
    });

    // Check if any booking has package/service data
    const hasPackageData = result.rows.some(b => b.package_id || b.selected_services || b.item_quantities);
    console.log('='.repeat(60));
    if (hasPackageData) {
      console.log('✅ Some bookings have package/service data saved');
    } else {
      console.log('❌ NO bookings have package/service data saved');
      console.log('This suggests the package/service data is not being saved during creation');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPackageServiceData();