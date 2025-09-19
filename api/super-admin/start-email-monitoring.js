const jwt = require('jsonwebtoken');
const GlobalEmailService = require('../../server/services/global-email-service.js');

let emailService = null;

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

    // Initialize and start email monitoring service
    if (emailService) {
      await emailService.close();
    }

    emailService = new GlobalEmailService();
    await emailService.init();

    console.log('✅ Email monitoring service started successfully');

    return res.json({
      success: true,
      message: 'Email monitoring service started successfully'
    });

  } catch (error) {
    console.error('❌ Failed to start email monitoring service:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start email monitoring service',
      error: error.message
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (emailService) {
    await emailService.close();
  }
});

process.on('SIGINT', async () => {
  if (emailService) {
    await emailService.close();
  }
});