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

    // Get comprehensive analytics data
    const analyticsQuery = `
      WITH booking_stats AS (
        SELECT
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid') THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COALESCE(SUM(CASE WHEN status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed') THEN total_amount ELSE 0 END), 0) as revenue,
          COALESCE(AVG(CASE WHEN status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed') THEN total_amount END), 0) as avg_booking_value,
          COALESCE(SUM(CASE WHEN status IN ('confirmed_deposit_paid', 'confirmed_fully_paid') THEN deposit_amount ELSE 0 END), 0) as deposits_collected,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) as outstanding_revenue
        FROM bookings
        WHERE tenant_id = $1 ${dateFilter}
      ),
      proposal_stats AS (
        SELECT
          COUNT(*) as total_proposals,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_proposals,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_proposals
        FROM proposals
        WHERE tenant_id = $1 ${dateFilter}
      ),
      customer_stats AS (
        SELECT
          COUNT(*) as total_customers
        FROM customers
        WHERE tenant_id = $1 ${dateFilter}
      ),
      lead_stats AS (
        SELECT
          COUNT(*) as total_leads
        FROM leads
        WHERE tenant_id = $1 ${dateFilter}
      ),
      venue_utilization AS (
        SELECT
          COALESCE(AVG(
            CASE
              WHEN v.capacity > 0 THEN
                (COUNT(b.id) * 100.0 / v.capacity)
              ELSE 0
            END
          ), 0) as utilization
        FROM venues v
        LEFT JOIN bookings b ON v.id = b.venue_id AND b.tenant_id = $1 ${dateFilter.replace('created_at', 'b.created_at')}
        WHERE v.tenant_id = $1 AND v.is_active = true
        GROUP BY v.id
      )
      SELECT
        bs.total_bookings,
        bs.confirmed_bookings,
        bs.cancelled_bookings,
        bs.completed_bookings,
        bs.revenue,
        bs.avg_booking_value,
        bs.deposits_collected,
        bs.outstanding_revenue,
        ps.total_proposals,
        ps.sent_proposals,
        ps.accepted_proposals,
        cs.total_customers,
        ls.total_leads,
        COALESCE(vu.utilization, 0) as utilization,
        -- Calculated metrics
        CASE
          WHEN bs.total_bookings > 0 THEN
            ROUND((bs.cancelled_bookings * 100.0 / bs.total_bookings), 2)
          ELSE 0
        END as cancellation_rate,
        CASE
          WHEN ps.sent_proposals > 0 THEN
            ROUND((ps.accepted_proposals * 100.0 / ps.sent_proposals), 2)
          ELSE 0
        END as proposal_conversion_rate,
        CASE
          WHEN ls.total_leads > 0 THEN
            ROUND((cs.total_customers * 100.0 / ls.total_leads), 2)
          ELSE 0
        END as lead_conversion_rate
      FROM booking_stats bs
      CROSS JOIN proposal_stats ps
      CROSS JOIN customer_stats cs
      CROSS JOIN lead_stats ls
      CROSS JOIN venue_utilization vu
    `;

    const analyticsResult = await pool.query(analyticsQuery, [tenantId]);
    const analytics = analyticsResult.rows[0];

    // Get monthly trends
    const monthlyTrendsQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as bookings,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(
          CASE
            WHEN v.capacity > 0 THEN (COUNT(b.id) * 100.0 / v.capacity)
            ELSE 0
          END
        ), 0) as utilization
      FROM bookings b
      LEFT JOIN venues v ON b.venue_id = v.id
      WHERE b.tenant_id = $1 ${dateFilter}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    const monthlyTrendsResult = await pool.query(monthlyTrendsQuery, [tenantId]);

    // Get venue performance
    const venuePerformanceQuery = `
      SELECT
        v.name,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.total_amount), 0) as revenue,
        CASE
          WHEN v.capacity > 0 THEN
            ROUND((COUNT(b.id) * 100.0 / v.capacity), 2)
          ELSE 0
        END as utilization
      FROM venues v
      LEFT JOIN bookings b ON v.id = b.venue_id AND b.tenant_id = $1 ${dateFilter.replace('created_at', 'b.created_at')}
      WHERE v.tenant_id = $1 AND v.is_active = true
      GROUP BY v.id, v.name, v.capacity
      ORDER BY revenue DESC
    `;

    const venuePerformanceResult = await pool.query(venuePerformanceQuery, [tenantId]);

    // Get revenue by event type
    const revenueByEventTypeQuery = `
      SELECT
        COALESCE(event_type, 'Other') as type,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as count
      FROM bookings
      WHERE tenant_id = $1 ${dateFilter}
        AND status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed')
      GROUP BY event_type
      ORDER BY revenue DESC
    `;

    const revenueByEventTypeResult = await pool.query(revenueByEventTypeQuery, [tenantId]);

    // Get lead sources (if available)
    const leadSourcesQuery = `
      SELECT
        COALESCE(source, 'Unknown') as source,
        COUNT(*) as count
      FROM leads
      WHERE tenant_id = $1 ${dateFilter}
      GROUP BY source
      ORDER BY count DESC
    `;

    let leadSources = {};
    try {
      const leadSourcesResult = await pool.query(leadSourcesQuery, [tenantId]);
      leadSources = leadSourcesResult.rows.reduce((acc, row) => {
        acc[row.source] = row.count;
        return acc;
      }, {});
    } catch (error) {
      // If leads table doesn't exist, use empty object
      console.warn('Leads table not available:', error.message);
    }

    // Calculate growth metrics (compare with previous period)
    const previousPeriodDays = dateRange === '7days' ? 7 :
                              dateRange === '30days' ? 30 :
                              dateRange === '3months' ? 90 :
                              dateRange === '6months' ? 180 :
                              dateRange === '1year' ? 365 : 90;

    const previousStartDate = new Date(today.getTime() - (previousPeriodDays * 2) * 24 * 60 * 60 * 1000);
    const previousEndDate = new Date(today.getTime() - previousPeriodDays * 24 * 60 * 60 * 1000);

    const previousPeriodQuery = `
      SELECT
        COUNT(*) as prev_bookings,
        COALESCE(SUM(total_amount), 0) as prev_revenue
      FROM bookings
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at < $3
        AND status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed')
    `;

    const previousPeriodResult = await pool.query(previousPeriodQuery, [
      tenantId,
      previousStartDate.toISOString(),
      previousEndDate.toISOString()
    ]);

    const prevStats = previousPeriodResult.rows[0];

    // Calculate growth percentages
    const revenueGrowth = prevStats.prev_revenue > 0 ?
      Math.round(((analytics.revenue - prevStats.prev_revenue) / prevStats.prev_revenue) * 100) : 0;

    const bookingGrowth = prevStats.prev_bookings > 0 ?
      Math.round(((analytics.total_bookings - prevStats.prev_bookings) / prevStats.prev_bookings) * 100) : 0;

    // Format response
    const response = {
      totalBookings: parseInt(analytics.total_bookings) || 0,
      revenue: parseFloat(analytics.revenue) || 0,
      activeLeads: parseInt(analytics.total_leads) || 0,
      utilization: Math.round(parseFloat(analytics.utilization)) || 0,
      revenueGrowth: revenueGrowth,
      bookingGrowth: bookingGrowth,
      averageBookingValue: parseFloat(analytics.avg_booking_value) || 0,
      conversionRate: parseFloat(analytics.lead_conversion_rate) || 0,
      proposalConversionRate: parseFloat(analytics.proposal_conversion_rate) / 100 || 0,
      completedEvents: parseInt(analytics.completed_bookings) || 0,
      cancelledEvents: parseInt(analytics.cancelled_bookings) || 0,
      cancellationRate: parseFloat(analytics.cancellation_rate) || 0,
      totalDepositsCollected: parseFloat(analytics.deposits_collected) || 0,
      outstandingRevenue: parseFloat(analytics.outstanding_revenue) || 0,
      sentProposals: parseInt(analytics.sent_proposals) || 0,
      acceptedProposals: parseInt(analytics.accepted_proposals) || 0,
      monthlyTrends: monthlyTrendsResult.rows.map(row => ({
        month: row.month,
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue),
        utilization: Math.round(parseFloat(row.utilization))
      })),
      venuePerformance: venuePerformanceResult.rows.map(row => ({
        name: row.name,
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue),
        utilization: parseFloat(row.utilization)
      })),
      revenueByEventType: revenueByEventTypeResult.rows.map(row => ({
        type: row.type,
        revenue: parseFloat(row.revenue),
        count: parseInt(row.count)
      })),
      leadSources: leadSources
    };

    return res.json(response);

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}