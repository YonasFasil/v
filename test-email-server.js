const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

// Simple auth bypass for testing
const fakeAuth = (req, res, next) => {
  req.user = { id: 'test-user', tenantId: 'test-tenant' };
  next();
};

// GET email configuration
app.get("/api/super-admin/config/email", fakeAuth, async (req, res) => {
  try {
    console.log('📧 GET /api/super-admin/config/email called');

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
      console.log('✅ Email config found and returned');
      return res.json(safeConfig);
    } else {
      console.log('⚠️ No email config found, returning defaults');
      return res.json({
        provider: 'gmail',
        email: '',
        password: '',
        enabled: false
      });
    }
  } catch (error) {
    console.error("❌ Error getting email config:", error);
    res.status(500).json({ message: "Failed to get email configuration" });
  }
});

// POST email configuration
app.post("/api/super-admin/config/email", fakeAuth, async (req, res) => {
  try {
    console.log('📧 POST /api/super-admin/config/email called with:', req.body);

    const { provider, email, password, enabled } = req.body;

    // Validate required fields
    if (!provider || !email) {
      return res.status(400).json({ message: "Provider and email are required" });
    }

    if (provider === 'gmail' && !password) {
      return res.status(400).json({ message: "App password is required for Gmail" });
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

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, created_at, updated_at)
      VALUES ('email_config', $1, NOW(), NOW())
      ON CONFLICT (setting_key)
      DO UPDATE SET setting_value = $1, updated_at = NOW()
    `, [JSON.stringify(config)]);

    console.log('✅ Email config saved successfully');

    res.json({
      message: "Email configuration saved successfully",
      config: {
        ...config,
        password: '••••••••' // Don't return the actual password
      }
    });
  } catch (error) {
    console.error("❌ Error updating email config:", error);
    res.status(500).json({ message: "Failed to update email configuration" });
  }
});

// POST email test
app.post("/api/super-admin/config/email/test", fakeAuth, async (req, res) => {
  try {
    console.log('📧 POST /api/super-admin/config/email/test called with:', req.body);

    // Check if nodemailer is available
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (importError) {
      return res.status(500).json({
        success: false,
        message: 'Email service not available',
        error: 'Nodemailer module not loaded'
      });
    }

    // Get current email configuration
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

    const config = JSON.parse(result.rows[0].setting_value);

    if (!config.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Email service is not enabled. Please enable it in settings.'
      });
    }

    // Get test email from request body or use the configured email
    const { testEmail } = req.body || {};
    const recipientEmail = testEmail || config.email;

    console.log('📧 Sending test email to:', recipientEmail);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.email,
        pass: config.password
      }
    });

    // Test email content
    const mailOptions = {
      from: `"VenuinePro System" <${config.email}>`,
      to: recipientEmail,
      subject: 'VenuinePro Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">✅ Email Configuration Test Successful!</h2>
          <p>This test email confirms that your VenuinePro email configuration is working correctly.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Configuration Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Provider:</strong> ${config.provider}</li>
              <li><strong>From Email:</strong> ${config.email}</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p style="color: #059669; font-weight: bold;">Your email system is ready for:</p>
          <ul>
            <li>Customer verification emails</li>
            <li>Booking confirmation emails</li>
            <li>System notifications</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from VenuinePro Super Admin test endpoint.
          </p>
        </div>
      `
    };

    // Send test email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent successfully:', info.messageId);

    return res.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      details: {
        messageId: info.messageId,
        recipient: recipientEmail,
        provider: config.provider,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Email test error:', error);

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
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Email Test Server running on http://localhost:${PORT}`);
  console.log('📧 Test the endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/super-admin/config/email`);
  console.log(`   POST http://localhost:${PORT}/api/super-admin/config/email`);
  console.log(`   POST http://localhost:${PORT}/api/super-admin/config/email/test`);
});