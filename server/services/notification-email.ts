import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  organizationName: string;
  subdomain: string;
  trialDays: number;
  loginUrl: string;
  checkoutUrl?: string;
}

export interface EmailTemplateData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export class NotificationEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    // Only initialize if credentials are provided
    if (config.auth.user && config.auth.pass) {
      this.transporter = nodemailer.createTransporter(config);
    } else {
      console.warn('Email service not configured - SMTP credentials missing');
    }
  }

  // Allow dynamic configuration (used by super admin config)
  async configure(config: EmailConfig) {
    this.transporter = nodemailer.createTransporter(config);
  }

  async sendEmail(data: EmailTemplateData): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured - cannot send email');
      return false;
    }

    try {
      const mailOptions = {
        from: data.from || process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = this.generateWelcomeEmailHTML(data);
    const text = this.generateWelcomeEmailText(data);

    return this.sendEmail({
      to: data.email,
      subject: `Welcome to VenueFlow, ${data.name}! 🎉`,
      html,
      text,
    });
  }

  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to VenueFlow</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .highlight { background: #e0e7ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Welcome to VenueFlow!</h1>
        <p>Your venue management platform is ready</p>
    </div>
    
    <div class="content">
        <h2>Hi ${data.name},</h2>
        
        <p>Congratulations! Your VenueFlow account for <strong>${data.organizationName}</strong> has been successfully created.</p>
        
        <div class="highlight">
            <h3>🚀 Your Account Details:</h3>
            <ul>
                <li><strong>Organization:</strong> ${data.organizationName}</li>
                <li><strong>Subdomain:</strong> ${data.subdomain}.yourdomain.com</li>
                <li><strong>Email:</strong> ${data.email}</li>
                <li><strong>Trial Period:</strong> ${data.trialDays} days</li>
            </ul>
        </div>
        
        <h3>🎯 What's Next?</h3>
        <ol>
            <li><strong>Access Your Dashboard:</strong> Log in to start managing your venues</li>
            <li><strong>Set Up Your Venues:</strong> Add your first venue and spaces</li>
            <li><strong>Configure Services:</strong> Set up your service offerings</li>
            <li><strong>Start Taking Bookings:</strong> Begin accepting venue reservations</li>
        </ol>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" class="button">Access Dashboard</a>
            ${data.checkoutUrl ? `<a href="${data.checkoutUrl}" class="button" style="background: #059669;">Set Up Billing</a>` : ''}
        </div>
        
        <h3>📖 Getting Started Resources:</h3>
        <ul>
            <li>📚 <a href="#">User Guide</a> - Learn the basics</li>
            <li>🎥 <a href="#">Video Tutorials</a> - Watch how-to videos</li>
            <li>💬 <a href="#">Help Center</a> - Get support when you need it</li>
            <li>📞 <a href="mailto:support@venueflow.com">Contact Support</a> - We're here to help!</li>
        </ul>
        
        <p>We're excited to help you streamline your venue management and grow your business!</p>
        
        <p>Best regards,<br>
        The VenueFlow Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VenueFlow. All rights reserved.</p>
        <p>You received this email because you signed up for a VenueFlow account.</p>
    </div>
</body>
</html>
    `;
  }

  private generateWelcomeEmailText(data: WelcomeEmailData): string {
    return `
Welcome to VenueFlow, ${data.name}!

Congratulations! Your VenueFlow account for ${data.organizationName} has been successfully created.

Your Account Details:
- Organization: ${data.organizationName}
- Subdomain: ${data.subdomain}.yourdomain.com
- Email: ${data.email}
- Trial Period: ${data.trialDays} days

What's Next?
1. Access Your Dashboard: ${data.loginUrl}
2. Set Up Your Venues: Add your first venue and spaces
3. Configure Services: Set up your service offerings
4. Start Taking Bookings: Begin accepting venue reservations

${data.checkoutUrl ? `Set Up Billing: ${data.checkoutUrl}` : ''}

Getting Started Resources:
- User Guide: Learn the basics
- Video Tutorials: Watch how-to videos
- Help Center: Get support when you need it
- Contact Support: support@venueflow.com

We're excited to help you streamline your venue management and grow your business!

Best regards,
The VenueFlow Team

© 2024 VenueFlow. All rights reserved.
You received this email because you signed up for a VenueFlow account.
    `;
  }

  async sendPasswordResetEmail(email: string, resetLink: string, name: string): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <h2>Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>You requested to reset your password for your VenueFlow account.</p>
    <p>Click the button below to reset your password:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>The VenueFlow Team</p>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your VenueFlow Password',
      html,
      text: `Hi ${name}, Click this link to reset your password: ${resetLink}`,
    });
  }
}

export const notificationEmailService = new NotificationEmailService();