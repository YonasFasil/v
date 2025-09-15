const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');

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
      // Get basic analytics data for super admin dashboard

      // Basic tenant count
      const tenantResult = await pool.query(`
        SELECT COUNT(*) as total_tenants,
               COUNT(*) FILTER (WHERE status = 'active') as active_tenants
        FROM tenants
      `);

      // Basic venue count
      const venueResult = await pool.query(`
        SELECT COUNT(*) as total_venues,
               COUNT(*) FILTER (WHERE is_active = true) as active_venues
        FROM venues
      `);

      // Basic customer count (if table exists)
      let customerResult;
      try {
        customerResult = await pool.query(`
          SELECT COUNT(*) as total_customers
          FROM public_customers
        `);
      } catch (err) {
        customerResult = { rows: [{ total_customers: 0 }] };
      }

      // Basic package count
      let packageResult;
      try {
        packageResult = await pool.query(`
          SELECT COUNT(*) as total_packages
          FROM subscription_packages
          WHERE is_active = true
        `);
      } catch (err) {
        packageResult = { rows: [{ total_packages: 0 }] };
      }

      return res.json({
        overview: {
          totalTenants: parseInt(tenantResult.rows[0].total_tenants || 0),
          activeTenants: parseInt(tenantResult.rows[0].active_tenants || 0),
          totalVenues: parseInt(venueResult.rows[0].total_venues || 0),
          activeVenues: parseInt(venueResult.rows[0].active_venues || 0),
          totalCustomers: parseInt(customerResult.rows[0].total_customers || 0),
          totalPackages: parseInt(packageResult.rows[0].total_packages || 0)
        },
        lastUpdated: new Date().toISOString()
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Analytics API error:', error);
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