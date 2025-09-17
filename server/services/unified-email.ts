import nodemailer from 'nodemailer';
import { storage } from '../storage';

export interface EmailConfig {
  provider: string;
  email: string;
  password: string;
  enabled: boolean;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  organizationName: string;
  loginUrl: string;
  packageName?: string;
}

export interface VerificationEmailData {
  name: string;
  email: string;
  verificationUrl: string;
  organizationName?: string;
}

export interface ProposalEmailData {
  to: string;
  subject: string;
  htmlContent: string;
  proposalViewLink: string;
  customerName?: string;
  eventName?: string;
}

export interface EmailTemplateData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export class UnifiedEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private currentConfig: EmailConfig | null = null;

  constructor() {
    // Initialize async - will load config from database
  }

  /**
   * Load email configuration from super admin settings
   */
  private async loadEmailConfig(): Promise<EmailConfig | null> {
    try {
      const emailSetting = await storage.getSetting('email_config');

      if (!emailSetting?.value) {
        console.warn('[EMAIL] No super admin email configuration found');
        return null;
      }

      const config = emailSetting.value as EmailConfig;

      if (!config.enabled) {
        console.warn('[EMAIL] Email service is disabled in super admin settings');
        return null;
      }

      if (!config.email || !config.password) {
        console.warn('[EMAIL] Incomplete email configuration - missing email or password');
        return null;
      }

      return config;
    } catch (error) {
      console.error('[EMAIL] Error loading email configuration:', error);
      return null;
    }
  }

  /**
   * Initialize or refresh the email transporter with latest config
   */
  private async initializeTransporter(): Promise<boolean> {
    try {
      const config = await this.loadEmailConfig();

      if (!config) {
        this.transporter = null;
        this.currentConfig = null;
        return false;
      }

      // Create transporter based on provider
      if (config.provider === 'gmail') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: config.email,
            pass: config.password,
          },
        });
      } else {
        throw new Error(`Unsupported email provider: ${config.provider}`);
      }

      // Verify the transporter
      await this.transporter.verify();

      this.currentConfig = config;
      console.log(`[EMAIL] Successfully initialized ${config.provider} transporter for ${config.email}`);
      return true;

    } catch (error) {
      console.error('[EMAIL] Failed to initialize email transporter:', error);
      this.transporter = null;
      this.currentConfig = null;
      return false;
    }
  }

  /**
   * Ensure transporter is ready, reinitialize if needed
   */
  private async ensureTransporter(): Promise<boolean> {
    if (!this.transporter || !this.currentConfig) {
      return await this.initializeTransporter();
    }

    // Optionally refresh config periodically
    return true;
  }

  /**
   * Send a raw email
   */
  async sendEmail(emailData: EmailTemplateData): Promise<any> {
    if (!(await this.ensureTransporter())) {
      throw new Error('Email service not configured or disabled');
    }

    if (!this.transporter || !this.currentConfig) {
      throw new Error('Email transporter not available');
    }

    const mailOptions = {
      from: emailData.from || `"VenuinePro" <${this.currentConfig.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] Successfully sent to ${emailData.to}, MessageID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[EMAIL] Failed to send email to ${emailData.to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email for new tenant signup
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<any> {
    const emailTemplate = {
      to: data.email,
      subject: `Welcome to VenuinePro - ${data.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to VenuinePro</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to VenuinePro!</h1>
              <p style="color: #e5edff; margin: 10px 0 0 0; font-size: 16px;">Your venue management journey starts now</p>
            </div>

            <!-- Content -->
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${data.name},</p>

              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Congratulations! Your VenuinePro account for <strong>${data.organizationName}</strong> has been created successfully.
              </p>

              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">🎉 What's next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                  <li style="margin-bottom: 8px;">Set up your venues and spaces</li>
                  <li style="margin-bottom: 8px;">Configure your services and packages</li>
                  <li style="margin-bottom: 8px;">Start accepting bookings</li>
                  <li style="margin-bottom: 8px;">Track your revenue and analytics</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginUrl}"
                   style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Access Your Dashboard
                </a>
              </div>

              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>💡 Pro Tip:</strong> Complete your venue setup to start accepting your first bookings!
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Need help? Contact our support team or visit our help center.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent by VenuinePro. © ${new Date().getFullYear()} VenuinePro. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return await this.sendEmail(emailTemplate);
  }

  /**
   * Send customer verification email
   */
  async sendCustomerVerificationEmail(data: VerificationEmailData): Promise<any> {
    const emailTemplate = {
      to: data.email,
      subject: 'Verify your email address - VenuinePro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
              <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 16px;">Almost there! Just one more step</p>
            </div>

            <!-- Content -->
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${data.name},</p>

              <p style="margin: 0 0 20px 0; font-size: 16px;">
                Thank you for signing up! To complete your account setup, please verify your email address by clicking the button below.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationUrl}"
                   style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #3b82f6; word-break: break-all;">
                ${data.verificationUrl}
              </p>

              <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #dc2626; font-size: 14px;">
                  <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent by VenuinePro. © ${new Date().getFullYear()} VenuinePro. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return await this.sendEmail(emailTemplate);
  }

  /**
   * Send proposal email to customer
   */
  async sendProposalEmail(data: ProposalEmailData): Promise<any> {
    // Create a professional email wrapper around the proposal content
    const emailTemplate = {
      to: data.to,
      subject: data.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
          <div style="max-width: 700px; margin: 0 auto; background: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Event Proposal</h1>
              ${data.customerName ? `<p style="color: #e5edff; margin: 10px 0 0 0; font-size: 16px;">For ${data.customerName}</p>` : ''}
            </div>

            <!-- Proposal Content -->
            <div style="padding: 0;">
              ${data.htmlContent}
            </div>

            <!-- View Proposal Button -->
            <div style="padding: 30px; text-align: center; background: #f8fafc; border-top: 1px solid #e5e7eb;">
              <a href="${data.proposalViewLink}"
                 style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 20px;">
                View Full Proposal Online
              </a>

              <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
                You can review, accept, or request changes to this proposal using the link above.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Thank you for considering us for your event!
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This proposal was sent by VenuinePro. © ${new Date().getFullYear()} VenuinePro. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await this.sendEmail(emailTemplate);
    console.log(`[PROPOSAL] Proposal email sent to ${data.to} - Subject: ${data.subject}`);
    return result;
  }

  /**
   * Test email functionality
   */
  async sendTestEmail(testEmail: string): Promise<any> {
    if (!(await this.ensureTransporter())) {
      throw new Error('Email service not configured or disabled');
    }

    const emailTemplate = {
      to: testEmail,
      subject: 'VenuinePro Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">✅ Email Configuration Test Successful!</h2>
          <p>This test email confirms that your VenuinePro super admin email configuration is working correctly.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Configuration Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Provider:</strong> ${this.currentConfig?.provider}</li>
              <li><strong>From Email:</strong> ${this.currentConfig?.email}</li>
              <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p style="color: #059669; font-weight: bold;">Your email system is now ready for:</p>
          <ul>
            <li>Customer welcome emails</li>
            <li>Email verification</li>
            <li>Booking confirmations</li>
            <li>System notifications</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This email was sent from VenuinePro Super Admin panel as a configuration test.
          </p>
        </div>
      `,
    };

    return await this.sendEmail(emailTemplate);
  }

  /**
   * Check if email service is available and configured
   */
  async isConfigured(): Promise<boolean> {
    return await this.ensureTransporter();
  }

  /**
   * Get current configuration status
   */
  async getStatus(): Promise<{ configured: boolean; provider?: string; email?: string; error?: string }> {
    try {
      const config = await this.loadEmailConfig();

      if (!config) {
        return { configured: false, error: 'No email configuration found' };
      }

      if (!config.enabled) {
        return { configured: false, error: 'Email service is disabled' };
      }

      // Test connection
      const canConnect = await this.ensureTransporter();

      if (!canConnect) {
        return {
          configured: false,
          provider: config.provider,
          email: config.email,
          error: 'Failed to connect to email service'
        };
      }

      return {
        configured: true,
        provider: config.provider,
        email: config.email
      };

    } catch (error) {
      return {
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const unifiedEmailService = new UnifiedEmailService();