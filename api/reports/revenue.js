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

    // Get revenue by status
    const revenueByStatusQuery = `
      SELECT
        COALESCE(SUM(CASE
          WHEN status IN ('confirmed_deposit_paid', 'confirmed_fully_paid', 'completed')
          THEN total_amount ELSE 0
        END), 0) as collected,
        COALESCE(SUM(CASE
          WHEN status = 'confirmed'
          THEN total_amount ELSE 0
        END), 0) as outstanding,
        COALESCE(SUM(CASE
          WHEN status IN ('inquiry', 'tentative')
          THEN total_amount ELSE 0
        END), 0) as pending
      FROM bookings
      WHERE tenant_id = $1 ${dateFilter}
    `;

    const revenueByStatusResult = await pool.query(revenueByStatusQuery, [tenantId]);
    const revenueByStatus = revenueByStatusResult.rows[0];

    // Get payment breakdown
    const paymentBreakdownQuery = `
      SELECT
        COALESCE(SUM(CASE
          WHEN status IN ('confirmed_deposit_paid', 'confirmed_fully_paid')
          THEN deposit_amount ELSE 0
        END), 0) as deposits,
        COALESCE(SUM(CASE
          WHEN status = 'confirmed_fully_paid'
          THEN (total_amount - COALESCE(deposit_amount, 0)) ELSE 0
        END), 0) as final_payments,
        0 as refunds
      FROM bookings
      WHERE tenant_id = $1 ${dateFilter}
    `;

    const paymentBreakdownResult = await pool.query(paymentBreakdownQuery, [tenantId]);
    const paymentBreakdown = paymentBreakdownResult.rows[0];

    // Get monthly revenue trends
    const monthlyRevenueQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as transactions
      FROM bookings
      WHERE tenant_id = $1 ${dateFilter}
        AND status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed')
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    const monthlyRevenueResult = await pool.query(monthlyRevenueQuery, [tenantId]);

    // Get revenue by customer type (if available)
    const revenueByCustomerTypeQuery = `
      SELECT
        COALESCE(c.type, 'Individual') as customer_type,
        COALESCE(SUM(b.total_amount), 0) as total,
        COUNT(b.id) as count,
        COALESCE(AVG(b.total_amount), 0) as average
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.tenant_id = $1 ${dateFilter}
        AND b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed')
      GROUP BY c.type
      ORDER BY total DESC
    `;

    let revenueByCustomerType = {};
    try {
      const revenueByCustomerTypeResult = await pool.query(revenueByCustomerTypeQuery, [tenantId]);
      revenueByCustomerType = revenueByCustomerTypeResult.rows.reduce((acc, row) => {
        acc[row.customer_type] = {
          total: parseFloat(row.total),
          count: parseInt(row.count),
          average: parseFloat(row.average)
        };
        return acc;
      }, {});
    } catch (error) {
      // If customer type column doesn't exist, provide default
      console.warn('Customer type column not available:', error.message);
      revenueByCustomerType = {
        'Individual': {
          total: parseFloat(revenueByStatus.collected) + parseFloat(revenueByStatus.outstanding),
          count: 1,
          average: parseFloat(revenueByStatus.collected) + parseFloat(revenueByStatus.outstanding)
        }
      };
    }

    // Calculate totals
    const totalRevenue = parseFloat(revenueByStatus.collected) + parseFloat(revenueByStatus.outstanding);
    const projectedRevenue = totalRevenue + parseFloat(revenueByStatus.pending);

    // Format response
    const response = {
      revenueByStatus: {
        collected: parseFloat(revenueByStatus.collected) || 0,
        pending: parseFloat(revenueByStatus.pending) || 0,
        outstanding: parseFloat(revenueByStatus.outstanding) || 0
      },
      paymentBreakdown: {
        deposits: parseFloat(paymentBreakdown.deposits) || 0,
        finalPayments: parseFloat(paymentBreakdown.final_payments) || 0,
        refunds: parseFloat(paymentBreakdown.refunds) || 0
      },
      monthlyRevenue: monthlyRevenueResult.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        transactions: parseInt(row.transactions)
      })),
      revenueByCustomerType: revenueByCustomerType,
      totalRevenue: totalRevenue,
      projectedRevenue: projectedRevenue
    };

    return res.json(response);

  } catch (error) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch revenue analytics',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}