# Stripe Connect Testing Guide

## The Problem You're Experiencing
When you click the Connect onboarding link, Stripe is asking for real bank account information. This happens because:

1. **Test vs Live Mode**: Your Connect account might be in live mode
2. **Account Type**: Express accounts still require some real verification in test mode
3. **Test Data Requirements**: You need to use specific test information

## How to Test Stripe Connect Properly

### Option 1: Use Test Mode Express Account (Recommended)
1. **Ensure Test Mode**: Verify your Stripe keys start with `sk_test_` and `pk_test_`
2. **Create Test Express Account**: Use the endpoint `/api/stripe/connect/create-test-account`
3. **Use Test Data During Onboarding**:
   - **Phone**: Use `000-000-0000` (test phone number)
   - **SSN**: Use `000-00-0000` (test SSN)
   - **Bank Account**: Use test routing number `110000000` and account `000123456789`
   - **Address**: Use any US address like `123 Main St, San Francisco, CA 94102`

### Option 2: Skip Connect for Testing
For pure payment testing without venue payouts:
```bash
# Test regular Stripe payments without Connect
curl -X POST "http://localhost:5000/api/create-payment-intent" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "proposalId": "test"}'
```

### Option 3: Use Stripe Test Connect Accounts
Stripe provides pre-made test accounts:
- **Test Account ID**: `acct_test_123456789`
- Use this directly in payment intents for testing

## Test Cards for Connect Payments
- **Success**: `4000000000000002`
- **Declined**: `4000000000000341` 
- **Requires Authentication**: `4000002500003155`

## Test Information for Onboarding
When Stripe asks for information during Connect onboarding, use these TEST values:

### Personal Information
- **Name**: Test Venue Owner
- **Email**: test@example.com
- **Phone**: 000-000-0000
- **SSN**: 000-00-0000 (for US accounts)

### Business Information  
- **Business Name**: Test Venue LLC
- **EIN**: 00-0000000
- **Business Address**: 123 Test St, San Francisco, CA 94102

### Bank Account (Test)
- **Routing Number**: 110000000
- **Account Number**: 000123456789
- **Account Type**: Checking

## Important Notes
1. **In test mode, you NEVER need real information**
2. **If it asks for real data, you're likely in live mode**
3. **Test mode Express accounts skip most verification steps**
4. **All test data above is provided by Stripe for testing purposes**

## Troubleshooting
If you're still seeing requests for real information:
1. Double-check your API keys are test keys (`sk_test_...`)
2. Ensure you're using the test dashboard (https://dashboard.stripe.com/test/)
3. Create a fresh test Express account
4. Use the exact test values listed above

The key is making sure you're in TEST MODE throughout the entire process!