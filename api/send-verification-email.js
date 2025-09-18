export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, customerName, verificationToken } = req.body || {};

    if (!email || !customerName || !verificationToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'customerName', 'verificationToken'],
        received: { email: !!email, customerName: !!customerName, verificationToken: !!verificationToken }
      });
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

    const verificationUrl = `https://venuine-pro.vercel.app/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: senderEmail,
      to: email,
      subject: 'Verify Your Email - Venue Project',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Venue Project</h1>
          <h2>Welcome, ${customerName}!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy this link: ${verificationUrl}
          </p>
          <p style="color: #999; font-size: 12px;">
            This verification link will expire in 24 hours.
          </p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      to: email,
      customerName
    });

  } catch (error) {
    console.error('Verification email error:', error);
    return res.status(500).json({
      error: 'Failed to send verification email',
      message: error.message
    });
  }
}