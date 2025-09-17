const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('../../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let pool;

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

    // Verify JWT token
    let customerId;
    try {
      const decoded = jwt.verify(token, jwtSecret);
      if (decoded.type !== 'public_customer') {
        throw new Error('Invalid token type');
      }
      customerId = decoded.customerId;
    } catch (jwtError) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Fetch customer's booking inquiries
    const result = await pool.query(`
      SELECT
        bi.id,
        bi.venue_id,
        bi.event_type,
        bi.event_date,
        bi.guest_count,
        bi.budget_range,
        bi.message,
        bi.contact_preferences,
        bi.status,
        bi.created_at,
        bi.response_message,
        bi.venue_response_at,
        v.name as venue_name,
        t.name as tenant_name
      FROM booking_inquiries bi
      JOIN venues v ON bi.venue_id = v.id
      JOIN tenants t ON v.tenant_id = t.id
      WHERE bi.public_customer_id = $1
      ORDER BY bi.created_at DESC
    `, [customerId]);

    return res.json(result.rows);

  } catch (error) {
    console.error('Customer inquiries API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};