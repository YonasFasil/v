# Vercel Environment Setup

This document outlines the required and recommended environment variables for deploying the Venuine application to Vercel or other production environments.

## 🔐 Required Environment Variables

These variables **must** be set for the application to start:

### `JWT_SECRET`
- **Purpose**: Signs and verifies JWT tokens for user authentication
- **Format**: String, minimum 32 characters
- **Example**: `your-super-secure-jwt-secret-key-here-min-32-chars`
- **Security**: Generate using `openssl rand -hex 32` or similar
- **Critical**: Never use default values like "dev-secret"

### `DATABASE_URL`
- **Purpose**: PostgreSQL connection string
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `postgresql://user:pass@localhost:5432/venuedb`
- **Security**: Ensure password is strong and not committed to repository

## 🛡️ Security Environment Variables

These variables control security features and should be set in production:

### `NODE_ENV`
- **Purpose**: Controls production vs development behavior
- **Format**: `production` | `development` | `test`
- **Production Value**: `production`
- **Impact**: Enables security headers, CORS restrictions, debug blocking

### `CORS_ORIGINS`
- **Purpose**: Comma-separated list of allowed origins for CORS
- **Format**: `https://app.venuine.com,https://venuine.com`
- **Production Value**: Your actual domain(s)
- **Default**: Falls back to localhost in development

## ⚡ Performance & Rate Limiting

### `RATE_LIMIT_WINDOW_MS`
- **Purpose**: Rate limiting time window in milliseconds
- **Format**: Number (milliseconds)
- **Default**: `900000` (15 minutes)
- **Recommended**: `900000` for production

### `RATE_LIMIT_MAX_REQUESTS`
- **Purpose**: Maximum requests per IP per time window
- **Format**: Number
- **Default**: `100`
- **Recommended**: `1000` for high-traffic sites, `100` for normal usage

### `MAX_REQUEST_SIZE`
- **Purpose**: Maximum request body size
- **Format**: String with unit (e.g., "10mb")
- **Default**: `10mb`
- **Recommended**: `10mb` unless you need larger uploads

## 📧 Email Configuration (Optional)

### SMTP Settings
If using custom email configuration:
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port (usually 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `FROM_EMAIL`: Default from email address
- `FROM_NAME`: Default from name

## 💳 Payment Integration (Optional)

### Stripe (if using payments)
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

## 🔧 Vercel Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Set Environment Variables** in Vercel dashboard or via CLI:
   ```bash
   vercel env add JWT_SECRET
   vercel env add DATABASE_URL
   vercel env add NODE_ENV
   vercel env add CORS_ORIGINS
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## ✅ Environment Validation

Before deployment, run the environment validation script:

```bash
npm run env:validate
```

This script will:
- ✅ Check all required variables are present
- ⚠️ Warn about missing recommended variables
- 🚨 Fail if critical security issues are found
- ❌ Exit with non-zero code if environment is invalid

## 🚨 Security Checklist

- [ ] `JWT_SECRET` is at least 32 characters and randomly generated
- [ ] `DATABASE_URL` password is strong and not in repository
- [ ] `NODE_ENV=production` is set for production deployments
- [ ] `CORS_ORIGINS` is set to your actual domain(s) in production
- [ ] No `.env` files are committed to the repository
- [ ] Database connection uses SSL in production
- [ ] Rate limiting is configured appropriately for your traffic
- [ ] All environment variables are set in Vercel dashboard

## 🛠️ Troubleshooting

### Application won't start
- Run `npm run env:validate` to check environment variables
- Ensure `JWT_SECRET` is at least 32 characters
- Verify `DATABASE_URL` format and connectivity

### CORS errors in production
- Check `CORS_ORIGINS` includes your frontend domain
- Ensure `NODE_ENV=production` is set
- Verify domain matches exactly (https vs http, www vs non-www)

### Rate limiting issues
- Adjust `RATE_LIMIT_MAX_REQUESTS` for your traffic
- Check `RATE_LIMIT_WINDOW_MS` is appropriate
- Consider different limits for different environments

## 📞 Support

If you encounter issues with environment setup:
1. Check this documentation
2. Run `npm run env:validate` for diagnostics
3. Verify Vercel environment variables in dashboard
4. Check application logs for specific error messages