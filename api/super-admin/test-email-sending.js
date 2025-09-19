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

    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    // Use the existing send-communication-email API to test
    const baseUrl = req.headers.host ?
      (req.headers.host.includes('localhost') ? `http://${req.headers.host}` : `https://${req.headers.host}`) :
      'http://localhost:3050';

    const sendResponse = await fetch(`${baseUrl}/api/send-communication-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: testEmail,
        subject: 'Test Email from Venue Management System',
        customerName: 'Admin',
        content: `
          <h2>🎉 Email System Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>

          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
              <li><strong>Test Type:</strong> Email System Configuration Test</li>
              <li><strong>Reply-to:</strong> This email will show your configured notification email</li>
            </ul>
          </div>

          <p><strong>What to check:</strong></p>
          <ol>
            <li>This email should arrive in your inbox (not spam)</li>
            <li>Check the "Reply-To" address - it should show your configured notification email with a token</li>
            <li>Try replying to this email to test the monitoring system</li>
          </ol>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you received this email, your email configuration is working! 🎊
          </p>
        `,
        type: 'test',
        proposalId: 'test-' + Date.now() // This will generate a secure token
      })
    });

    const result = await sendResponse.json();

    if (result.success) {
      return res.json({
        success: true,
        message: 'Test email sent successfully',
        details: {
          to: result.to,
          replyTo: result.replyTo,
          threadId: result.threadId,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      return res.json({
        success: false,
        message: 'Failed to send test email',
        error: result.message || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Email test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
}