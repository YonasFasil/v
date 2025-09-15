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

    const { action, venueId } = req.query;

    if (req.method === 'GET' && !action && !venueId) {
      // Get all public venues (for browsing without authentication)
      const { search, location, capacity, page = 1, limit = 12 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT
          v.id, v.name, v.description, v.amenities, v.image_url,
          t.name as tenant_name, t.slug as tenant_slug,
          COUNT(s.id) as space_count,
          COALESCE(vv.view_count, 0) as view_count
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        LEFT JOIN spaces s ON v.id = s.venue_id AND s.is_active = true
        LEFT JOIN (
          SELECT venue_id, COUNT(*) as view_count
          FROM venue_views
          WHERE viewed_at > NOW() - INTERVAL '30 days'
          GROUP BY venue_id
        ) vv ON v.id = vv.venue_id
        WHERE v.is_active = true AND t.status = 'active'
      `;

      const params = [];
      let paramCount = 0;

      // Add search filter
      if (search) {
        paramCount++;
        query += ` AND (v.name ILIKE $${paramCount} OR v.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      // Add capacity filter (check spaces)
      if (capacity) {
        paramCount++;
        query += ` AND EXISTS (
          SELECT 1 FROM spaces sp
          WHERE sp.venue_id = v.id AND sp.capacity >= $${paramCount}
        )`;
        params.push(parseInt(capacity));
      }

      query += `
        GROUP BY v.id, v.name, v.description, v.amenities, v.image_url,
                 t.name, t.slug, vv.view_count
        ORDER BY vv.view_count DESC, v.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      params.push(parseInt(limit), offset);

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT v.id) as total
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        WHERE v.is_active = true AND t.status = 'active'
      `;

      const countParams = [];
      let countParamCount = 0;

      if (search) {
        countParamCount++;
        countQuery += ` AND (v.name ILIKE $${countParamCount} OR v.description ILIKE $${countParamCount})`;
        countParams.push(`%${search}%`);
      }

      if (capacity) {
        countParamCount++;
        countQuery += ` AND EXISTS (
          SELECT 1 FROM spaces sp
          WHERE sp.venue_id = v.id AND sp.capacity >= $${countParamCount}
        )`;
        countParams.push(parseInt(capacity));
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return res.json({
        venues: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } else if (req.method === 'GET' && venueId) {
      // Get detailed venue information (for venue detail page)
      const result = await pool.query(`
        SELECT
          v.id, v.name, v.description, v.amenities, v.image_url, v.created_at,
          t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug,
          t.primary_color
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        WHERE v.id = $1 AND v.is_active = true AND t.status = 'active'
      `, [venueId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Venue not found' });
      }

      const venue = result.rows[0];

      // Get venue spaces
      const spacesResult = await pool.query(`
        SELECT id, name, description, capacity, amenities, image_url,
               base_price, hourly_rate, is_active
        FROM spaces
        WHERE venue_id = $1 AND is_active = true
        ORDER BY name
      `, [venueId]);

      // Get venue packages
      const packagesResult = await pool.query(`
        SELECT id, name, description, price, features, is_active
        FROM packages
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY price
      `, [venue.tenant_id]);

      // Get venue services
      const servicesResult = await pool.query(`
        SELECT id, name, description, price, category, is_active
        FROM services
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY category, name
      `, [venue.tenant_id]);

      // Track venue view (if customer is authenticated or by session)
      const customerId = req.headers['x-customer-id']; // From auth middleware
      const sessionId = req.headers['x-session-id'] || 'anonymous';
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await pool.query(`
        INSERT INTO venue_views (
          venue_id, public_customer_id, session_id, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5)
      `, [venueId, customerId || null, sessionId, ipAddress, userAgent]);

      return res.json({
        venue: {
          ...venue,
          spaces: spacesResult.rows,
          packages: packagesResult.rows,
          services: servicesResult.rows
        }
      });

    } else if (req.method === 'GET' && action === 'featured') {
      // Get featured venues (most viewed/popular)
      const result = await pool.query(`
        SELECT
          v.id, v.name, v.description, v.amenities, v.image_url,
          t.name as tenant_name, t.slug as tenant_slug,
          COUNT(s.id) as space_count,
          COALESCE(vv.view_count, 0) as view_count
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        LEFT JOIN spaces s ON v.id = s.venue_id AND s.is_active = true
        LEFT JOIN (
          SELECT venue_id, COUNT(*) as view_count
          FROM venue_views
          WHERE viewed_at > NOW() - INTERVAL '30 days'
          GROUP BY venue_id
        ) vv ON v.id = vv.venue_id
        WHERE v.is_active = true AND t.status = 'active'
        GROUP BY v.id, v.name, v.description, v.amenities, v.image_url,
                 t.name, t.slug, vv.view_count
        ORDER BY vv.view_count DESC, v.created_at DESC
        LIMIT 6
      `);

      return res.json(result.rows);

    } else if (req.method === 'GET' && action === 'search-suggestions') {
      // Get search suggestions based on venue names and amenities
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json([]);
      }

      const result = await pool.query(`
        SELECT DISTINCT name as suggestion, 'venue' as type
        FROM venues v
        JOIN tenants t ON v.tenant_id = t.id
        WHERE v.is_active = true AND t.status = 'active'
        AND v.name ILIKE $1
        LIMIT 5
      `, [`%${q}%`]);

      return res.json(result.rows);

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Public venues API error:', error);
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