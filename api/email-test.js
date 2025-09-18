// Vercel Serverless Function for Email Testing
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

  console.log('Email test endpoint hit:', req.method, req.url);

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowedMethods: ['POST']
    });
  }

  try {
    const { testEmail } = req.body || {};

    if (!testEmail) {
      return res.status(400).json({
        error: 'Test email address is required'
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

    // Test email content
    const mailOptions = {
      from: email,
      to: testEmail,
      subject: 'Venue Project - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Service Test</h2>
          <p>This is a test email from your Venue Project global email service.</p>
          <p><strong>Sent from:</strong> ${email}</p>
          <p><strong>Provider:</strong> ${provider}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, your global email service is working correctly!
          </p>
        </div>
      `
    };

    console.log('Sending test email to:', testEmail);
    const result = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        messageId: result.messageId,
        to: testEmail,
        from: email,
        provider: provider
      }
    });

  } catch (error) {
    console.error('Email test error:', error);
    return res.status(500).json({
      error: 'Failed to send test email',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}