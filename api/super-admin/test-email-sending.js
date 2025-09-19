const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');
const { getNotificationEmail } = require('../utils/get-notification-email.js');

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

    // Send test email directly (avoid internal HTTP requests on Vercel)
    const nodemailer = require('nodemailer');
    let pool;

    try {
      // Get email configuration (IMAP first, then Gmail fallback)
      const databaseUrl = getDatabaseUrl();
      let senderEmail = null;
      let senderPassword = null;
      let smtpHost = null;
      let smtpPort = null;
      let senderName = 'Venuine Events';

      // Try to get IMAP configuration from database first
      if (databaseUrl) {
        try {
          const configPool = new Pool({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
          });

          const imapConfig = await configPool.query(
            'SELECT email, password, host, port FROM imap_config WHERE enabled = true LIMIT 1'
          );

          if (imapConfig.rows.length > 0) {
            const config = imapConfig.rows[0];
            senderEmail = config.email;
            senderPassword = config.password;
            smtpHost = config.host;
            smtpPort = 465; // Use SSL port for SMTP
            console.log('📧 Using IMAP configuration from database:', senderEmail);
          }

          await configPool.end();
        } catch (error) {
          console.error('Failed to get IMAP config:', error.message);
        }
      }

      // Fallback to environment variables (Gmail) if no IMAP config
      if (!senderEmail || !senderPassword) {
        senderEmail = process.env.GLOBAL_EMAIL_ADDRESS;
        senderPassword = process.env.GLOBAL_EMAIL_PASSWORD;
        smtpHost = process.env.GLOBAL_EMAIL_HOST;
        smtpPort = process.env.GLOBAL_EMAIL_PORT;
        console.log('📧 Using Gmail fallback configuration');
      }

      if (!senderEmail || !senderPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email configuration missing. Please configure IMAP or Gmail settings.'
        });
      }

      // Create transporter
      let transporter;
      if (!smtpHost) {
        // Use Gmail SMTP
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: senderEmail,
            pass: senderPassword
          }
        });
        console.log('📧 Using Gmail SMTP for test');
      } else {
        // Use custom SMTP settings
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort) || 587,
          secure: parseInt(smtpPort) === 465,
          auth: {
            user: senderEmail,
            pass: senderPassword
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        console.log('📧 Using custom SMTP for test');
      }

      // Get notification email for reply-to
      const notificationEmail = await getNotificationEmail();

      // Send test email
      const mailResult = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: notificationEmail,
        to: testEmail,
        subject: 'Test Email from Venue Management System',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Email from Venue Management System</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${senderName}</h1>
                        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 14px;">Professional Event Management</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
                        <h2 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">Email System Test</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 30px 30px 30px;">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Dear Admin,
                        </p>
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea;">
                          <p>This is a test email to verify your email configuration is working correctly.</p>
                          <h3>Configuration Details:</h3>
                          <ul>
                            <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
                            <li><strong>Test Type:</strong> Email System Configuration Test</li>
                            <li><strong>Sending from:</strong> ${senderEmail}</li>
                            <li><strong>Reply-to:</strong> ${notificationEmail}</li>
                            <li><strong>SMTP Method:</strong> ${smtpHost ? 'Custom SMTP' : 'Gmail'}</li>
                          </ul>
                        </div>
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                          <strong>What to check:</strong>
                        </p>
                        <ol style="color: #333; font-size: 16px; line-height: 1.6;">
                          <li>This email should arrive in your inbox (not spam)</li>
                          <li>Check the "Reply-To" address matches your notification email</li>
                          <li>Try replying to test the monitoring system</li>
                        </ol>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                          If you received this email, your email configuration is working! 🎊
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} ${senderName}. All rights reserved.
                        </p>
                        <p style="color: #999; font-size: 11px; margin: 5px 0 0 0;">
                          This email was sent to ${testEmail}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      });

      return res.json({
        success: true,
        message: 'Test email sent successfully',
        details: {
          to: testEmail,
          from: senderEmail,
          replyTo: notificationEmail,
          method: smtpHost ? 'Custom SMTP' : 'Gmail',
          sentAt: new Date().toISOString(),
          messageId: mailResult.messageId
        }
      });

    } catch (error) {
      console.error('Test email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    } finally {
      if (pool) {
        await pool.end();
      }
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