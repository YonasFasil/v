const nodemailer = require('nodemailer');

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
    console.log('Verification email request:', req.body);

    const { email: recipientEmail, customerName, verificationToken } = req.body;

    if (!recipientEmail || !customerName || !verificationToken) {
      return res.status(400).json({
        error: 'email, customerName, and verificationToken are required',
        received: { email: !!recipientEmail, customerName: !!customerName, verificationToken: !!verificationToken }
      });
    }

    // Get config from environment
    const provider = process.env.GLOBAL_EMAIL_PROVIDER;
    const senderEmail = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;

    if (!provider || !senderEmail || !password) {
      return res.status(400).json({
        error: 'Email not configured. Set GLOBAL_EMAIL_PROVIDER, GLOBAL_EMAIL_ADDRESS, GLOBAL_EMAIL_PASSWORD in Vercel environment variables.'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: senderEmail, pass: password }
    });

    const verificationUrl = `https://venuine-pro.vercel.app/verify-email?token=${verificationToken}`;

    // Send verification email
    await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject: 'Verify Your Email - Venue Project',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Venue Project</h1>
          <h2>Welcome, ${customerName}!</h2>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy this link: ${verificationUrl}
          </p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      to: recipientEmail,
      customerName
    });

  } catch (error) {
    console.error('Verification email error:', error);
    return res.status(500).json({
      error: 'Failed to send verification email',
      message: error.message,
      code: error.code
    });
  }
}