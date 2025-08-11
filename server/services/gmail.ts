import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface GmailConfig {
  email: string;
  appPassword: string;
}

export class GmailService {
  private transporter: Transporter | null = null;
  private config: GmailConfig | null = null;

  constructor(config?: GmailConfig) {
    if (config) {
      this.configure(config);
    }
  }

  configure(config: GmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email,
        pass: config.appPassword
      }
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Gmail not configured. Please set up Gmail credentials first.');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Gmail not configured. Please set up Gmail credentials first.');
    }

    try {
      await this.transporter.sendMail({
        from: this.config.email,
        to: options.to,
        subject: options.subject,
        html: options.html
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendProposal(options: {
    to: string;
    customerName: string;
    proposalContent: string;
    totalAmount: string;
    validUntil?: string;
    companyName?: string;
    proposalId?: string;
    baseUrl?: string;
  }): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Gmail not configured. Please set up Gmail credentials first.');
    }

    const { to, customerName, proposalContent, totalAmount, validUntil, companyName = 'Venuine Events', proposalId, baseUrl } = options;

    const subject = `Event Proposal from ${companyName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Proposal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .proposal-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .amount { font-size: 28px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
          .btn { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Event Proposal</h1>
          <p>Thank you for considering ${companyName} for your upcoming event</p>
        </div>
        
        <div class="content">
          <h2>Dear ${customerName},</h2>
          
          <p>We're excited to present you with a customized proposal for your event. Our team has carefully crafted this proposal to meet your specific needs and requirements.</p>
          
          <div class="proposal-box">
            <h3>Proposal Details</h3>
            ${proposalContent}
            
            <div class="amount">
              Total Investment: $${totalAmount}
            </div>
            
            ${validUntil ? `
              <div class="highlight">
                <strong>Proposal Valid Until:</strong> ${new Date(validUntil).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            ` : ''}
          </div>
          
          <p>We believe this proposal offers exceptional value and will create an unforgettable experience for your event. Our team is committed to delivering excellence in every detail.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/api/proposals/${proposalId}/track-click" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
              View Your Complete Proposal
            </a>
            <br/>
            <a href="mailto:${this.config.email}?subject=Re: Event Proposal - ${customerName}" style="color: #3b82f6; text-decoration: none;">
              Reply to Accept Proposal
            </a>
          </div>
          
          <p>If you have any questions or would like to discuss any aspect of this proposal, please don't hesitate to reach out. We're here to make your event vision a reality.</p>
        </div>
        
        <div class="footer">
          <p><strong>${companyName}</strong></p>
          <p>Creating memorable experiences, one event at a time</p>
          <p>
            <a href="mailto:${this.config.email}">${this.config.email}</a>
          </p>
        </div>

      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: `"${companyName}" <${this.config.email}>`,
        to,
        subject,
        html: htmlContent,
        text: `
Event Proposal from ${companyName}

Dear ${customerName},

We're excited to present you with a customized proposal for your event.

${proposalContent ? proposalContent.replace(/<[^>]*>/g, '') : 'Customized event proposal'} 

Total Investment: $${totalAmount}

${validUntil ? `Proposal Valid Until: ${new Date(validUntil).toLocaleDateString()}` : ''}

Please reply to this email to accept the proposal or if you have any questions.

Best regards,
${companyName}
${this.config.email}
        `
      });

      return true;
    } catch (error) {
      console.error('Failed to send proposal email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Gmail not configured. Please set up Gmail credentials first.');
    }

    try {
      await this.transporter.sendMail({
        from: this.config.email,
        ...options
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  getConfiguredEmail(): string {
    return this.config?.email || "";
  }
}

// Global instance
export const gmailService = new GmailService();