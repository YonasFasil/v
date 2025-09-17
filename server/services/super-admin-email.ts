import { storage } from '../storage';
import { notificationEmailService } from './notification-email';

export interface SuperAdminEmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
}

export async function getSuperAdminEmailConfig(): Promise<SuperAdminEmailConfig | null> {
  try {
    const emailConfig = await storage.getSetting('super_admin_email_config');
    
    if (!emailConfig?.value) {
      console.warn('Super admin email configuration not found');
      return null;
    }

    return emailConfig.value as SuperAdminEmailConfig;
  } catch (error) {
    console.error('Error fetching super admin email config:', error);
    return null;
  }
}

export async function configureSuperAdminEmail(): Promise<boolean> {
  try {
    const config = await getSuperAdminEmailConfig();
    
    if (!config) {
      return false;
    }

    await notificationEmailService.configure({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });

    return true;
  } catch (error) {
    console.error('Error configuring super admin email:', error);
    return false;
  }
}

export async function sendSuperAdminEmail(data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const config = await getSuperAdminEmailConfig();
    
    if (!config) {
      console.warn('Super admin email not configured - cannot send email');
      return false;
    }

    // Configure the email service with super admin settings
    await configureSuperAdminEmail();

    // Send the email with super admin from address
    return await notificationEmailService.sendEmail({
      ...data,
      from: `${config.fromName} <${config.fromEmail}>`,
    });
  } catch (error) {
    console.error('Error sending super admin email:', error);
    return false;
  }
}

export async function sendUserVerificationEmail(
  email: string, 
  name: string, 
  verificationLink: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 Verify Your Email Address</h1>
        <p>Welcome to Venuine!</p>
    </div>
    
    <div class="content">
        <h2>Hi ${name},</h2>
        
        <p>Thank you for signing up for Venuine! To complete your account setup, please verify your email address by clicking the button below.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationLink}</p>
        
        <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
        
        <p>If you didn't create an account with us, you can safely ignore this email.</p>
        
        <p>Best regards,<br>
        The Venuine Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 Venuine. All rights reserved.</p>
        <p>You received this email because you signed up for a Venuine account.</p>
    </div>
</body>
</html>
  `;

  const text = `
Hi ${name},

Thank you for signing up for Venuine! To complete your account setup, please verify your email address by clicking the link below:

${verificationLink}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with us, you can safely ignore this email.

Best regards,
The Venuine Team

© 2024 Venuine. All rights reserved.
  `;

  return await sendSuperAdminEmail({
    to: email,
    subject: 'Verify Your Venuine Account Email',
    html,
    text,
  });
}

export async function sendCustomerCommunicationEmail(data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tenantName?: string;
}): Promise<boolean> {
  const config = await getSuperAdminEmailConfig();
  
  if (!config) {
    console.warn('Super admin email not configured - cannot send customer communication email');
    return false;
  }

  // For customer communications, we might want to customize the "from" name to include the tenant
  const fromName = data.tenantName ? `${data.tenantName} via ${config.fromName}` : config.fromName;

  // Configure the email service with super admin settings
  await configureSuperAdminEmail();

  return await notificationEmailService.sendEmail({
    ...data,
    from: `${fromName} <${config.fromEmail}>`,
  });
}

export async function sendSuperAdminTestEmail(recipientEmail: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Email Configuration Test</h2>
      <p>This is a test email to verify that your VenuinePro email configuration is working correctly.</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #374151;">Configuration Details:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Provider:</strong> Gmail</li>
          <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      <p>If you received this email, your email configuration is working properly.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">
        This email was sent from VenuinePro Super Admin panel as a configuration test.
      </p>
    </div>
  `;

  const text = `
    VenuinePro Email Configuration Test
    This is a test email to verify that your VenuinePro email configuration is working correctly.
    If you received this email, your email configuration is working properly.
    This email was sent from VenuinePro Super Admin panel as a configuration test.
  `;

  return await sendSuperAdminEmail({
    to: recipientEmail,
    subject: 'VenuinePro Email Configuration Test',
    html,
    text,
  });
}