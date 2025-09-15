const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let pool;

  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    if (req.method === 'GET') {
      // Get system settings
      const result = await pool.query(`
        SELECT
          COUNT(DISTINCT t.id) as total_tenants,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT v.id) as total_venues,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT sp.id) as total_packages
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        LEFT JOIN venues v ON t.id = v.tenant_id
        LEFT JOIN bookings b ON t.id = b.tenant_id
        LEFT JOIN subscription_packages sp ON true
      `);

      const stats = result.rows[0];

      // Get system health indicators
      const healthResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE t.status = 'active') as active_tenants,
          COUNT(*) FILTER (WHERE t.status = 'suspended') as suspended_tenants,
          COUNT(*) FILTER (WHERE t.status = 'cancelled') as cancelled_tenants,
          COUNT(DISTINCT pc.id) as public_customers
        FROM tenants t
        LEFT JOIN public_customers pc ON true
        WHERE t.id IS NOT NULL
      `);

      const health = healthResult.rows[0];

      return res.json({
        system: {
          totalTenants: parseInt(stats.total_tenants),
          totalUsers: parseInt(stats.total_users),
          totalVenues: parseInt(stats.total_venues),
          totalBookings: parseInt(stats.total_bookings),
          totalPackages: parseInt(stats.total_packages),
          activeTenants: parseInt(health.active_tenants),
          suspendedTenants: parseInt(health.suspended_tenants),
          cancelledTenants: parseInt(health.cancelled_tenants),
          publicCustomers: parseInt(health.public_customers)
        },
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};