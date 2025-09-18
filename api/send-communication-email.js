const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');
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

// Generate reply-to address using Gmail plus addressing
function generateReplyToAddress(baseEmail, token) {
  if (!token) return baseEmail;

  const [username, domain] = baseEmail.split('@');
  // Use Gmail plus addressing for secure reply tracking
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
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          const decoded = jwt.verify(token, jwtSecret);
          tenantId = decoded.tenantId;
        }
      } catch (error) {
        console.warn('Could not decode JWT for communication logging:', error.message);
      }
    }

    // Get environment variables
    const senderEmail = process.env.GLOBAL_EMAIL_ADDRESS;
    const senderPassword = process.env.GLOBAL_EMAIL_PASSWORD;
    const senderName = process.env.GLOBAL_EMAIL_NAME || 'Venuine Events';

    if (!senderEmail || !senderPassword) {
      return res.status(400).json({
        error: 'Email configuration missing',
        message: 'Set GLOBAL_EMAIL_ADDRESS and GLOBAL_EMAIL_PASSWORD in Vercel'
      });
    }

    // Setup database connection for token generation
    const databaseUrl = getDatabaseUrl();
    let secureToken = null;
    let threadId = null;
    let replyToAddress = senderEmail;

    if (databaseUrl && tenantId) {
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      });

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

      if (secureToken) {
        replyToAddress = generateReplyToAddress(senderEmail, secureToken);
        console.log('📧 Generated secure reply-to:', replyToAddress);
      }
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword
      }
    });

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

    // Send email with anti-spam headers and secure reply-to
    const mailResult = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`, // Named sender to avoid spam
      replyTo: replyToAddress, // Secure reply-to with token
      to: recipientEmail,
      subject: finalSubject,
      html: enhancedHtmlContent,
      headers: {
        'X-Mailer': 'Venuine Events System',
        'X-Priority': '3', // Normal priority
        'X-Email-Type': finalType,
        'List-Unsubscribe': `<mailto:unsubscribe@venuine-events.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
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