const { getDatabaseUrl } = require('./db-config.js');
const { Pool } = require('pg');

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
      return res.status(500).json({ error: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Test the specific query that was failing
    const tenantId = 'e9339ad3-5752-4c2d-ae50-f2a1f84fd200';

    const result = await pool.query(`
      SELECT id, username, name, email, role, permissions,
             is_active, last_login_at as last_login, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);

    return res.json({
      success: true,
      message: 'Database connection and query working',
      userCount: result.rows.length,
      users: result.rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active
      }))
    });

  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      error: 'Database test failed',
      message: error.message,
      details: error.toString()
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};