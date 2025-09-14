const { Pool } = require('pg');

// Debug all booking fields for edit modal
async function debugBookingFields() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  const CORRECT_TENANT_ID = 'f50ed3e1-944b-49b7-bd1f-d50622f76172';

  try {
    console.log("Debugging booking fields after our fixes...\n");

    // Test the exact query that's now in tenant.js after our fix
    const bookingsQuery = `SELECT b.*,
             b.event_name as "eventName",
             b.event_date as "eventDate",
             b.start_time as "startTime",
             b.end_time as "endTime",
             b.guest_count as "guestCount",
             b.total_amount as "totalAmount",
             b.customer_id as "customerId",
             b.venue_id as "venueId",
             b.space_id as "spaceId",
             c.name as customer_name,
             v.name as venue_name,
             s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      WHERE b.tenant_id = $1
      ORDER BY b.event_date DESC
      LIMIT 1`;

    const result = await pool.query(bookingsQuery, [CORRECT_TENANT_ID]);

    if (result.rows.length === 0) {
      console.log("No bookings found");
      return;
    }

    const booking = result.rows[0];

    console.log("=".repeat(60));
    console.log("CURRENT BOOKING API RESPONSE AFTER FIXES");
    console.log("=".repeat(60));

    // Check all fields the edit modal needs
    const requiredFields = [
      'id', 'eventName', 'guestCount', 'startTime', 'endTime',
      'status', 'notes', 'customerId', 'venueId', 'spaceId', 'eventDate'
    ];

    console.log("\nEdit Modal Required Fields:");
    requiredFields.forEach(field => {
      const value = booking[field];
      const exists = value !== null && value !== undefined;
      console.log(`  ${field}: ${exists ? '✅' : '❌'} "${value}"`);
    });

    // Check what's in the raw booking object
    console.log("\n" + "=".repeat(60));
    console.log("FULL BOOKING OBJECT:");
    console.log("=".repeat(60));

    // Only show relevant fields to avoid clutter
    const relevantFields = {
      id: booking.id,
      eventName: booking.eventName,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      totalAmount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes,
      customerId: booking.customerId,
      venueId: booking.venueId,
      spaceId: booking.spaceId,
      customer_name: booking.customer_name,
      venue_name: booking.venue_name,
      space_name: booking.space_name,
      // Check for package/service fields that might be missing
      package_id: booking.package_id,
      packageId: booking.packageId,
      selected_services: booking.selected_services,
      selectedServices: booking.selectedServices
    };

    console.log(JSON.stringify(relevantFields, null, 2));

    // Check for potential issues
    console.log("\n" + "=".repeat(60));
    console.log("POTENTIAL ISSUES:");
    console.log("=".repeat(60));

    if (!booking.customerId) {
      console.log("❌ customerId is missing - customer won't be preselected");
    } else {
      console.log("✅ customerId present - customer should be preselected");
    }

    if (!booking.venueId) {
      console.log("❌ venueId is missing - venue won't be preselected");
    } else {
      console.log("✅ venueId present - venue should be preselected");
    }

    if (!booking.spaceId) {
      console.log("❌ spaceId is missing - space won't be preselected");
    } else {
      console.log("✅ spaceId present - space should be preselected");
    }

    // Check if package/service info is missing
    if (booking.package_id && !booking.packageId) {
      console.log("❌ package_id exists but packageId alias missing");
    }

    if (booking.selected_services && !booking.selectedServices) {
      console.log("❌ selected_services exists but selectedServices alias missing");
    }

    console.log("\n" + "=".repeat(60));
    console.log("RECOMMENDED ACTIONS:");
    console.log("=".repeat(60));

    if (booking.package_id && !booking.packageId) {
      console.log("🔧 Add: b.package_id as \"packageId\" to SQL query");
    }

    if (booking.selected_services && !booking.selectedServices) {
      console.log("🔧 Add: b.selected_services as \"selectedServices\" to SQL query");
    }

    console.log("🔧 Test edit modal with current booking data");

  } catch (error) {
    console.error('Error debugging booking fields:', error.message);
  } finally {
    await pool.end();
  }
}

debugBookingFields();