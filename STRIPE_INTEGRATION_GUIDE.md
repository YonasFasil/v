# Stripe Integration Guide for VENUIN Superadmin

## Overview
VENUIN uses Stripe for both subscription billing (Stripe Billing) and client payment processing (Stripe Connect). This guide covers how to integrate Stripe into your superadmin console.

## Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_`) - this is safe to be public
3. Copy your **Secret key** (starts with `sk_`) - this must be kept secret

## Step 2: Set Environment Variables

You need to set these secrets in your Replit environment:

- `STRIPE_SECRET_KEY` - Your secret key (starts with `sk_`)
- `VITE_STRIPE_PUBLIC_KEY` - Your publishable key (starts with `pk_`)

## Step 3: Create Products and Prices in Stripe

For each feature package you create in VENUIN:

1. **Create a Product in Stripe:**
   - Go to [Stripe Products](https://dashboard.stripe.com/products)
   - Click "Add product"
   - Name: Match your VENUIN package name (e.g., "Professional Plan")
   - Description: Brief description of the package

2. **Create Pricing for the Product:**
   - Add pricing for Monthly billing
   - Add pricing for Yearly billing (usually 10-15% discount)
   - Copy the Price IDs (start with `price_`) - you'll need these

## Step 4: Superadmin Stripe Features

Once integrated, your superadmin will have these Stripe capabilities:

### Subscription Management
- **View Customer Subscriptions**: See all tenant subscription statuses
- **Manage Billing Issues**: Handle failed payments, update payment methods
- **Process Refunds**: Issue refunds through the platform
- **Upgrade/Downgrade Plans**: Change tenant subscription levels

### Revenue Analytics
- **Monthly Recurring Revenue (MRR)**: Track subscription income
- **Customer Lifetime Value**: Analyze tenant value over time  
- **Churn Analysis**: Monitor subscription cancellations
- **Revenue Forecasting**: Predict future income

### Automated Features
- **Failed Payment Handling**: Automatic retry and suspension logic
- **Invoice Generation**: Automated invoice creation and delivery
- **Proration Handling**: Automatic pro-rated billing for plan changes
- **Tax Calculation**: Automatic tax calculation based on location

## Step 5: Stripe Connect for Client Payments

VENUIN also uses Stripe Connect so tenants can accept payments from their clients:

### Connect Account Management
- **Onboard Venues**: Help tenants set up Stripe Connect accounts
- **Monitor Payouts**: Track venue earnings and payout schedules
- **Handle Disputes**: Manage chargebacks and refunds for venues
- **Compliance Monitoring**: Ensure venues meet Stripe's requirements

### Platform Revenue
- **Application Fees**: Take a percentage of each venue booking
- **Subscription + Transaction Model**: Combine monthly subscriptions with per-transaction fees

## Step 6: Testing Your Integration

### Test Mode Setup
1. Use Stripe test keys for development
2. Create test products and prices
3. Use test card numbers (4242424242424242)
4. Verify webhooks are working properly

### Live Mode Checklist
- [ ] Live API keys configured
- [ ] Products and prices created in live mode
- [ ] Webhooks configured for production URL
- [ ] Tax settings configured
- [ ] Bank account added for payouts

## Step 7: Advanced Features

### Webhooks
Set up webhooks to handle:
- `invoice.payment_succeeded` - Successful subscription payments
- `invoice.payment_failed` - Failed subscription payments  
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellations

### Analytics Integration
Connect Stripe data to your superadmin dashboard:
- Real-time revenue metrics
- Subscription health monitoring
- Customer payment behavior analysis
- Automated alerts for billing issues

## Security Best Practices

1. **Never expose secret keys** - Only use in server-side code
2. **Use webhook signing** - Verify webhook authenticity
3. **Implement proper error handling** - Handle all Stripe exceptions
4. **Monitor for suspicious activity** - Set up Stripe Radar
5. **Regular security audits** - Review access logs and permissions

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Stripe Billing Docs](https://stripe.com/docs/billing)
- [Webhook Testing Tool](https://stripe.com/docs/webhooks/test)

---

*This guide covers the complete Stripe integration for VENUIN's SaaS platform. For specific implementation details, refer to the codebase examples in `/server/routes/billing.ts` and `/client/src/pages/billing/`.*