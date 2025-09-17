import nodemailer from 'nodemailer';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const EmailConfigSchema = z.object({
  provider: z.enum(['gmail', 'smtp']),
  email: z.string().email(),
  password: z.string().min(1),
  enabled: z.boolean().default(true),
  host: z.string().optional(),
  port: z.number().optional(),
  secure: z.boolean().optional()
});

type EmailConfig = z.infer<typeof EmailConfigSchema>;

class GlobalEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private configFilePath: string;

  constructor() {
    this.configFilePath = path.join(process.cwd(), '.email-config.json');
    this.loadConfiguration();
  }

  private loadConfiguration() {
    try {
      // First try to load from file
      if (fs.existsSync(this.configFilePath)) {
        const fileContent = fs.readFileSync(this.configFilePath, 'utf8');
        const savedConfig = JSON.parse(fileContent);
        this.config = EmailConfigSchema.parse(savedConfig);
        this.createTransporter();
        console.log('📧 Global email configuration loaded from file');
        return;
      }

      // Fall back to environment variables
      this.initializeFromEnv();
    } catch (error) {
      console.warn('Failed to load email configuration:', error);
      this.initializeFromEnv();
    }
  }

  private saveConfiguration() {
    try {
      if (this.config) {
        fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2));
        console.log('📧 Global email configuration saved to file');
      }
    } catch (error) {
      console.error('Failed to save email configuration:', error);
    }
  }

  private initializeFromEnv() {
    try {
      const emailProvider = process.env.GLOBAL_EMAIL_PROVIDER;
      const emailAddress = process.env.GLOBAL_EMAIL_ADDRESS;
      const emailPassword = process.env.GLOBAL_EMAIL_PASSWORD;
      const emailEnabled = process.env.GLOBAL_EMAIL_ENABLED !== 'false';

      if (emailProvider && emailAddress && emailPassword) {
        this.config = {
          provider: emailProvider as 'gmail' | 'smtp',
          email: emailAddress,
          password: emailPassword,
          enabled: emailEnabled,
          host: process.env.GLOBAL_EMAIL_HOST,
          port: process.env.GLOBAL_EMAIL_PORT ? parseInt(process.env.GLOBAL_EMAIL_PORT) : undefined,
          secure: process.env.GLOBAL_EMAIL_SECURE === 'true'
        };
        this.createTransporter();
      }
    } catch (error) {
      console.warn('Failed to initialize email from environment variables:', error);
    }
  }

  private createTransporter() {
    if (!this.config) return;

    try {
      let transportConfig: any;

      if (this.config.provider === 'gmail') {
        transportConfig = {
          service: 'gmail',
          auth: {
            user: this.config.email,
            pass: this.config.password
          }
        };
      } else {
        transportConfig = {
          host: this.config.host || 'smtp.gmail.com',
          port: this.config.port || 587,
          secure: this.config.secure || false,
          auth: {
            user: this.config.email,
            pass: this.config.password
          }
        };
      }

      this.transporter = nodemailer.createTransport(transportConfig);
    } catch (error) {
      console.error('Failed to create email transporter:', error);
      this.transporter = null;
    }
  }

  async getGlobalEmailStatus() {
    return {
      configured: !!this.config,
      enabled: this.config?.enabled || false,
      provider: this.config?.provider || null,
      email: this.config?.email || null
    };
  }

  async configureGlobalEmail(newConfig: EmailConfig) {
    try {
      const validatedConfig = EmailConfigSchema.parse(newConfig);
      this.config = validatedConfig;
      this.createTransporter();
      this.saveConfiguration(); // Persist the configuration

      return {
        success: true,
        message: 'Global email configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async testGlobalEmail(testEmail: string) {
    if (!this.transporter || !this.config?.enabled) {
      throw new Error('Email service not configured or disabled');
    }

    const mailOptions = {
      from: this.config.email,
      to: testEmail,
      subject: 'Venue Project - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Service Test</h2>
          <p>This is a test email from your Venue Project global email service.</p>
          <p><strong>Sent from:</strong> ${this.config.email}</p>
          <p><strong>Provider:</strong> ${this.config.provider}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, your global email service is working correctly!
          </p>
        </div>
      `
    };

    const result = await this.transporter.sendMail(mailOptions);
    return {
      messageId: result.messageId,
      success: true,
      message: 'Test email sent successfully'
    };
  }

  async sendVerificationEmail(options: {
    to: string;
    customerName: string;
    verificationToken: string;
    verificationUrl?: string;
  }) {
    if (!this.transporter || !this.config?.enabled) {
      throw new Error('Email service not configured or disabled');
    }

    const { to, customerName, verificationToken, verificationUrl } = options;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3050';
    const finalVerificationUrl = verificationUrl || `${baseUrl}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: this.config.email,
      to,
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

    const result = await this.transporter.sendMail(mailOptions);
    return {
      messageId: result.messageId,
      success: true,
      message: 'Verification email sent successfully'
    };
  }

  async sendProposalEmail(options: {
    to: string;
    subject: string;
    customerName: string;
    eventName: string;
    proposalViewUrl: string;
    tenantName?: string;
    eventDate?: string;
    venue?: string;
    customMessage?: string;
  }) {
    if (!this.transporter || !this.config?.enabled) {
      throw new Error('Email service not configured or disabled');
    }

    const {
      to,
      subject,
      customerName,
      eventName,
      proposalViewUrl,
      tenantName = 'Venue Project',
      eventDate,
      venue,
      customMessage
    } = options;

    const mailOptions = {
      from: this.config.email,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${tenantName}</h1>
          </div>

          <h2 style="color: #1f2937;">Event Proposal for ${eventName}</h2>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Dear ${customerName},
          </p>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            We're excited to present your customized proposal for <strong>${eventName}</strong>.
          </p>

          ${eventDate ? `<p style="color: #374151;"><strong>Event Date:</strong> ${eventDate}</p>` : ''}
          ${venue ? `<p style="color: #374151;"><strong>Venue:</strong> ${venue}</p>` : ''}

          ${customMessage ? `
            <div style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p style="margin: 0; color: #374151; font-style: italic;">${customMessage}</p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${proposalViewUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Full Proposal
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #2563eb; word-break: break-all; font-size: 14px;">
            ${proposalViewUrl}
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #374151; font-size: 16px;">
            We look forward to making your event unforgettable. Please don't hesitate to reach out if you have any questions.
          </p>

          <p style="color: #374151; font-size: 16px;">
            Best regards,<br>
            The ${tenantName} Team
          </p>
        </div>
      `
    };

    const result = await this.transporter.sendMail(mailOptions);
    return {
      messageId: result.messageId,
      success: true,
      message: 'Proposal email sent successfully'
    };
  }

  async sendNotificationEmail(options: {
    to: string;
    subject: string;
    customerName: string;
    notificationType: 'booking_confirmed' | 'payment_received' | 'event_reminder' | 'custom';
    tenantName?: string;
    content: string;
    actionUrl?: string;
    actionText?: string;
  }) {
    if (!this.transporter || !this.config?.enabled) {
      throw new Error('Email service not configured or disabled');
    }

    const {
      to,
      subject,
      customerName,
      notificationType,
      tenantName = 'Venue Project',
      content,
      actionUrl,
      actionText
    } = options;

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'booking_confirmed': return '✅';
        case 'payment_received': return '💳';
        case 'event_reminder': return '📅';
        default: return '📢';
      }
    };

    const mailOptions = {
      from: this.config.email,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">${tenantName}</h1>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">${getNotificationIcon(notificationType)}</span>
          </div>

          <h2 style="color: #1f2937; text-align: center;">${subject}</h2>

          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Hi ${customerName},
          </p>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #374151; line-height: 1.6;">${content}</p>
          </div>

          ${actionUrl && actionText ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${actionText}
              </a>
            </div>
          ` : ''}

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #374151; font-size: 16px;">
            Thank you for choosing ${tenantName}.
          </p>

          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification. If you have any questions, please contact our support team.
          </p>
        </div>
      `
    };

    const result = await this.transporter.sendMail(mailOptions);
    return {
      messageId: result.messageId,
      success: true,
      message: 'Notification email sent successfully'
    };
  }
}

// Export singleton instance
export const globalEmailService = new GlobalEmailService();

// Export individual functions for the API routes
export const getGlobalEmailStatus = () => globalEmailService.getGlobalEmailStatus();
export const configureGlobalEmail = (config: EmailConfig) => globalEmailService.configureGlobalEmail(config);
export const testGlobalEmail = (testEmail: string) => globalEmailService.testGlobalEmail(testEmail);
export const sendVerificationEmail = (options: Parameters<typeof globalEmailService.sendVerificationEmail>[0]) =>
  globalEmailService.sendVerificationEmail(options);
export const sendProposalEmail = (options: Parameters<typeof globalEmailService.sendProposalEmail>[0]) =>
  globalEmailService.sendProposalEmail(options);
export const sendNotificationEmail = (options: Parameters<typeof globalEmailService.sendNotificationEmail>[0]) =>
  globalEmailService.sendNotificationEmail(options);