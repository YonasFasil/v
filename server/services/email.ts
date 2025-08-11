import nodemailer from "nodemailer";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (!this.transporter) {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials not configured. Email sending disabled.');
        return null;
      }

      console.log('Creating email transporter with user:', process.env.GMAIL_USER);
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }
    return this.transporter;
  }

  private static async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) {
      throw new Error('Email service not configured');
    }

    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
    const fromEmail = process.env.GMAIL_USER;

    console.log('Attempting to send email to:', to);
    console.log('Base URL:', baseUrl);
    
    try {
      await transporter.sendMail({
        from: `"VENUIN" <${fromEmail}>`,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html.replace(/{{baseUrl}}/g, baseUrl),
      });
      console.log('Email sent successfully to:', to);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  static async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
    
    const template: EmailTemplate = {
      subject: 'Verify Your VENUIN Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: 500; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">VENUIN</div>
            </div>
            
            <h2>Welcome to VENUIN${firstName ? `, ${firstName}` : ''}!</h2>
            
            <p>Thank you for signing up for VENUIN. To complete your account setup and start managing your venue, please verify your email address by clicking the button below:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
            
            <p>This verification link will expire in 24 hours for security reasons.</p>
            
            <p>If you didn't create a VENUIN account, you can safely ignore this email.</p>
            
            <div class="footer">
              <p>Best regards,<br>The VENUIN Team</p>
              <p><em>This is an automated email, please do not reply.</em></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to VENUIN${firstName ? `, ${firstName}` : ''}!

Thank you for signing up for VENUIN. To complete your account setup and start managing your venue, please verify your email address by visiting this link:

${verifyUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create a VENUIN account, you can safely ignore this email.

Best regards,
The VENUIN Team

This is an automated email, please do not reply.
      `.trim(),
    };

    await this.sendEmail(email, template);
  }

  static async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
    const resetUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const template: EmailTemplate = {
      subject: 'Reset Your VENUIN Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: 500; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .warning { background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">VENUIN</div>
            </div>
            
            <h2>Reset Your Password</h2>
            
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            
            <p>We received a request to reset your VENUIN account password. Click the button below to create a new password:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The VENUIN Team</p>
              <p><em>This is an automated email, please do not reply.</em></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your Password

Hello${firstName ? ` ${firstName}` : ''},

We received a request to reset your VENUIN account password. Visit this link to create a new password:

${resetUrl}

Security Notice: This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

Best regards,
The VENUIN Team

This is an automated email, please do not reply.
      `.trim(),
    };

    await this.sendEmail(email, template);
  }

  static async sendWelcomeEmail(email: string, firstName: string, tenantName: string, tenantSlug: string): Promise<void> {
    const loginUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/login`;
    const appUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/t/${tenantSlug}/app`;
    
    const template: EmailTemplate = {
      subject: 'Welcome to VENUIN - Your Account is Ready!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to VENUIN</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0066cc; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: 500; margin: 5px; }
            .button-secondary { background-color: #6b7280; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .success { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">VENUIN</div>
            </div>
            
            <div class="success">
              <h2 style="margin-top: 0;">🎉 Welcome to VENUIN, ${firstName}!</h2>
            </div>
            
            <p>Congratulations! Your VENUIN account for <strong>${tenantName}</strong> has been successfully created and your subscription is now active.</p>
            
            <p>You're now ready to streamline your venue management with powerful features including:</p>
            <ul>
              <li>📅 Smart booking management and calendar</li>
              <li>👥 Customer relationship management</li>
              <li>💰 Automated invoicing and payments</li>
              <li>📊 Real-time analytics and insights</li>
              <li>🤖 AI-powered automation tools</li>
            </ul>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}" class="button">Access Your Dashboard</a>
              <a href="${loginUrl}" class="button button-secondary">Login Page</a>
            </p>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Complete your venue setup in the onboarding flow</li>
              <li>Add your spaces and services</li>
              <li>Invite your team members</li>
              <li>Start taking bookings!</li>
            </ol>
            
            <p>Need help getting started? Our support team is here to help you make the most of VENUIN.</p>
            
            <div class="footer">
              <p>Best regards,<br>The VENUIN Team</p>
              <p><a href="mailto:support@venuin.com">support@venuin.com</a> • <a href="${process.env.PUBLIC_BASE_URL}/contact">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to VENUIN, ${firstName}!

Congratulations! Your VENUIN account for ${tenantName} has been successfully created and your subscription is now active.

You're now ready to streamline your venue management with powerful features including:
- Smart booking management and calendar
- Customer relationship management  
- Automated invoicing and payments
- Real-time analytics and insights
- AI-powered automation tools

Access your dashboard: ${appUrl}
Login page: ${loginUrl}

Next Steps:
1. Complete your venue setup in the onboarding flow
2. Add your spaces and services
3. Invite your team members
4. Start taking bookings!

Need help getting started? Our support team is here to help you make the most of VENUIN.

Best regards,
The VENUIN Team

support@venuin.com • ${process.env.PUBLIC_BASE_URL}/contact
      `.trim(),
    };

    await this.sendEmail(email, template);
  }
}