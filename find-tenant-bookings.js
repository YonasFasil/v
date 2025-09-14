const { Pool } = require('pg');

async function findTenantBookings() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Finding active tenant IDs and checking bookings...\n");

    // First, get all tenants
    const tenantsQuery = `
      SELECT id, name, domain, created_at
      FROM tenants
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const tenantsResult = await pool.query(tenantsQuery);
    console.log(`Found ${tenantsResult.rows.length} tenants:`);

    tenantsResult.rows.forEach((tenant, i) => {
      console.log(`${i + 1}. ${tenant.name} (${tenant.domain})`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Created: ${tenant.created_at}`);
      console.log();
    });

    console.log("=".repeat(50));

    // Check bookings for each tenant
    for (const tenant of tenantsResult.rows) {
      const bookingsCountQuery = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE tenant_id = $1
      `;

      const bookingsCount = await pool.query(bookingsCountQuery, [tenant.id]);
      const count = parseInt(bookingsCount.rows[0].count);

      console.log(`${tenant.name}: ${count} bookings`);

      if (count > 0) {
        // Get a sample of bookings
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
          LIMIT 3
        `;

        const sampleResult = await pool.query(sampleQuery, [tenant.id]);
        sampleResult.rows.forEach((booking, i) => {
          console.log(`  ${i + 1}. ${booking.event_name}`);
          console.log(`     Date: ${booking.event_date}`);
          console.log(`     Time: ${booking.start_time} - ${booking.end_time}`);
          console.log(`     Status: ${booking.status}`);
        });
        console.log();
      }
    }

    // Also check the user account we're using
    console.log("=".repeat(50));
    console.log("Checking user account tenant...\n");

    const userQuery = `
      SELECT u.*, t.name as tenant_name, t.domain as tenant_domain
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
      console.log(`  Tenant: ${user.tenant_name} (${user.tenant_domain})`);
      console.log(`  Tenant ID: ${user.tenant_id}`);

      // Check bookings for this user's tenant
      const userTenantBookingsQuery = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE tenant_id = $1
      `;

      const userTenantBookings = await pool.query(userTenantBookingsQuery, [user.tenant_id]);
      console.log(`  Bookings in user's tenant: ${userTenantBookings.rows[0].count}`);
    } else {
      console.log("User not found!");
    }

  } catch (error) {
    console.error('Error finding tenant bookings:', error.message);
  } finally {
    await pool.end();
  }
}

findTenantBookings();