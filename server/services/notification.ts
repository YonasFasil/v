import { GmailService } from './gmail';
import type { Booking, Customer, Payment, Proposal } from '@shared/schema';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  bookingConfirmations: boolean;
  paymentReminders: boolean;
  maintenanceAlerts: boolean;
}

export interface EmailNotificationOptions {
  to: string;
  subject: string;
  html: string;
  companyName?: string;
}

export class NotificationService {
  private gmailService: GmailService;
  private preferences: NotificationPreferences;

  constructor(gmailService: GmailService, preferences: NotificationPreferences) {
    this.gmailService = gmailService;
    this.preferences = preferences;
  }

  async sendBookingConfirmation(booking: Booking, customer: Customer): Promise<boolean> {
    if (!this.preferences.emailNotifications || !this.preferences.bookingConfirmations) {
      return false;
    }

    const subject = `Booking Confirmation - ${booking.eventName}`;
    const html = this.generateBookingConfirmationTemplate(booking, customer);

    return this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  async sendCancellationNotification(booking: Booking, customer: Customer, cancellationReason: string): Promise<boolean> {
    if (!this.preferences.emailNotifications) {
      return false;
    }

    const subject = `Booking Cancelled - ${booking.eventName}`;
    const html = this.generateCancellationTemplate(booking, customer, cancellationReason);

    return this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  async sendPaymentReminder(booking: Booking, customer: Customer, amountDue: number): Promise<boolean> {
    if (!this.preferences.emailNotifications || !this.preferences.paymentReminders) {
      return false;
    }

    const subject = `Payment Reminder - ${booking.eventName}`;
    const html = this.generatePaymentReminderTemplate(booking, customer, amountDue);

    return this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  async sendMaintenanceAlert(message: string, recipients: string[]): Promise<boolean> {
    if (!this.preferences.emailNotifications || !this.preferences.maintenanceAlerts) {
      return false;
    }

    const subject = 'System Maintenance Alert';
    const html = this.generateMaintenanceAlertTemplate(message);

    const results = await Promise.all(
      recipients.map(email => this.sendEmail({
        to: email,
        subject,
        html
      }))
    );

    return results.every(result => result);
  }

  async sendProposalNotification(proposal: Proposal, customer: Customer, proposalUrl: string): Promise<boolean> {
    if (!this.preferences.emailNotifications) {
      return false;
    }

    const subject = `New Event Proposal - ${proposal.title || 'Your Event'}`;
    const html = this.generateProposalNotificationTemplate(proposal, customer, proposalUrl);

    return this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  private async sendEmail(options: EmailNotificationOptions): Promise<boolean> {
    try {
      // Use Gmail service to send the email
      await this.gmailService.sendEmail({
        to: options.to,
        subject: options.subject,
        html: options.html
      });
      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  private generateBookingConfirmationTemplate(booking: Booking, customer: Customer): string {
    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .event-details { background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p>Your event reservation has been successfully confirmed</p>
        </div>
        <div class="content">
          <p>Dear ${customer.name},</p>
          <p>Thank you for choosing us for your special event! We're excited to confirm your booking.</p>
          
          <div class="booking-box">
            <h2 style="color: #059669; margin-top: 0;">Event Details</h2>
            <div class="event-details">
              <p><strong>Event:</strong> ${booking.eventName}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              <p><strong>Venue ID:</strong> ${booking.venueId || 'TBD'}</p>
              ${booking.spaceId ? `<p><strong>Space ID:</strong> ${booking.spaceId}</p>` : ''}
              <p><strong>Guest Count:</strong> ${booking.guestCount}</p>
              ${booking.totalAmount ? `<p><strong>Total Amount:</strong> $${booking.totalAmount}</p>` : ''}
            </div>
          </div>

          <p>If you have any questions or need to make changes, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p><strong>Venuine Events</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateCancellationTemplate(booking: Booking, customer: Customer, cancellationReason: string): string {
    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format cancellation reason for display
    const reasonMap: Record<string, string> = {
      client_request: "Client request",
      venue_conflict: "Venue scheduling conflict",
      weather: "Weather-related issues",
      insufficient_payment: "Payment issues",
      force_majeure: "Unforeseen circumstances",
      vendor_unavailable: "Required vendor unavailable",
      permit_issues: "Permit or licensing issues",
      client_emergency: "Client emergency",
      other: "Other circumstances"
    };

    const displayReason = reasonMap[cancellationReason] || cancellationReason;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancellation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .event-details { background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Booking Cancelled</h1>
          <p>Your event reservation has been cancelled</p>
        </div>
        <div class="content">
          <p>Dear ${customer.name},</p>
          <p>We want to inform you that your booking has been cancelled due to: <strong>${displayReason}</strong></p>
          
          <div class="booking-box">
            <h2 style="color: #dc2626; margin-top: 0;">Cancelled Event Details</h2>
            <div class="event-details">
              <p><strong>Event:</strong> ${booking.eventName}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
              <p><strong>Guest Count:</strong> ${booking.guestCount}</p>
              ${booking.totalAmount ? `<p><strong>Total Amount:</strong> $${booking.totalAmount}</p>` : ''}
            </div>
          </div>

          <p>We sincerely apologize for any inconvenience this may cause. If you have any questions about refunds or would like to reschedule, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p>We appreciate your understanding.</p>
            <p><strong>Venuine Events</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentReminderTemplate(booking: Booking, customer: Customer, amountDue: number): string {
    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
          .payment-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .amount-due { font-size: 28px; font-weight: bold; color: #d97706; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💳 Payment Reminder</h1>
          <p>Your event payment is due</p>
        </div>
        <div class="content">
          <p>Dear ${customer.name},</p>
          <p>This is a friendly reminder that payment is due for your upcoming event:</p>
          
          <div class="payment-box">
            <h2 style="color: #d97706; margin-top: 0;">Event Details</h2>
            <p><strong>Event:</strong> ${booking.eventName}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Venue ID:</strong> ${booking.venueId || 'TBD'}</p>
            
            <div class="amount-due">
              Amount Due: $${amountDue.toFixed(2)}
            </div>
          </div>

          <p>Please contact us to arrange payment or if you have any questions about your invoice.</p>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p><strong>Venuine Events</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateMaintenanceAlertTemplate(message: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>System Maintenance Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 4px solid #ef4444; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ System Maintenance Alert</h1>
          <p>Important system notification</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2 style="color: #dc2626; margin-top: 0;">Maintenance Notice</h2>
            <p>${message}</p>
          </div>

          <p>If you have any questions or concerns, please contact our support team.</p>
          
          <div class="footer">
            <p><strong>Venuine Events System Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateProposalNotificationTemplate(proposal: Proposal, customer: Customer, proposalUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Event Proposal</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #faf5ff; padding: 30px; border-radius: 0 0 10px 10px; }
          .proposal-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .btn { background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 New Event Proposal</h1>
          <p>We've prepared a custom proposal for your event</p>
        </div>
        <div class="content">
          <p>Dear ${customer.name},</p>
          <p>Thank you for your interest in hosting your event with us! We've prepared a detailed proposal for your consideration.</p>
          
          <div class="proposal-box">
            <h2 style="color: #7c3aed; margin-top: 0;">Proposal Details</h2>
            <p><strong>Event:</strong> ${proposal.title || 'Your Event'}</p>
            ${proposal.totalAmount ? `<p><strong>Total Investment:</strong> $${proposal.totalAmount}</p>` : ''}
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${proposalUrl}" class="btn">View Full Proposal</a>
            </div>
          </div>

          <p>Please review the proposal and let us know if you have any questions. We're here to help make your event perfect!</p>
          
          <div class="footer">
            <p>Thank you for considering us for your special event!</p>
            <p><strong>Venuine Events</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}