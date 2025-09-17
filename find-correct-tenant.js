const { Pool } = require('pg');

async function findCorrectTenant() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Checking tenant table structure...\n");

    const tenantColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `;

    const tenantColumns = await pool.query(tenantColumnsQuery);
    console.log("Tenants table columns:");
    tenantColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}`);
    });

    console.log("\n" + "=".repeat(50));

    // Get all tenants with available columns
    const tenantsQuery = `
      SELECT *
      FROM tenants
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const tenantsResult = await pool.query(tenantsQuery);
    console.log(`\nFound ${tenantsResult.rows.length} tenants:`);

    tenantsResult.rows.forEach((tenant, i) => {
      console.log(`\n${i + 1}. Tenant ID: ${tenant.id}`);
      console.log(`   Name: ${tenant.name || 'N/A'}`);
      console.log(`   Created: ${tenant.created_at}`);
    });

    console.log("\n" + "=".repeat(50));

    // Check the specific user
    console.log("Finding user's tenant...\n");

    const userQuery = `
      SELECT u.*, t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = 'yonadsdssfasil.sl@gmail.com'
    `;

    const userResult = await pool.query(userQuery);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`User found:`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Tenant: ${user.tenant_name}`);
      console.log(`  Tenant ID: ${user.tenant_id}`);

      // Check bookings for this tenant
      const bookingsQuery = `
        SELECT COUNT(*) as total_count,
               COUNT(CASE WHEN event_date IS NOT NULL THEN 1 END) as with_date,
               COUNT(CASE WHEN start_time IS NOT NULL THEN 1 END) as with_time
        FROM bookings
        WHERE tenant_id = $1
      `;

      const bookingsResult = await pool.query(bookingsQuery, [user.tenant_id]);
      const booking_stats = bookingsResult.rows[0];

      console.log(`\nBookings in this tenant:`);
      console.log(`  Total: ${booking_stats.total_count}`);
      console.log(`  With dates: ${booking_stats.with_date}`);
      console.log(`  With times: ${booking_stats.with_time}`);

      if (parseInt(booking_stats.total_count) > 0) {
        // Get sample bookings
        const sampleQuery = `
          SELECT
            event_name,
            event_date,
            start_time,
            end_time,
            status,
            created_at
          FROM bookings
          WHERE tenant_id = $1
          ORDER BY created_at DESC
          LIMIT 5
        `;

        const sampleResult = await pool.query(sampleQuery, [user.tenant_id]);

        console.log(`\nSample bookings:`);
        sampleResult.rows.forEach((booking, i) => {
          console.log(`\n${i + 1}. ${booking.event_name}`);
          console.log(`   Date: ${booking.event_date}`);
          console.log(`   Time: ${booking.start_time} - ${booking.end_time}`);
          console.log(`   Status: ${booking.status}`);
          console.log(`   Created: ${booking.created_at}`);
        });
      }
    } else {
      console.log("User not found! Let me check all users...");

      const allUsersQuery = `
        SELECT email, name, tenant_id
        FROM users
        WHERE email LIKE '%yona%' OR email LIKE '%fasil%'
      `;

      const allUsersResult = await pool.query(allUsersQuery);
      console.log(`\nFound ${allUsersResult.rows.length} matching users:`);

      allUsersResult.rows.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email} (${user.name}) - Tenant: ${user.tenant_id}`);
      });
    }

  } catch (error) {
    console.error('Error finding correct tenant:', error.message);
  } finally {
    await pool.end();
  }
}

findCorrectTenant();