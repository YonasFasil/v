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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let pool;

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

    // Get database URL to fetch IMAP configuration
    const databaseUrl = getDatabaseUrl();
    let senderEmail = null;
    let senderPassword = null;
    let smtpHost = null;
    let smtpPort = null;
    let senderName = 'Venuine Events';

    // Try to get IMAP configuration from database first
    if (databaseUrl) {
      try {
        const { Pool } = require('pg');
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
        error: 'Email configuration missing',
        message: 'Please configure IMAP email settings in Super Admin panel or check Gmail environment variables.'
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

    // Use the configured notification email for sending if available
    // This ensures sender and reply-to domains match for better deliverability
    const shouldUseConfiguredSMTP = notificationEmail !== 'notification@venuine.com' &&
                                   notificationEmail !== senderEmail;

    let transporter;
    let actualSenderEmail = senderEmail;
    let actualSenderName = senderName;

    if (shouldUseConfiguredSMTP && databaseUrl) {
      // Try to get SMTP settings for the configured email
      try {
        const { Pool } = require('pg');
        const smtpPool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false }
        });

        const smtpConfig = await smtpPool.query(
          'SELECT email, password, host, port FROM imap_config WHERE enabled = true LIMIT 1'
        );

        if (smtpConfig.rows.length > 0) {
          const config = smtpConfig.rows[0];

          // Use SMTP with the same domain as notification email for better deliverability
          transporter = nodemailer.createTransport({
            host: config.host,
            port: 587, // Use submission port for SMTP
            secure: false,
            auth: {
              user: config.email,
              pass: config.password
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          actualSenderEmail = config.email;
          actualSenderName = senderName + ' (via ' + config.email.split('@')[1] + ')';
          console.log('📧 Using configured SMTP for better deliverability');
        }

        await smtpPool.end();
      } catch (error) {
        console.warn('Failed to use configured SMTP, falling back to Gmail:', error.message);
      }
    }

    // Fallback to environment SMTP or Gmail
    if (!transporter) {
      // Check if cPanel SMTP is configured in environment
      if (smtpHost && smtpPort) {
        transporter = nodemailer.createTransport({
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
        console.log('📧 Using cPanel SMTP from environment');
      } else {
        // Check if this is Gmail (no custom SMTP host configured)
        if (!smtpHost) {
          // Use Gmail SMTP
          transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: senderEmail,
              pass: senderPassword
            }
          });
          console.log('📧 Using Gmail SMTP fallback');
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
          console.log('📧 Using custom SMTP configuration');
        }
      }
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
    let mailResult;
    try {
      mailResult = await transporter.sendMail({
        from: `"${actualSenderName}" <${actualSenderEmail}>`, // Use actual sender for domain alignment
        replyTo: replyToAddress, // Secure reply-to with token
        to: recipientEmail,
        subject: finalSubject,
        html: enhancedHtmlContent,
        headers: {
          'X-Mailer': 'Venuine Events System',
          'X-Priority': '3', // Normal priority
          'X-Email-Type': finalType,
          'Message-ID': `<${Date.now()}.${Math.random().toString(36)}@${actualSenderEmail.split('@')[1]}>`,
          'List-Unsubscribe': `<mailto:unsubscribe@${actualSenderEmail.split('@')[1]}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Authentication-Results': `${actualSenderEmail.split('@')[1]}; dkim=pass; spf=pass`,
          'X-Original-Sender': actualSenderEmail,
          'Return-Path': actualSenderEmail
        }
      });
    } catch (smtpError) {
      console.error('📧 SMTP Error:', smtpError.message);

      // If IMAP/custom SMTP fails, fall back to Gmail
      if (smtpError.code === 'EAUTH' || smtpError.responseCode === 535) {
        console.log('📧 IMAP authentication failed, falling back to Gmail...');

        // Use Gmail as fallback
        const fallbackEmail = process.env.GLOBAL_EMAIL_ADDRESS;
        const fallbackPassword = process.env.GLOBAL_EMAIL_PASSWORD;

        if (fallbackEmail && fallbackPassword) {
          console.log('📧 Using Gmail fallback for failed IMAP');

          const fallbackTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: fallbackEmail,
              pass: fallbackPassword
            }
          });

          mailResult = await fallbackTransporter.sendMail({
            from: `"${senderName}" <${fallbackEmail}>`,
            replyTo: replyToAddress,
            to: recipientEmail,
            subject: finalSubject,
            html: enhancedHtmlContent,
            headers: {
              'X-Mailer': 'Venuine Events System (Gmail Fallback)',
              'X-Priority': '3',
              'X-Email-Type': finalType
            }
          });

          // Update sender info for logging
          actualSenderEmail = fallbackEmail;
          actualSenderName = senderName + ' (Gmail Fallback)';
        } else {
          throw new Error('IMAP authentication failed and no Gmail fallback configured');
        }
      } else {
        throw smtpError; // Re-throw if not an auth error
      }
    }

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
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}