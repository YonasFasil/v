const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../db-config.js');

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

    if (req.method === 'GET') {
      // Get current email configuration
      try {
        const result = await pool.query(`
          SELECT setting_value
          FROM system_settings
          WHERE setting_key = 'email_config'
        `);

        if (result.rows.length > 0) {
          const config = JSON.parse(result.rows[0].setting_value);
          // Don't return the password for security
          const safeConfig = {
            ...config,
            password: config.password ? '••••••••' : ''
          };
          return res.json(safeConfig);
        } else {
          return res.json({
            provider: 'gmail',
            email: '',
            password: '',
            enabled: false
          });
        }
      } catch (err) {
        // If system_settings table doesn't exist, return default
        return res.json({
          provider: 'gmail',
          email: '',
          password: '',
          enabled: false
        });
      }

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save email configuration
      const { provider, email, password, enabled } = req.body;

      // Validate required fields
      if (!provider || !email) {
        return res.status(400).json({
          message: 'Provider and email are required'
        });
      }

      if (provider === 'gmail' && !password) {
        return res.status(400).json({
          message: 'App password is required for Gmail'
        });
      }

      // Create configuration object
      const config = {
        provider,
        email,
        password,
        enabled: enabled || false,
        smtp: provider === 'gmail' ? {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: email,
            pass: password
          }
        } : null,
        updatedAt: new Date().toISOString()
      };

      // Ensure system_settings table exists
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS system_settings (
            id SERIAL PRIMARY KEY,
            setting_key VARCHAR(255) UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
      } catch (createError) {
        console.log('Table might already exist:', createError.message);
      }

      // Save to database using UPSERT
      await pool.query(`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES ('email_config', $1, NOW())
        ON CONFLICT (setting_key)
        DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_at = EXCLUDED.updated_at
      `, [JSON.stringify(config)]);

      return res.json({
        message: 'Email configuration saved successfully',
        config: {
          ...config,
          password: '••••••••' // Don't return the actual password
        }
      });

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Email config API error:', error);
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