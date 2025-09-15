const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let pool;

  try {
    console.log('Save test - Request body:', req.body);

    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'Database not configured'
      });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Test database connection
    await pool.query('SELECT NOW()');

    // Test creating system_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Test saving a simple config
    const testConfig = {
      provider: 'test',
      timestamp: new Date().toISOString(),
      data: req.body
    };

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, updated_at)
      VALUES ('test_config', $1, NOW())
      ON CONFLICT (setting_key)
      DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = EXCLUDED.updated_at
    `, [JSON.stringify(testConfig)]);

    // Verify it was saved
    const result = await pool.query(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'test_config'
    `);

    return res.json({
      success: true,
      message: 'Test save successful',
      saved: result.rows[0] ? JSON.parse(result.rows[0].setting_value) : null
    });

  } catch (error) {
    console.error('Save test error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};