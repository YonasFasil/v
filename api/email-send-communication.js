// Vercel Serverless Function for Sending Communication Emails
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('Email send communication endpoint hit:', req.method, req.url);

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowedMethods: ['POST']
    });
  }

  try {
    const {
      to,
      email,
      subject,
      customerName,
      content,
      emailType,
      type,
      notificationType,
      actionUrl,
      actionText,
      tenantName,
      eventName,
      proposalViewUrl,
      eventDate,
      venue,
      customMessage
    } = req.body || {};

    // Support both 'to' and 'email' field names
    const recipientEmail = to || email;

    // Handle different email types from frontend
    const finalEmailType = emailType || type;
    const finalContent = content || customMessage || `Test ${finalEmailType || 'communication'} email content`;
    const finalSubject = subject || `Test ${finalEmailType || 'Communication'} Email`;
    const finalCustomerName = customerName || 'Test Customer';

    if (!recipientEmail) {
      return res.status(400).json({
        error: 'Required field: to or email',
        received: { to, email, subject, customerName, content, type, emailType }
      });
    }

    console.log('Communication email request:', {
      recipientEmail,
      subject: finalSubject,
      customerName: finalCustomerName,
      type: finalEmailType,
      notificationType
    });

    // Get email configuration from environment variables
    const provider = process.env.GLOBAL_EMAIL_PROVIDER;
    const senderEmail = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;
    const enabled = process.env.GLOBAL_EMAIL_ENABLED !== 'false';

    if (!provider || !senderEmail || !password) {
      return res.status(400).json({
        error: 'Email service not configured. Please set GLOBAL_EMAIL_PROVIDER, GLOBAL_EMAIL_ADDRESS, and GLOBAL_EMAIL_PASSWORD environment variables.'
      });
    }

    if (!enabled) {
      return res.status(400).json({
        error: 'Email service is disabled'
      });
    }

    // Create transporter
    let transportConfig;
    if (provider === 'gmail') {
      transportConfig = {
        service: 'gmail',
        auth: {
          user: senderEmail,
          pass: password
        }
      };
    } else {
      transportConfig = {
        host: process.env.GLOBAL_EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.GLOBAL_EMAIL_PORT) || 587,
        secure: process.env.GLOBAL_EMAIL_SECURE === 'true',
        auth: {
          user: senderEmail,
          pass: password
        }
      };
    }

    const transporter = nodemailer.createTransporter(transportConfig);

    // Get notification icon based on email type
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'booking_confirmed': return '✅';
        case 'payment_received': return '💳';
        case 'event_reminder': return '📅';
        case 'proposal': return '📄';
        default: return '📢';
      }
    };

    const finalTenantName = tenantName || 'Venue Project';

    // Communication email content
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: finalSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${finalTenantName}</h1>
          </div>

          ${finalEmailType ? `
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 48px;">${getNotificationIcon(finalEmailType)}</span>
            </div>
          ` : ''}

          <h2 style="color: #1f2937; text-align: center;">${finalSubject}</h2>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Hi ${finalCustomerName},
          </p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="margin: 0; color: #374151; line-height: 1.6;">${finalContent}</div>
          </div>

          ${actionUrl && actionText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${actionText}
              </a>
            </div>
          ` : ''}

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #374151; font-size: 16px;">
            Thank you for choosing ${finalTenantName}.
          </p>

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification. If you have any questions, please contact our support team.
          </p>
        </div>
      `
    };

    console.log('Sending communication email to:', recipientEmail, 'Subject:', finalSubject);
    const result = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Communication email sent successfully',
      data: {
        messageId: result.messageId,
        to: recipientEmail,
        subject: finalSubject,
        customerName: finalCustomerName,
        emailType: finalEmailType || 'communication'
      }
    });

  } catch (error) {
    console.error('Communication email error:', error);

    // Enhanced error handling for debugging
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your email credentials.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your email server settings.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Socket error. Please try again.';
    }

    return res.status(500).json({
      error: 'Failed to send communication email',
      message: errorMessage,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      config: {
        hasProvider: !!process.env.GLOBAL_EMAIL_PROVIDER,
        hasEmail: !!process.env.GLOBAL_EMAIL_ADDRESS,
        hasPassword: !!process.env.GLOBAL_EMAIL_PASSWORD,
        enabled: process.env.GLOBAL_EMAIL_ENABLED !== 'false'
      }
    });
  }
}