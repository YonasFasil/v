const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('../db-config.js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool;

  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Extract tenant ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const tenantId = decoded.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'No tenant access' });
    }

    // Setup database connection
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    const { dateRange } = req.query;

    // Calculate date filter based on range
    let dateFilter = '';
    const today = new Date();

    switch (dateRange) {
      case '7days':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= '${weekAgo.toISOString()}'`;
        break;
      case '30days':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= '${monthAgo.toISOString()}'`;
        break;
      case '3months':
        const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= '${threeMonthsAgo.toISOString()}'`;
        break;
      case '6months':
        const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= '${sixMonthsAgo.toISOString()}'`;
        break;
      case '1year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= '${yearAgo.toISOString()}'`;
        break;
      default:
        // Default to 3 months
        const defaultAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = `AND created_at >= '${defaultAgo.toISOString()}'`;
    }

    // Get customer totals
    const customerTotalsQuery = `
      SELECT
        COUNT(*) as total_customers
      FROM customers
      WHERE tenant_id = $1 ${dateFilter}
    `;

    const customerTotalsResult = await pool.query(customerTotalsQuery, [tenantId]);

    // Get lead totals (if leads table exists)
    let leadTotals = { total_leads: 0 };
    try {
      const leadTotalsQuery = `
        SELECT
          COUNT(*) as total_leads
        FROM leads
        WHERE tenant_id = $1 ${dateFilter}
      `;
      const leadTotalsResult = await pool.query(leadTotalsQuery, [tenantId]);
      leadTotals = leadTotalsResult.rows[0];
    } catch (error) {
      console.warn('Leads table not available:', error.message);
    }

    // Get customer acquisition trends
    const acquisitionTrendsQuery = `
      WITH customer_monthly AS (
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
          COUNT(*) as customers
        FROM customers
        WHERE tenant_id = $1 ${dateFilter}
        GROUP BY DATE_TRUNC('month', created_at)
      ),
      lead_monthly AS (
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
          COUNT(*) as leads
        FROM leads
        WHERE tenant_id = $1 ${dateFilter}
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT
        cm.month,
        COALESCE(cm.customers, 0) as customers,
        COALESCE(lm.leads, 0) as leads,
        CASE
          WHEN COALESCE(lm.leads, 0) > 0 THEN
            ROUND((COALESCE(cm.customers, 0) * 100.0 / lm.leads), 2)
          ELSE 0
        END as conversion
      FROM customer_monthly cm
      FULL OUTER JOIN lead_monthly lm ON cm.month = lm.month
      ORDER BY cm.month
    `;

    let acquisitionTrends = [];
    try {
      const acquisitionTrendsResult = await pool.query(acquisitionTrendsQuery, [tenantId]);
      acquisitionTrends = acquisitionTrendsResult.rows.map(row => ({
        month: row.month,
        customers: parseInt(row.customers) || 0,
        leads: parseInt(row.leads) || 0,
        conversion: parseFloat(row.conversion) || 0
      }));
    } catch (error) {
      // If leads table doesn't exist, just show customer trends
      console.warn('Lead tracking not available:', error.message);
      const customerOnlyQuery = `
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
          COUNT(*) as customers
        FROM customers
        WHERE tenant_id = $1 ${dateFilter}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `;
      const customerOnlyResult = await pool.query(customerOnlyQuery, [tenantId]);
      acquisitionTrends = customerOnlyResult.rows.map(row => ({
        month: row.month,
        customers: parseInt(row.customers),
        leads: 0,
        conversion: 0
      }));
    }

    // Get customer lifetime value
    const customerLTVQuery = `
      SELECT
        c.id,
        c.name,
        COALESCE(c.type, 'Individual') as type,
        COALESCE(SUM(b.total_amount), 0) as total_value,
        COUNT(b.id) as booking_count,
        COALESCE(AVG(b.total_amount), 0) as average_booking_value
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id
        AND b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed')
      WHERE c.tenant_id = $1 ${dateFilter.replace('created_at', 'c.created_at')}
      GROUP BY c.id, c.name, c.type
      HAVING SUM(b.total_amount) > 0
      ORDER BY total_value DESC
      LIMIT 20
    `;

    const customerLTVResult = await pool.query(customerLTVQuery, [tenantId]);

    // Get lead sources (if available)
    let leadSources = {};
    try {
      const leadSourcesQuery = `
        SELECT
          COALESCE(source, 'Unknown') as source,
          COUNT(*) as leads,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
          COALESCE(SUM(CASE WHEN status = 'converted' THEN estimated_value ELSE 0 END), 0) as revenue,
          CASE
            WHEN COUNT(*) > 0 THEN
              ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*)), 2)
            ELSE 0
          END as conversion_rate,
          CASE
            WHEN COUNT(CASE WHEN status = 'converted' THEN 1 END) > 0 THEN
              COALESCE(AVG(CASE WHEN status = 'converted' THEN estimated_value END), 0)
            ELSE 0
          END as average_revenue
        FROM leads
        WHERE tenant_id = $1 ${dateFilter}
        GROUP BY source
        ORDER BY leads DESC
      `;

      const leadSourcesResult = await pool.query(leadSourcesQuery, [tenantId]);
      leadSources = leadSourcesResult.rows.reduce((acc, row) => {
        acc[row.source] = {
          leads: parseInt(row.leads),
          converted: parseInt(row.converted),
          revenue: parseFloat(row.revenue),
          conversionRate: parseFloat(row.conversion_rate),
          averageRevenue: parseFloat(row.average_revenue)
        };
        return acc;
      }, {});
    } catch (error) {
      console.warn('Lead sources not available:', error.message);
    }

    // Format response
    const response = {
      totalCustomers: parseInt(customerTotalsResult.rows[0].total_customers) || 0,
      totalLeads: parseInt(leadTotals.total_leads) || 0,
      acquisitionTrends: acquisitionTrends,
      customerLTV: customerLTVResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        totalValue: parseFloat(row.total_value),
        bookingCount: parseInt(row.booking_count),
        averageBookingValue: parseFloat(row.average_booking_value)
      })),
      leadSources: leadSources
    };

    return res.json(response);

  } catch (error) {
    console.error('Customer analytics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch customer analytics',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}