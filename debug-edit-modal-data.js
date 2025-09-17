const { Pool } = require('pg');

async function debugEditModalData() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log('Debugging edit modal data format...\n');

    // Get a booking with service data
    const result = await pool.query(`
      SELECT *
      FROM bookings
      WHERE tenant_id = $1
        AND selected_services IS NOT NULL
        AND selected_services != ''
      LIMIT 1
    `, ['f50ed3e1-944b-49b7-bd1f-d50622f76172']);

    if (result.rows.length === 0) {
      console.log('❌ No bookings found with service data');
      return;
    }

    const booking = result.rows[0];
    console.log('Booking with service data:');
    console.log('ID:', booking.id);
    console.log('Event Name:', booking.event_name);

    console.log('\n=== RAW DATABASE VALUES ===');
    console.log('package_id:', booking.package_id);
    console.log('selected_services (raw):', booking.selected_services);
    console.log('item_quantities (raw):', booking.item_quantities);
    console.log('pricing_overrides (raw):', booking.pricing_overrides);
    console.log('service_tax_overrides (raw):', booking.service_tax_overrides);

    console.log('\n=== DATA TYPES ===');
    console.log('selected_services type:', typeof booking.selected_services);
    console.log('item_quantities type:', typeof booking.item_quantities);
    console.log('pricing_overrides type:', typeof booking.pricing_overrides);

    console.log('\n=== FRONTEND GET FORMAT (what edit modal sees) ===');

    // This simulates what the frontend GET /api/bookings returns
    const frontendResult = await pool.query(`
      SELECT b.*,
             b.event_name as "eventName",
             b.event_date as "eventDate",
             b.start_time as "startTime",
             b.end_time as "endTime",
             b.guest_count as "guestCount",
             b.total_amount as "totalAmount",
             b.customer_id as "customerId",
             b.venue_id as "venueId",
             b.space_id as "spaceId",
             b.package_id as "packageId",
             b.selected_services as "selectedServices",
             b.item_quantities as "itemQuantities",
             b.pricing_overrides as "pricingOverrides",
             b.service_tax_overrides as "serviceTaxOverrides",
             c.name as customer_name,
             v.name as venue_name,
             s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.id = $1
    `, [booking.id]);

    const frontendBooking = frontendResult.rows[0];

    console.log('Frontend sees:');
    console.log('packageId:', frontendBooking.packageId);
    console.log('selectedServices:', frontendBooking.selectedServices);
    console.log('itemQuantities:', frontendBooking.itemQuantities);
    console.log('pricingOverrides:', frontendBooking.pricingOverrides);
    console.log('serviceTaxOverrides:', frontendBooking.serviceTaxOverrides);

    console.log('\n=== PARSING ATTEMPTS ===');

    try {
      if (frontendBooking.selectedServices) {
        if (typeof frontendBooking.selectedServices === 'string') {
          const parsed = JSON.parse(frontendBooking.selectedServices);
          console.log('✅ selectedServices parsed:', parsed);
        } else {
          console.log('✅ selectedServices already parsed:', frontendBooking.selectedServices);
        }
      }
    } catch (e) {
      console.log('❌ selectedServices parse error:', e.message);
    }

    try {
      if (frontendBooking.itemQuantities) {
        if (typeof frontendBooking.itemQuantities === 'string') {
          const parsed = JSON.parse(frontendBooking.itemQuantities);
          console.log('✅ itemQuantities parsed:', parsed);
        } else {
          console.log('✅ itemQuantities already parsed:', frontendBooking.itemQuantities);
        }
      }
    } catch (e) {
      console.log('❌ itemQuantities parse error:', e.message);
    }

    console.log('\n=== CONCLUSION ===');
    console.log('If the edit modal shows empty packages/services, the issue is likely:');
    console.log('1. Frontend not parsing JSON strings from database');
    console.log('2. Frontend form not reading the correct field names');
    console.log('3. Frontend expecting different data format than what is stored');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugEditModalData();