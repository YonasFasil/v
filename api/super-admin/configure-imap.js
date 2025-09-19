const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool;

  try {
    // Verify super admin token
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

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const { email, password, host, port, enabled = true } = req.body;

    if (!email || !password || !host || !port) {
      return res.status(400).json({
        success: false,
        message: 'Missing required IMAP configuration'
      });
    }

    // Setup database connection
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Create imap_config table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imap_config (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        host VARCHAR(255) NOT NULL,
        port INTEGER NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Check if configuration already exists
    const existingConfig = await pool.query('SELECT id FROM imap_config LIMIT 1');

    let query, values;
    if (existingConfig.rows.length > 0) {
      // Update existing configuration
      query = `
        UPDATE imap_config
        SET email = $1, password = $2, host = $3, port = $4, enabled = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      values = [email, password, host, port, enabled, existingConfig.rows[0].id];
    } else {
      // Insert new configuration
      query = `
        INSERT INTO imap_config (email, password, host, port, enabled)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      values = [email, password, host, port, enabled];
    }

    const result = await pool.query(query, values);

    console.log('✅ IMAP configuration saved:', {
      email,
      host,
      port,
      enabled
    });

    return res.json({
      success: true,
      message: 'IMAP configuration saved successfully',
      config: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        host: result.rows[0].host,
        port: result.rows[0].port,
        enabled: result.rows[0].enabled,
        updated_at: result.rows[0].updated_at
      }
    });

  } catch (error) {
    console.error('IMAP configuration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Database URL present:', !!getDatabaseUrl());

    return res.status(500).json({
      success: false,
      message: 'Failed to save IMAP configuration',
      error: error.message,
      details: error.stack
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}