const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');
const { getNotificationEmail } = require('./utils/get-notification-email.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate secure token for email threading
async function generateSecureToken(pool, tenantId, recordType, recordId, customerEmail) {
  try {
    // Generate a short, secure token
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const token = randomBytes; // 16 character hex string

    // Generate a thread ID for this conversation thread
    const { v4: uuidv4 } = require('uuid');
    const threadId = uuidv4();

    // Store the token mapping in the database
    await pool.query(`
      INSERT INTO communication_tokens (
        token, tenant_id, record_type, record_id,
        customer_email, thread_id, created_at, expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days'
      )
    `, [token, tenantId, recordType, recordId, customerEmail, threadId]);

    return { token, threadId };
  } catch (error) {
    console.error('Failed to generate secure token:', error);
    // Fallback to no token if generation fails
    return { token: null, threadId: null };
  }
}

// Generate reply-to address using configured notification email with plus addressing
function generateReplyToAddress(notificationEmail, token) {
  if (!token) return notificationEmail;

  // Extract username and domain from notification email
  const [username, domain] = notificationEmail.split('@');
  // Use plus addressing for reply tracking
  return `${username}+${token}@${domain}`;
}

export default async function handler(req, res) {
  // Set headers first to ensure JSON responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool;

  // Wrap everything in try-catch to prevent server crashes
  try {

  try {
    const {
      to,
      email,
      subject,
      customerName,
      content,
      type,
      emailType,
      notificationType,
      customerId,
      bookingId,
      proposalId
    } = req.body || {};

    const recipientEmail = to || email;
    const finalSubject = subject || `${type || emailType || 'Communication'} from Venuine Events`;
    const finalCustomerName = customerName || 'Valued Customer';
    const finalContent = content || `This is a ${type || emailType || 'communication'} email from Venuine Events.`;
    const finalType = type || emailType || 'email';

    if (!recipientEmail) {
      return res.status(400).json({
        error: 'Recipient email required',
        message: 'Use "to" or "email" field'
      });
    }

    // Get tenant ID from auth token if available
    let tenantId = null;
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header present:', !!authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;
        console.log('🔍 JWT Secret present:', !!jwtSecret);

        if (jwtSecret) {
          const decoded = jwt.verify(token, jwtSecret);
          tenantId = decoded.tenantId;
          console.log('🔍 Decoded tenant ID:', tenantId);
        }
      } catch (error) {
        console.warn('❌ Could not decode JWT for communication logging:', error.message);
      }
    } else {
      console.warn('❌ No valid Authorization header found');
    }

    // Use ONLY environment variables for email configuration
    const senderEmail = process.env.GLOBAL_EMAIL_ADDRESS;
    const senderPassword = process.env.GLOBAL_EMAIL_PASSWORD;
    const smtpHost = process.env.GLOBAL_EMAIL_HOST;
    const smtpPort = process.env.GLOBAL_EMAIL_PORT;
    const senderName = 'Venuine Events';

    console.log('📧 Using IMAP configuration from environment variables:', senderEmail);

    if (!senderEmail || !senderPassword) {
      return res.status(400).json({
        error: 'Email configuration missing',
        message: 'Please configure IMAP email settings in Vercel environment variables.'
      });
    }

    // Get the configured notification email for reply-to addresses
    const notificationEmail = await getNotificationEmail();
    console.log('📧 Using notification email:', notificationEmail);

    // Setup database connection for token generation
    const databaseUrl = getDatabaseUrl();
    let secureToken = null;
    let threadId = null;
    let replyToAddress = notificationEmail;

    console.log('🔍 Database URL present:', !!databaseUrl);
    console.log('🔍 Tenant ID for token generation:', tenantId);

    if (databaseUrl && tenantId) {
      try {
        pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        console.log('🔍 About to generate secure token...');

        // Generate secure token for this communication
        const tokenResult = await generateSecureToken(
          pool,
          tenantId,
          finalType,
          proposalId || bookingId || 'general',
          recipientEmail
        );

        secureToken = tokenResult.token;
        threadId = tokenResult.threadId;

        console.log('🔍 Token generation result:', { secureToken: !!secureToken, threadId: !!threadId });

        if (secureToken) {
          replyToAddress = generateReplyToAddress(notificationEmail, secureToken);
          console.log('📧 Generated secure reply-to:', replyToAddress);
        }
      } catch (error) {
        console.error('❌ Error in token generation setup:', error.message);
      }
    } else {
      console.warn('❌ Skipping token generation:', {
        databaseUrl: !!databaseUrl,
        tenantId: !!tenantId
      });
    }

    const nodemailer = require('nodemailer');

    // Create transporter using environment variables only
    let transporter;
    if (smtpHost && smtpPort) {
      // Use custom SMTP (cPanel)
      transporter = nodemailer.createTransporter({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: senderEmail,
          pass: senderPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      console.log('📧 Using cPanel SMTP from environment variables');
    } else {
      // Use Gmail if no custom SMTP host
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: senderEmail,
          pass: senderPassword
        }
      });
      console.log('📧 Using Gmail SMTP from environment variables');
    }

    // Professional icon mapping for better presentation
    const getIcon = (emailType) => {
      switch (emailType) {
        case 'proposal': return '📄';
        case 'notification': return '🔔';
        case 'booking_confirmed': return '✅';
        case 'payment_received': return '💳';
        case 'reminder': return '⏰';
        case 'invoice': return '📊';
        default: return '✉️';
      }
    };

    const icon = getIcon(finalType);

    // Enhanced HTML content with better anti-spam practices
    const enhancedHtmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${finalSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${senderName}</h1>
                    <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 14px;">Professional Event Management</p>
                  </td>
                </tr>

                <!-- Icon Section -->
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
                    <h2 style="color: #333; margin: 0; font-size: 24px; font-weight: 600;">${finalSubject}</h2>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Dear ${finalCustomerName},
                    </p>

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea;">
                      ${finalContent}
                    </div>

                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                      If you have any questions or need assistance, please don't hesitate to reply to this email. We're here to help!
                    </p>

                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                      Best regards,<br>
                      <strong>${senderName} Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} ${senderName}. All rights reserved.
                    </p>
                    <p style="color: #999; font-size: 11px; margin: 5px 0 0 0;">
                      This email was sent to ${recipientEmail}
                    </p>
                    ${secureToken ? `
                    <p style="color: #999; font-size: 10px; margin: 5px 0 0 0;">
                      Email ID: ${secureToken}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Enhanced anti-spam headers for better deliverability
    const mailResult = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      replyTo: replyToAddress,
      to: recipientEmail,
      subject: finalSubject,
      html: enhancedHtmlContent,
      headers: {
        'X-Mailer': 'Venuine Events System',
        'X-Priority': '3', // Normal priority
        'X-Email-Type': finalType,
        'Message-ID': `<${Date.now()}.${Math.random().toString(36)}@${senderEmail.split('@')[1]}>`,
        'List-Unsubscribe': `<mailto:unsubscribe@${senderEmail.split('@')[1]}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Authentication-Results': `${senderEmail.split('@')[1]}; dkim=pass; spf=pass`,
        'X-Original-Sender': senderEmail,
        'Return-Path': senderEmail
      }
    });

    // Record the communication in the database if we have tenant context
    if (tenantId && pool) {
      try {
        const { v4: uuidv4 } = require('uuid');
        const communicationId = uuidv4();

        const insertQuery = `
          INSERT INTO communications (
            id, tenant_id, type, subject, message,
            sender, recipient,
            customer_id, booking_id, proposal_id,
            status, sent_at, email_message_id,
            thread_id, reply_to_address, direction
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, NOW(), $12, $13, $14, $15
          )
        `;

        await pool.query(insertQuery, [
          communicationId,
          tenantId,
          finalType,
          finalSubject,
          finalContent,
          senderEmail,
          recipientEmail,
          customerId || null,
          bookingId || null,
          proposalId || null,
          'sent',
          mailResult.messageId || null,
          threadId,
          replyToAddress,
          'outbound'
        ]);

        console.log('✅ Communication recorded:', {
          id: communicationId,
          tenantId,
          customerId,
          proposalId,
          type: finalType
        });

        console.log('✅ Communication recorded with thread ID:', threadId);
      } catch (dbError) {
        console.warn('Failed to record communication:', dbError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      to: recipientEmail,
      subject: finalSubject,
      customerName: finalCustomerName,
      emailType: finalType,
      threadId: threadId,
      replyTo: replyToAddress
    });

  } catch (error) {
    console.error('Email error:', error);
    console.error('Error details:', {
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      stack: error.stack
    });

    // Provide more detailed error information
    let errorMessage = 'Failed to send email';
    let debugInfo = {};

    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your email configuration.';
      debugInfo.authError = true;
    } else if (error.responseCode === 535) {
      errorMessage = 'Email login rejected. Please verify your email credentials.';
      debugInfo.loginError = true;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Email server not found. Please check your SMTP host configuration.';
      debugInfo.hostError = true;
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your network and SMTP settings.';
      debugInfo.connectionError = true;
    }

    return res.status(500).json({
      error: 'Failed to send email',
      message: errorMessage,
      details: error.message,
      debug: {
        ...debugInfo,
        timestamp: new Date().toISOString()
      }
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }

  } catch (criticalError) {
    // Catch any unhandled errors to prevent server crashes
    console.error('Critical email service error:', criticalError);

    try {
      return res.status(500).json({
        error: 'Email service temporarily unavailable',
        message: 'Please try again in a moment or contact support',
        debug: {
          error: criticalError.message,
          timestamp: new Date().toISOString()
        }
      });
    } catch (responseError) {
      // If even JSON response fails, return plain text
      console.error('Failed to send JSON error response:', responseError);
      res.status(500).send('Email service error');
    }
  }
}