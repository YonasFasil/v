// Vercel Serverless Function for Sending Communication Emails
const nodemailer = require('nodemailer');

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
      subject,
      customerName,
      content,
      emailType,
      actionUrl,
      actionText,
      tenantName
    } = req.body || {};

    if (!to || !subject || !customerName || !content) {
      return res.status(400).json({
        error: 'Required fields: to, subject, customerName, content'
      });
    }

    // Get email configuration from environment variables
    const provider = process.env.GLOBAL_EMAIL_PROVIDER;
    const email = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;
    const enabled = process.env.GLOBAL_EMAIL_ENABLED !== 'false';

    if (!provider || !email || !password) {
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
          user: email,
          pass: password
        }
      };
    } else {
      transportConfig = {
        host: process.env.GLOBAL_EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.GLOBAL_EMAIL_PORT) || 587,
        secure: process.env.GLOBAL_EMAIL_SECURE === 'true',
        auth: {
          user: email,
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
      from: email,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${finalTenantName}</h1>
          </div>

          ${emailType ? `
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 48px;">${getNotificationIcon(emailType)}</span>
            </div>
          ` : ''}

          <h2 style="color: #1f2937; text-align: center;">${subject}</h2>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Hi ${customerName},
          </p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="margin: 0; color: #374151; line-height: 1.6;">${content}</div>
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

    console.log('Sending communication email to:', to, 'Subject:', subject);
    const result = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Communication email sent successfully',
      data: {
        messageId: result.messageId,
        to: to,
        subject: subject,
        customerName: customerName,
        emailType: emailType || 'communication'
      }
    });

  } catch (error) {
    console.error('Communication email error:', error);
    return res.status(500).json({
      error: 'Failed to send communication email',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}