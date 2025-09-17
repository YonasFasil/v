const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('../db-config.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    // Authenticate customer
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    let customerId;

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      customerId = decoded.customerId;
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (req.method === 'GET') {
      // Get customer dashboard data

      // Get customer basic info
      const customerResult = await pool.query(`
        SELECT id, email, first_name, last_name, phone, company_name,
               is_verified, created_at, last_login_at
        FROM public_customers
        WHERE id = $1
      `, [customerId]);

      if (customerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const customer = customerResult.rows[0];

      // Get inquiry statistics
      const inquiryStatsResult = await pool.query(`
        SELECT
          COUNT(*) as total_inquiries,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_inquiries,
          COUNT(*) FILTER (WHERE status = 'responded') as responded_inquiries,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_inquiries,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_inquiries
        FROM booking_inquiries
        WHERE public_customer_id = $1
      `, [customerId]);

      const inquiryStats = inquiryStatsResult.rows[0];

      // Get recent inquiries
      const recentInquiriesResult = await pool.query(`
        SELECT
          bi.id, bi.event_name, bi.event_type, bi.event_date,
          bi.guest_count, bi.status, bi.created_at,
          v.name as venue_name, v.image_url as venue_image,
          t.name as tenant_name
        FROM booking_inquiries bi
        JOIN venues v ON bi.venue_id = v.id
        JOIN tenants t ON bi.tenant_id = t.id
        WHERE bi.public_customer_id = $1
        ORDER BY bi.created_at DESC
        LIMIT 5
      `, [customerId]);

      // Get favorite venues
      const favoritesResult = await pool.query(`
        SELECT
          v.id, v.name, v.description, v.image_url,
          t.name as tenant_name, t.slug as tenant_slug,
          cvf.created_at as favorited_at
        FROM customer_venue_favorites cvf
        JOIN venues v ON cvf.venue_id = v.id
        JOIN tenants t ON v.tenant_id = t.id
        WHERE cvf.public_customer_id = $1
        AND v.is_active = true AND t.status = 'active'
        ORDER BY cvf.created_at DESC
        LIMIT 6
      `, [customerId]);

      // Get upcoming events (inquiries with future dates)
      const upcomingEventsResult = await pool.query(`
        SELECT
          bi.id, bi.event_name, bi.event_type, bi.event_date,
          bi.start_time, bi.end_time, bi.guest_count, bi.status,
          v.name as venue_name, v.image_url as venue_image,
          t.name as tenant_name
        FROM booking_inquiries bi
        JOIN venues v ON bi.venue_id = v.id
        JOIN tenants t ON bi.tenant_id = t.id
        WHERE bi.public_customer_id = $1
        AND bi.event_date >= CURRENT_DATE
        ORDER BY bi.event_date ASC
        LIMIT 5
      `, [customerId]);

      // Get activity feed (recent views, inquiries, favorites)
      const activityResult = await pool.query(`
        (
          SELECT
            'inquiry' as type,
            bi.id as item_id,
            'Submitted inquiry for ' || bi.event_name as description,
            v.name as venue_name,
            bi.created_at as activity_date
          FROM booking_inquiries bi
          JOIN venues v ON bi.venue_id = v.id
          WHERE bi.public_customer_id = $1
          ORDER BY bi.created_at DESC
          LIMIT 3
        )
        UNION ALL
        (
          SELECT
            'favorite' as type,
            cvf.venue_id as item_id,
            'Added ' || v.name || ' to favorites' as description,
            v.name as venue_name,
            cvf.created_at as activity_date
          FROM customer_venue_favorites cvf
          JOIN venues v ON cvf.venue_id = v.id
          WHERE cvf.public_customer_id = $1
          ORDER BY cvf.created_at DESC
          LIMIT 3
        )
        ORDER BY activity_date DESC
        LIMIT 10
      `, [customerId]);

      return res.json({
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          companyName: customer.company_name,
          isVerified: customer.is_verified,
          memberSince: customer.created_at,
          lastLogin: customer.last_login_at
        },
        stats: {
          totalInquiries: parseInt(inquiryStats.total_inquiries),
          pendingInquiries: parseInt(inquiryStats.pending_inquiries),
          respondedInquiries: parseInt(inquiryStats.responded_inquiries),
          convertedInquiries: parseInt(inquiryStats.converted_inquiries),
          recentInquiries: parseInt(inquiryStats.recent_inquiries)
        },
        recentInquiries: recentInquiriesResult.rows,
        favoriteVenues: favoritesResult.rows,
        upcomingEvents: upcomingEventsResult.rows,
        recentActivity: activityResult.rows
      });

    } else if (req.method === 'POST' && req.query.action === 'favorite') {
      // Add venue to favorites
      const { venueId } = req.body;

      if (!venueId) {
        return res.status(400).json({ message: 'Venue ID is required' });
      }

      // Check if venue exists and is active
      const venueResult = await pool.query(`
        SELECT v.id, v.name
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        WHERE v.id = $1 AND v.is_active = true AND t.status = 'active'
      `, [venueId]);

      if (venueResult.rows.length === 0) {
        return res.status(404).json({ message: 'Venue not found or inactive' });
      }

      // Add to favorites (ignore if already exists)
      await pool.query(`
        INSERT INTO customer_venue_favorites (public_customer_id, venue_id)
        VALUES ($1, $2)
        ON CONFLICT (public_customer_id, venue_id) DO NOTHING
      `, [customerId, venueId]);

      return res.json({
        message: 'Venue added to favorites',
        venue: venueResult.rows[0]
      });

    } else if (req.method === 'DELETE' && req.query.action === 'favorite') {
      // Remove venue from favorites
      const { venueId } = req.query;

      if (!venueId) {
        return res.status(400).json({ message: 'Venue ID is required' });
      }

      const result = await pool.query(`
        DELETE FROM customer_venue_favorites
        WHERE public_customer_id = $1 AND venue_id = $2
        RETURNING venue_id
      `, [customerId, venueId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Favorite not found' });
      }

      return res.json({
        message: 'Venue removed from favorites'
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Customer dashboard API error:', error);
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