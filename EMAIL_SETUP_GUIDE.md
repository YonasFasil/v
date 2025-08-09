# Email Setup Guide for Venuine Proposals

## Gmail Setup (Completely Free) 

### Step 1: Enable Gmail App Passwords
1. Go to your Google Account settings: https://myaccount.google.com/
2. Go to "Security" → "2-Step Verification" (you must enable this first)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### Step 2: Set Environment Variables in Replit
1. Click on "Secrets" in the left sidebar of Replit
2. Add these two secrets:
   - **Key**: `EMAIL_USER` **Value**: your full Gmail address (e.g., yourname@gmail.com)
   - **Key**: `EMAIL_PASS` **Value**: the 16-character app password from step 1

### Step 3: Test the Email Functionality
1. Create a proposal in Venuine
2. Make sure the customer has a valid email address
3. Click "Send Proposal"
4. Check the Replit console for email status messages

## Alternative Free Email Services

### SendGrid (100 emails/day)
1. Sign up at https://sendgrid.com
2. Create API key in Settings → API Keys
3. Add secret: `SENDGRID_API_KEY` with your API key
4. Modify the email service to use SendGrid instead

### Mailgun (5,000 emails/month for 3 months)
1. Sign up at https://mailgun.com
2. Get API key from your dashboard
3. Set up custom domain or use sandbox domain

## Email Demo Mode
If no email credentials are provided, the system runs in demo mode:
- Emails are logged to console instead of being sent
- Perfect for development and testing
- No setup required

## Troubleshooting
- **"Authentication failed"**: Check Gmail app password
- **"Cannot send email"**: Verify Gmail 2FA is enabled
- **"Demo mode"**: Email credentials not set in Secrets

## Test Email Template
The system sends beautifully formatted HTML emails with:
- Company branding
- Professional styling  
- Full proposal content
- Responsive design
- Customer personalization