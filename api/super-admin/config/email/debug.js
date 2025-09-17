const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let pool;

  try {
    const debug = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      availableModules: {}
    };

    // Check available modules
    try {
      require('nodemailer');
      debug.availableModules.nodemailer = 'available';
    } catch (err) {
      debug.availableModules.nodemailer = `error: ${err.message}`;
    }

    try {
      require('pg');
      debug.availableModules.pg = 'available';
    } catch (err) {
      debug.availableModules.pg = `error: ${err.message}`;
    }

    // Check database connection
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      debug.database = 'not configured';
    } else {
      try {
        pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        await pool.query('SELECT NOW()');
        debug.database = 'connected';

        // Check if system_settings table exists
        try {
          const result = await pool.query(`
            SELECT setting_value
            FROM system_settings
            WHERE setting_key = 'email_config'
          `);
          debug.emailConfig = result.rows.length > 0 ? 'found' : 'not found';
          if (result.rows.length > 0) {
            const config = JSON.parse(result.rows[0].setting_value);
            debug.emailConfigDetails = {
              provider: config.provider,
              hasEmail: !!config.email,
              hasPassword: !!config.password,
              enabled: config.enabled
            };
          }
        } catch (err) {
          debug.emailConfig = `table error: ${err.message}`;
        }

      } catch (err) {
        debug.database = `connection error: ${err.message}`;
      }
    }

    return res.json({
      success: true,
      debug
    });

  } catch (error) {
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