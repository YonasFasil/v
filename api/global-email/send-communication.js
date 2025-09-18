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
    console.log('Communication email request:', req.body);

    const {
      to,
      email,
      subject,
      customerName,
      content,
      type,
      emailType,
      notificationType
    } = req.body;

    const recipientEmail = to || email;
    const finalSubject = subject || `Test ${type || emailType || 'Communication'} Email`;
    const finalCustomerName = customerName || 'Test Customer';
    const finalContent = content || `This is a test ${type || emailType || 'communication'} email.`;

    if (!recipientEmail) {
      return res.status(400).json({
        error: 'Recipient email is required (use "to" or "email" field)',
        received: { to: !!to, email: !!email }
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

    // Get icon based on type
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

    // Send communication email
    await transporter.sendMail({
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
        </div>
      `
    });

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
      message: error.message,
      code: error.code
    });
  }
}