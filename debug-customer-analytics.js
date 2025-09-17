const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testCustomerAnalytics() {
  try {
    // Test the NEW customer analytics query
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.company_id as "companyId",
        c.status,
        c.notes,
        json_build_object(
          'totalRevenue', COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0),
          'lifetimeValue', COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0),
          'lifetimeValueCategory',
            CASE
              WHEN COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) >= 10000 THEN 'Platinum'
              WHEN COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) >= 5000 THEN 'Gold'
              WHEN COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) >= 1000 THEN 'Silver'
              ELSE 'Bronze'
            END,
          'bookingsCount', COUNT(DISTINCT b.id),
          'confirmedBookings', COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END),
          'completedBookings', COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END),
          'pendingBookings', COUNT(DISTINCT CASE WHEN b.status = 'inquiry' THEN b.id END),
          'cancelledBookings', COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END),
          'averageBookingValue',
            CASE
              WHEN COUNT(DISTINCT CASE WHEN b.status IN ('confirmed', 'completed') THEN b.id END) > 0
              THEN COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) / COUNT(DISTINCT CASE WHEN b.status IN ('confirmed', 'completed') THEN b.id END)
              ELSE 0
            END,
          'lastEventDate', MAX(b.event_date),
          'lastEventName', (
            SELECT b2.event_name
            FROM bookings b2
            WHERE b2.customer_id = c.id AND b2.tenant_id = c.tenant_id
            ORDER BY b2.event_date DESC
            LIMIT 1
          ),
          'customerSince', c.created_at
        ) as analytics
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id AND c.tenant_id = b.tenant_id
      WHERE c.tenant_id = (SELECT id FROM tenants LIMIT 1)
      GROUP BY c.id, c.name, c.email, c.phone, c.company_id, c.status, c.notes, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 3
    `);

    console.log('NEW Customer analytics result:');
    console.log(JSON.stringify(result.rows, null, 2));

    // Test if customers table has any data
    const customerCount = await pool.query(`
      SELECT COUNT(*) as count FROM customers
      WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
    `);

    console.log('\nCustomer count:', customerCount.rows[0].count);

    // Test what tenants exist
    const tenants = await pool.query('SELECT id, name FROM tenants LIMIT 3');
    console.log('\nTenants:', tenants.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testCustomerAnalytics();