const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

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

    const debug = {
      environment: {
        hasGmailEmail: !!process.env.GLOBAL_EMAIL_ADDRESS,
        hasGmailPassword: !!process.env.GLOBAL_EMAIL_PASSWORD,
        hasGmailHost: !!process.env.GLOBAL_EMAIL_HOST,
        hasGmailPort: !!process.env.GLOBAL_EMAIL_PORT,
        hasDatabaseUrl: !!getDatabaseUrl(),
        hasJwtSecret: !!process.env.JWT_SECRET
      },
      imap: {
        configured: false,
        error: null,
        config: null
      }
    };

    // Check IMAP configuration
    const databaseUrl = getDatabaseUrl();
    if (databaseUrl) {
      try {
        pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        const result = await pool.query(
          'SELECT email, host, port, enabled FROM imap_config WHERE enabled = true LIMIT 1'
        );

        if (result.rows.length > 0) {
          const config = result.rows[0];
          debug.imap.configured = true;
          debug.imap.config = {
            email: config.email,
            host: config.host,
            port: config.port,
            enabled: config.enabled,
            hasPassword: true // Don't expose actual password
          };
        }

      } catch (error) {
        debug.imap.error = error.message;
      }
    }

    return res.json({
      success: true,
      debug,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug email config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to debug email configuration',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}