const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');
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
    const finalSubject = subject || `Test ${type || emailType || 'Communication'} Email`;
    const finalCustomerName = customerName || 'Test Customer';
    const finalContent = content || `This is a test ${type || emailType || 'communication'} email from Venue Project.`;

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

    if (!senderEmail || !senderPassword) {
      return res.status(400).json({
        error: 'Email configuration missing',
        message: 'Set GLOBAL_EMAIL_ADDRESS and GLOBAL_EMAIL_PASSWORD in Vercel'
      });
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword
      }
    });

    // Simple icon mapping
    const getIcon = (emailType) => {
      switch (emailType) {
        case 'proposal': return '📄';
        case 'notification': return '📢';
        case 'booking_confirmed': return '✅';
        case 'payment_received': return '💳';
        default: return '📧';
      }
    };

    const icon = getIcon(type || emailType || notificationType);

    const mailResult = await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject: finalSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Venue Project</h1>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 48px;">${icon}</span>
          </div>
          <h2 style="text-align: center;">${finalSubject}</h2>
          <p>Hi ${finalCustomerName},</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>${finalContent}</p>
          </div>
          <p>Thank you for choosing Venue Project.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Venue Project.
          </p>
        </div>
      `
    });

    // Record the communication in the database if we have tenant context
    if (tenantId) {
      try {
        const databaseUrl = getDatabaseUrl();
        if (databaseUrl) {
          pool = new Pool({
            connectionString: databaseUrl,
            ssl: { rejectUnauthorized: false }
          });

          const { v4: uuidv4 } = require('uuid');
          const communicationId = uuidv4();

          const insertQuery = `
            INSERT INTO communications (
              id, tenant_id, type, subject, content,
              sender_email, recipient_email, recipient_name,
              customer_id, booking_id, proposal_id,
              status, sent_at, created_at, message_id
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), $13
            )
          `;

          await pool.query(insertQuery, [
            communicationId,
            tenantId,
            type || emailType || 'email',
            finalSubject,
            finalContent,
            senderEmail,
            recipientEmail,
            finalCustomerName,
            customerId || null,
            bookingId || null,
            proposalId || null,
            'sent',
            mailResult.messageId || null
          ]);

          console.log('✅ Communication recorded in database:', communicationId);
        }
      } catch (dbError) {
        console.warn('Failed to record communication in database:', dbError.message);
        // Don't fail the whole request if database recording fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Communication email sent successfully',
      to: recipientEmail,
      subject: finalSubject,
      customerName: finalCustomerName,
      emailType: type || emailType || 'communication'
    });

  } catch (error) {
    console.error('Communication email error:', error);
    return res.status(500).json({
      error: 'Failed to send communication email',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}