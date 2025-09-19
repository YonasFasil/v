const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');
const { getNotificationEmail } = require('../utils/get-notification-email.js');

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

    // Get current email configuration status
    const status = {
      gmail: {
        configured: false,
        email: null,
        status: 'disabled_by_admin'
      },
      imap: {
        configured: false,
        email: null,
        host: null,
        port: null,
        enabled: false,
        status: 'not_configured'
      },
      current_notification_email: 'notification@venuine.com',
      active_system: 'imap', // IMAP is now the primary system
      system_message: 'Gmail configuration has been disabled. IMAP is the primary email system.'
    };

    // Gmail is no longer checked or supported

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
          status.imap.configured = true;
          status.imap.email = config.email;
          status.imap.host = config.host;
          status.imap.port = config.port;
          status.imap.enabled = config.enabled;
          status.imap.status = 'configured';
        }

        await pool.end();
      } catch (error) {
        console.error('Failed to check IMAP config:', error);
        status.imap.status = 'error';
      }
    }

    // Get current notification email
    try {
      status.current_notification_email = await getNotificationEmail();
    } catch (error) {
      console.warn('Failed to get notification email:', error);
    }

    // Determine active system - IMAP only
    if (status.imap.configured && status.imap.enabled) {
      status.active_system = 'imap';
      status.system_message = `IMAP email system active: ${status.imap.email}`;
    } else {
      status.active_system = 'not_configured';
      status.system_message = 'No email system configured. Please configure IMAP email settings.';
    }

    return res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Email status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check email status',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}