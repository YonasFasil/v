export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Send test email endpoint called');
    const { testEmail } = req.body || {};

    if (!testEmail) {
      return res.status(400).json({ error: 'testEmail is required' });
    }

    // Get environment variables
    const senderEmail = process.env.GLOBAL_EMAIL_ADDRESS;
    const senderPassword = process.env.GLOBAL_EMAIL_PASSWORD;

    if (!senderEmail || !senderPassword) {
      return res.status(400).json({
        error: 'Email configuration missing',
        message: 'Please set GLOBAL_EMAIL_ADDRESS and GLOBAL_EMAIL_PASSWORD environment variables in Vercel dashboard',
        hasEmail: !!senderEmail,
        hasPassword: !!senderPassword
      });
    }

    // Use Gmail's SMTP via a simple approach
    const nodemailer = require('nodemailer');

    // Create transporter with the simplest possible configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: senderPassword
      }
    });

    console.log('Attempting to send email...');

    // Send email
    const info = await transporter.sendMail({
      from: senderEmail,
      to: testEmail,
      subject: 'Test Email from Venue Project',
      html: `
        <h2>✅ Email Test Successful!</h2>
        <p>This test email was sent successfully from your Venue Project application.</p>
        <p><strong>Sent to:</strong> ${testEmail}</p>
        <p><strong>Sent from:</strong> ${senderEmail}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p style="color: #666;">If you received this email, your email configuration is working correctly!</p>
      `
    });

    console.log('Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      data: {
        messageId: info.messageId,
        to: testEmail,
        from: senderEmail,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email sending error:', error);

    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your Gmail app password.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    return res.status(500).json({
      error: 'Failed to send email',
      message: errorMessage,
      code: error.code,
      details: error.stack
    });
  }
}