const jwt = require('jsonwebtoken');

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

    const { email, password, host, port } = req.body;

    if (!email || !password || !host || !port) {
      return res.status(400).json({
        success: false,
        message: 'Missing required IMAP configuration'
      });
    }

    // Test IMAP connection using node-imap
    try {
      const Imap = require('imap');

      const imapConfig = {
        user: email,
        password: password,
        host: host,
        port: port,
        tls: port === 993,
        secure: port === 993,
        tlsOptions: {
          rejectUnauthorized: false // For self-signed certificates
        }
      };

      const imap = new Imap(imapConfig);

      return new Promise((resolve) => {
        let connectionTimeout = setTimeout(() => {
          imap.destroy();
          resolve(res.json({
            success: false,
            message: 'Connection timeout - please check your IMAP settings'
          }));
        }, 10000); // 10 second timeout

        imap.once('ready', () => {
          clearTimeout(connectionTimeout);
          imap.end();
          resolve(res.json({
            success: true,
            message: 'IMAP connection successful',
            details: {
              host: host,
              port: port,
              email: email,
              secure: port === 993
            }
          }));
        });

        imap.once('error', (err) => {
          clearTimeout(connectionTimeout);
          console.error('IMAP connection error:', err);
          resolve(res.json({
            success: false,
            message: `IMAP connection failed: ${err.message}`,
            error: err.code || 'CONNECTION_ERROR'
          }));
        });

        imap.connect();
      });

    } catch (error) {
      console.error('IMAP test error:', error);
      return res.json({
        success: false,
        message: 'Failed to test IMAP connection',
        error: error.message
      });
    }

  } catch (error) {
    console.error('IMAP test handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}