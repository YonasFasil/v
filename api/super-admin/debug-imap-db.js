const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
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

    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.json({
        success: false,
        message: 'Database URL not configured',
        debug: {
          databaseUrl: !!databaseUrl
        }
      });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'imap_config'
      );
    `);

    const debug = {
      databaseUrl: !!databaseUrl,
      tableExists: tableExists.rows[0].exists,
      records: [],
      error: null
    };

    if (tableExists.rows[0].exists) {
      // Get all records
      const allRecords = await pool.query('SELECT * FROM imap_config ORDER BY created_at DESC');
      debug.records = allRecords.rows.map(row => ({
        id: row.id,
        email: row.email,
        host: row.host,
        port: row.port,
        enabled: row.enabled,
        created_at: row.created_at,
        updated_at: row.updated_at,
        password_set: !!row.password
      }));
    } else {
      debug.error = 'imap_config table does not exist';
    }

    return res.json({
      success: true,
      debug
    });

  } catch (error) {
    console.error('Debug IMAP DB error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to debug IMAP database',
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}