const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../../db-config.js');

// Import with error handling
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (importError) {
  console.error('Nodemailer import error:', importError);
}

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
    // Check if nodemailer is available
    if (!nodemailer) {
      return res.status(500).json({
        success: false,
        message: 'Email service not available',
        error: 'Nodemailer module not loaded'
      });
    }

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

    // Get email configuration from database
    let emailConfig;
    try {
      const result = await pool.query(`
        SELECT setting_value
        FROM system_settings
        WHERE setting_key = 'email_config'
      `);

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Email configuration not found. Please configure email settings first.'
        });
      }

      emailConfig = JSON.parse(result.rows[0].setting_value);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Email configuration not found. Please configure email settings first.',
        error: err.message
      });
    }

    if (!emailConfig.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Email service is not enabled. Please enable it in settings.'
      });
    }

    // Get test email from request body or use the configured email
    const { testEmail } = req.body;
    const recipientEmail = testEmail || emailConfig.email;

    // Create transporter based on configuration
    let transporter;

    if (emailConfig.provider === 'gmail') {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailConfig.email,
          pass: emailConfig.password
        }
      });
    } else {
      return res.status(400).json({
        message: 'Unsupported email provider. Currently only Gmail is supported.'
      });
    }

    // Test email content
    const mailOptions = {
      from: `"VenuinePro System" <${emailConfig.email}>`,
      to: recipientEmail,
      subject: 'VenuinePro Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Email Configuration Test</h2>
          <p>This is a test email to verify that your VenuinePro email configuration is working correctly.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Configuration Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Provider:</strong> ${emailConfig.provider}</li>
              <li><strong>From Email:</strong> ${emailConfig.email}</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p>If you received this email, your email configuration is working properly and you can now:</p>
          <ul>
            <li>Send customer verification emails</li>
            <li>Send booking confirmation emails</li>
            <li>Send system notifications</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from VenuinePro Super Admin panel as a configuration test.
          </p>
        </div>
      `,
      text: `
VenuinePro Email Configuration Test

This is a test email to verify that your VenuinePro email configuration is working correctly.

Configuration Details:
- Provider: ${emailConfig.provider}
- From Email: ${emailConfig.email}
- Test Date: ${new Date().toLocaleString()}

If you received this email, your email configuration is working properly and you can now send customer verification emails, booking confirmations, and system notifications.

This email was sent from VenuinePro Super Admin panel as a configuration test.
      `
    };

    // Send test email
    const info = await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      details: {
        messageId: info.messageId,
        recipient: recipientEmail,
        provider: emailConfig.provider,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email test error:', error);

    // Provide specific error messages for common issues
    let errorMessage = 'Failed to send test email';

    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email and app password.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your internet connection.';
    } else if (error.message.includes('Invalid login')) {
      errorMessage = 'Invalid login credentials. Please verify your email and app password.';
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};