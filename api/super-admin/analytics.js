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
      // Get analytics data for super admin dashboard

      // Revenue analytics
      const revenueResult = await pool.query(`
        SELECT
          SUM(amount) FILTER (WHERE status = 'paid') as total_revenue,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_bills,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_bills,
          AVG(amount) as average_bill
        FROM billing_history
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Tenant growth analytics
      const growthResult = await pool.query(`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_tenants
        FROM tenants
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);

      // Package distribution
      const packageResult = await pool.query(`
        SELECT
          sp.name as package_name,
          COUNT(t.id) as tenant_count,
          SUM(sp.price) as total_value
        FROM subscription_packages sp
        LEFT JOIN tenants t ON sp.id = t.subscription_package_id
        WHERE sp.is_active = true
        GROUP BY sp.id, sp.name, sp.price
        ORDER BY tenant_count DESC
      `);

      // Venue statistics
      const venueResult = await pool.query(`
        SELECT
          COUNT(DISTINCT v.id) as total_venues,
          COUNT(DISTINCT v.id) FILTER (WHERE v.is_active = true) as active_venues,
          AVG(COALESCE(vv.view_count, 0)) as avg_venue_views
        FROM venues v
        LEFT JOIN (
          SELECT venue_id, COUNT(*) as view_count
          FROM venue_views
          WHERE viewed_at >= NOW() - INTERVAL '30 days'
          GROUP BY venue_id
        ) vv ON v.id = vv.venue_id
      `);

      // Public customer analytics
      const customerResult = await pool.query(`
        SELECT
          COUNT(*) as total_customers,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_customers,
          COUNT(DISTINCT bi.public_customer_id) as customers_with_inquiries
        FROM public_customers pc
        LEFT JOIN booking_inquiries bi ON pc.id = bi.public_customer_id
      `);

      // Inquiry analytics
      const inquiryResult = await pool.query(`
        SELECT
          COUNT(*) as total_inquiries,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_inquiries,
          COUNT(*) FILTER (WHERE status = 'responded') as responded_inquiries,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_inquiries,
          AVG(guest_count) as avg_guest_count
        FROM booking_inquiries
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Top performing venues
      const topVenuesResult = await pool.query(`
        SELECT
          v.name as venue_name,
          t.name as tenant_name,
          COUNT(vv.id) as view_count,
          COUNT(bi.id) as inquiry_count
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        LEFT JOIN venue_views vv ON v.id = vv.venue_id
          AND vv.viewed_at >= NOW() - INTERVAL '30 days'
        LEFT JOIN booking_inquiries bi ON v.id = bi.venue_id
          AND bi.created_at >= NOW() - INTERVAL '30 days'
        WHERE v.is_active = true
        GROUP BY v.id, v.name, t.name
        ORDER BY view_count DESC, inquiry_count DESC
        LIMIT 10
      `);

      // System health metrics
      const healthResult = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE t.status = 'active') as active_tenants,
          COUNT(*) FILTER (WHERE t.status = 'suspended') as suspended_tenants,
          COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = true) as active_users,
          COUNT(DISTINCT bh.tenant_id) as paying_tenants
        FROM tenants t
        LEFT JOIN users u ON t.id = u.tenant_id
        LEFT JOIN billing_history bh ON t.id = bh.tenant_id
          AND bh.status = 'paid'
          AND bh.billing_period_start >= NOW() - INTERVAL '30 days'
      `);

      return res.json({
        revenue: {
          totalRevenue: parseFloat(revenueResult.rows[0].total_revenue || 0),
          paidBills: parseInt(revenueResult.rows[0].paid_bills || 0),
          pendingBills: parseInt(revenueResult.rows[0].pending_bills || 0),
          averageBill: parseFloat(revenueResult.rows[0].average_bill || 0)
        },
        growth: growthResult.rows.map(row => ({
          month: row.month,
          newTenants: parseInt(row.new_tenants)
        })),
        packages: packageResult.rows.map(row => ({
          name: row.package_name,
          tenantCount: parseInt(row.tenant_count),
          totalValue: parseFloat(row.total_value || 0)
        })),
        venues: {
          totalVenues: parseInt(venueResult.rows[0].total_venues || 0),
          activeVenues: parseInt(venueResult.rows[0].active_venues || 0),
          avgViews: parseFloat(venueResult.rows[0].avg_venue_views || 0)
        },
        customers: {
          totalCustomers: parseInt(customerResult.rows[0].total_customers || 0),
          newCustomers: parseInt(customerResult.rows[0].new_customers || 0),
          customersWithInquiries: parseInt(customerResult.rows[0].customers_with_inquiries || 0)
        },
        inquiries: {
          totalInquiries: parseInt(inquiryResult.rows[0].total_inquiries || 0),
          pendingInquiries: parseInt(inquiryResult.rows[0].pending_inquiries || 0),
          respondedInquiries: parseInt(inquiryResult.rows[0].responded_inquiries || 0),
          convertedInquiries: parseInt(inquiryResult.rows[0].converted_inquiries || 0),
          avgGuestCount: parseFloat(inquiryResult.rows[0].avg_guest_count || 0)
        },
        topVenues: topVenuesResult.rows.map(row => ({
          venueName: row.venue_name,
          tenantName: row.tenant_name,
          viewCount: parseInt(row.view_count),
          inquiryCount: parseInt(row.inquiry_count)
        })),
        health: {
          activeTenants: parseInt(healthResult.rows[0].active_tenants || 0),
          suspendedTenants: parseInt(healthResult.rows[0].suspended_tenants || 0),
          activeUsers: parseInt(healthResult.rows[0].active_users || 0),
          payingTenants: parseInt(healthResult.rows[0].paying_tenants || 0)
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