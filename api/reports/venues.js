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
        dateFilter = `AND b.created_at >= '${weekAgo.toISOString()}'`;
        break;
      case '30days':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND b.created_at >= '${monthAgo.toISOString()}'`;
        break;
      case '3months':
        const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = `AND b.created_at >= '${threeMonthsAgo.toISOString()}'`;
        break;
      case '6months':
        const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        dateFilter = `AND b.created_at >= '${sixMonthsAgo.toISOString()}'`;
        break;
      case '1year':
        const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = `AND b.created_at >= '${yearAgo.toISOString()}'`;
        break;
      default:
        // Default to 3 months
        const defaultAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = `AND b.created_at >= '${defaultAgo.toISOString()}'`;
    }

    // Get venue totals
    const venueTotalsQuery = `
      SELECT
        COUNT(DISTINCT v.id) as total_venues,
        COUNT(DISTINCT s.id) as total_spaces
      FROM venues v
      LEFT JOIN spaces s ON v.id = s.venue_id AND s.is_active = true
      WHERE v.tenant_id = $1 AND v.is_active = true
    `;

    const venueTotalsResult = await pool.query(venueTotalsQuery, [tenantId]);

    // Get venue metrics
    const venueMetricsQuery = `
      SELECT
        v.id,
        v.name,
        COALESCE(v.capacity, 0) as capacity,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid') THEN 1 END) as confirmed_bookings,
        COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed') THEN b.total_amount END), 0) as average_revenue,
        CASE
          WHEN v.capacity > 0 THEN
            ROUND((COUNT(CASE WHEN b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid') THEN 1 END) * 100.0 / v.capacity), 2)
          ELSE 0
        END as utilization,
        COALESCE(AVG(b.guest_count), 0) as average_guest_count
      FROM venues v
      LEFT JOIN bookings b ON v.id = b.venue_id AND b.tenant_id = $1 ${dateFilter}
      WHERE v.tenant_id = $1 AND v.is_active = true
      GROUP BY v.id, v.name, v.capacity
      ORDER BY total_revenue DESC
    `;

    const venueMetricsResult = await pool.query(venueMetricsQuery, [tenantId]);

    // Get event types by venue
    const eventTypesByVenueQuery = `
      SELECT
        v.name as venue_name,
        COALESCE(b.event_type, 'Other') as event_type,
        COUNT(b.id) as count
      FROM venues v
      LEFT JOIN bookings b ON v.id = b.venue_id AND b.tenant_id = $1 ${dateFilter}
      WHERE v.tenant_id = $1 AND v.is_active = true
      GROUP BY v.id, v.name, b.event_type
      HAVING COUNT(b.id) > 0
      ORDER BY v.name, count DESC
    `;

    const eventTypesByVenueResult = await pool.query(eventTypesByVenueQuery, [tenantId]);

    // Process event types by venue data
    const eventTypesByVenue = {};
    eventTypesByVenueResult.rows.forEach(row => {
      if (!eventTypesByVenue[row.venue_name]) {
        eventTypesByVenue[row.venue_name] = {};
      }
      eventTypesByVenue[row.venue_name][row.event_type] = parseInt(row.count);
    });

    // Get space metrics (if spaces table exists)
    let spaceMetrics = [];
    try {
      const spaceMetricsQuery = `
        SELECT
          s.id,
          s.name,
          v.name as venue_name,
          COALESCE(s.capacity, 0) as capacity,
          COUNT(b.id) as bookings,
          COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'confirmed_deposit_paid', 'confirmed_fully_paid', 'completed') THEN b.total_amount ELSE 0 END), 0) as revenue
        FROM spaces s
        LEFT JOIN venues v ON s.venue_id = v.id
        LEFT JOIN bookings b ON s.id = b.space_id AND b.tenant_id = $1 ${dateFilter}
        WHERE s.tenant_id = $1 AND s.is_active = true
        GROUP BY s.id, s.name, v.name, s.capacity
        ORDER BY revenue DESC
        LIMIT 20
      `;

      const spaceMetricsResult = await pool.query(spaceMetricsQuery, [tenantId]);
      spaceMetrics = spaceMetricsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        venueName: row.venue_name,
        capacity: parseInt(row.capacity),
        bookings: parseInt(row.bookings),
        revenue: parseFloat(row.revenue)
      }));
    } catch (error) {
      console.warn('Spaces table not available:', error.message);
    }

    // Format response
    const response = {
      totalVenues: parseInt(venueTotalsResult.rows[0].total_venues) || 0,
      totalSpaces: parseInt(venueTotalsResult.rows[0].total_spaces) || 0,
      venueMetrics: venueMetricsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        capacity: parseInt(row.capacity),
        totalBookings: parseInt(row.total_bookings),
        confirmedBookings: parseInt(row.confirmed_bookings),
        totalRevenue: parseFloat(row.total_revenue),
        averageRevenue: parseFloat(row.average_revenue),
        utilization: parseFloat(row.utilization),
        averageGuestCount: Math.round(parseFloat(row.average_guest_count))
      })),
      eventTypesByVenue: eventTypesByVenue,
      spaceMetrics: spaceMetrics
    };

    return res.json(response);

  } catch (error) {
    console.error('Venue analytics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch venue analytics',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}