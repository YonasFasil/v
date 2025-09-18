// Vercel Serverless Function for Sending Verification Emails
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

  console.log('Email send verification endpoint hit:', req.method, req.url);

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
      customerName,
      verificationToken,
      verificationUrl
    } = req.body || {};

    // Support both 'to' and 'email' field names
    const recipientEmail = to || email;

    if (!recipientEmail || !customerName || !verificationToken) {
      return res.status(400).json({
        error: 'Required fields: to/email, customerName, verificationToken',
        received: { to, email, customerName, verificationToken }
      });
    }

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

    // Create verification URL
    const baseUrl = process.env.FRONTEND_URL || 'https://venuine-pro.vercel.app';
    const finalVerificationUrl = verificationUrl || `${baseUrl}/verify-email?token=${verificationToken}`;

    // Verification email content
    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: 'Verify Your Email - Venue Project',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Venue Project</h1>
          </div>

          <h2 style="color: #1f2937;">Welcome, ${customerName}!</h2>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Thank you for signing up with Venue Project. To complete your registration and start exploring our venue booking platform, please verify your email address.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${finalVerificationUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; word-break: break-all; font-size: 14px;">
            ${finalVerificationUrl}
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This verification link will expire in 24 hours. If you didn't create an account with Venue Project, please ignore this email.
          </p>
        </div>
      `
    };

    console.log('Sending verification email to:', recipientEmail);
    const result = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        messageId: result.messageId,
        to: recipientEmail,
        customerName: customerName
      }
    });

  } catch (error) {
    console.error('Verification email error:', error);
    return res.status(500).json({
      error: 'Failed to send verification email',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}