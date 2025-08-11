import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // App password, not regular password
      }
    });
  }

  async sendProposalEmail({
    to,
    subject,
    htmlContent,
    proposalViewLink
  }: {
    to: string;
    subject: string;
    htmlContent: string;
    proposalViewLink: string;
  }) {
    try {
      const mailOptions = {
        from: `"Venuine Events" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html: htmlContent,
        text: `
          Thank you for considering Venuine Events for your upcoming event.
          
          Please view your complete proposal at: ${proposalViewLink}
          
          If you have any questions, please reply to this email or contact us.
          
          Best regards,
          Venuine Events Team
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();