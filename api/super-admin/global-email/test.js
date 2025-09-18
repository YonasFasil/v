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
    console.log('Email test request:', req.body);

    const { testEmail } = req.body;
    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    // Get config from environment
    const provider = process.env.GLOBAL_EMAIL_PROVIDER;
    const email = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;

    if (!provider || !email || !password) {
      return res.status(400).json({
        error: 'Email not configured. Set GLOBAL_EMAIL_PROVIDER, GLOBAL_EMAIL_ADDRESS, GLOBAL_EMAIL_PASSWORD in Vercel environment variables.',
        config: { provider: !!provider, email: !!email, password: !!password }
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: email, pass: password }
    });

    // Send test email
    await transporter.sendMail({
      from: email,
      to: testEmail,
      subject: 'Test Email - Venue Project',
      html: `
        <h2>Email Test Successful!</h2>
        <p>This test email was sent from your Venue Project email service.</p>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      to: testEmail,
      from: email
    });

  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message,
      code: error.code
    });
  }
}