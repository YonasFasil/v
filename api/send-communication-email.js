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
    const {
      to,
      email,
      subject,
      customerName,
      content,
      type,
      emailType,
      notificationType
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
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email from Venue Project.
          </p>
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
      message: error.message
    });
  }
}