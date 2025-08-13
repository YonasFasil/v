# 🚀 Deploying VenueFlow to Bluehost

## 📋 Pre-Deployment Checklist

### What You'll Need
- [ ] Bluehost account with your domain
- [ ] FTP/cPanel access credentials
- [ ] Node.js app support (check with Bluehost)
- [ ] Subdomain wildcard support

## 🔧 Step 1: Prepare Your Application

### Build the Production Version
```bash
# In your local development environment
npm run build

# Create deployment package
npm run build:production
```

### Create Production Environment File
Create `.env.production` file:
```bash
# Database (you may need to use Bluehost's MySQL instead)
DATABASE_URL=mysql://username:password@localhost:3306/venueflow_db

# JWT & Authentication
JWT_SECRET=your-super-secure-256-bit-secret-key-here
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD_HASH=$2a$10$your-hashed-password-here

# Email Configuration (use your domain email)
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application URLs
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://*.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🌐 Step 2: Bluehost Configuration

### Option A: Bluehost with Node.js Support

If Bluehost supports Node.js apps:

1. **Access cPanel**
   - Log into your Bluehost account
   - Go to cPanel → "Software" section
   - Look for "Node.js App" or "Node.js Selector"

2. **Create Node.js Application**
   ```
   Node.js Version: 18.x or higher
   Application Root: public_html
   Application URL: yourdomain.com
   Application Startup File: server/index.js
   ```

3. **Upload Files**
   - Use File Manager or FTP
   - Upload all files to `public_html/`
   - Make sure `.env.production` is uploaded

4. **Install Dependencies**
   ```bash
   # In cPanel Terminal or SSH
   cd public_html
   npm install --production
   ```

### Option B: Bluehost with Static Hosting + External API

If Bluehost doesn't support Node.js:

1. **Deploy Frontend to Bluehost**
   - Build static version: `npm run build:static`
   - Upload `dist/` folder contents to `public_html/`

2. **Deploy Backend to Node.js Hosting**
   - Use services like Railway, Render, or DigitalOcean
   - Update API URLs in frontend

## 🗄️ Step 3: Database Setup

### Bluehost MySQL Setup

1. **Create Database in cPanel**
   - Go to cPanel → "Databases" → "MySQL Databases"
   - Create database: `venueflow_db`
   - Create user with full privileges

2. **Update Database Connection**
   ```javascript
   // Update your database connection for MySQL
   DATABASE_URL=mysql://username:password@localhost:3306/venueflow_db
   ```

3. **Convert PostgreSQL to MySQL** (if needed)
   - Update schema files to use MySQL syntax
   - Modify data types as needed

## 🚀 Step 4: Upload and Configure

### File Upload Methods

**Method 1: FTP Client (Recommended)**
```bash
# Using FileZilla or similar
Host: ftp.yourdomain.com
Username: your-ftp-username
Password: your-ftp-password
Port: 21

# Upload entire project to public_html/
```

**Method 2: cPanel File Manager**
1. Compress your project: `zip -r venueflow.zip .`
2. Upload zip file in cPanel File Manager
3. Extract in `public_html/`

**Method 3: Git (if available)**
```bash
# If Bluehost supports Git
cd public_html
git clone https://github.com/yourusername/venueflow.git .
```

### Set File Permissions
```bash
# Set correct permissions
chmod 755 public_html/
chmod 644 public_html/.env.production
chmod +x public_html/server/index.js
```

## 🌍 Step 5: Domain and Subdomain Setup

### Configure Wildcard Subdomains

1. **In Bluehost cPanel**
   - Go to "Subdomains" section
   - Create wildcard subdomain: `*`
   - Point to same directory as main domain

2. **Alternative: Manual Subdomain Creation**
   ```
   Create subdomains for common patterns:
   - demo.yourdomain.com
   - test.yourdomain.com
   - *.yourdomain.com (if supported)
   ```

### SSL Certificate Setup

1. **Enable SSL in cPanel**
   - Go to "SSL/TLS" section
   - Enable "Force HTTPS Redirect"
   - Install Let's Encrypt certificate

2. **Wildcard SSL** (if needed)
   - May require paid SSL certificate
   - Contact Bluehost support for wildcard SSL

## ⚙️ Step 6: Application Configuration

### Update Package.json for Bluehost
```json
{
  "scripts": {
    "start": "node server/index.js",
    "build": "tsc && npm run build:client",
    "build:client": "vite build",
    "production": "NODE_ENV=production npm start"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### Create Startup Script
```bash
# Create start.sh
#!/bin/bash
cd /home/username/public_html
export NODE_ENV=production
npm start
```

## 📧 Step 7: Email Configuration

### Bluehost Email Setup

1. **Create Email Account**
   - cPanel → "Email Accounts"
   - Create: `noreply@yourdomain.com`

2. **SMTP Settings**
   ```
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASS=your-email-password
   ```

## 💳 Step 8: Stripe Configuration

### Webhook Setup
1. **In Stripe Dashboard**
   - Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. **Test Webhook**
   ```bash
   # Test webhook delivery
   curl -X POST https://yourdomain.com/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

## 🔍 Step 9: Testing Deployment

### Basic Tests
```bash
# Test main site
curl https://yourdomain.com

# Test API
curl https://yourdomain.com/api/public/packages

# Test subdomain (if configured)
curl https://demo.yourdomain.com
```

### Frontend Tests
- [ ] Landing page loads
- [ ] Signup flow works
- [ ] Super admin login
- [ ] Package selection
- [ ] Payment integration

## 🐛 Step 10: Troubleshooting

### Common Bluehost Issues

**Issue 1: Node.js Not Supported**
```
Solution: Use static hosting + external API
- Deploy frontend to Bluehost
- Deploy backend to Railway/Render/DigitalOcean
- Update API URLs
```

**Issue 2: Subdomain Issues**
```
Solution: Manual subdomain creation
- Create each tenant subdomain manually
- Use subdirectory routing instead: yourdomain.com/tenant/demo
```

**Issue 3: Database Connection Issues**
```
Solution: Check MySQL configuration
- Verify database credentials
- Check MySQL version compatibility
- Update connection string format
```

**Issue 4: File Permissions**
```bash
# Fix permissions
find public_html/ -type f -exec chmod 644 {} \;
find public_html/ -type d -exec chmod 755 {} \;
chmod +x public_html/server/index.js
```

### Log Files
```bash
# Check error logs in cPanel
# Look for:
- Error Logs
- Access Logs
- Node.js app logs (if available)
```

## 📞 Step 11: Go Live Checklist

### Pre-Launch
- [ ] Domain points to Bluehost
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Database created and connected
- [ ] Email sending configured
- [ ] Stripe webhooks working
- [ ] All tests passing

### Launch
- [ ] Update DNS if needed
- [ ] Test complete signup flow
- [ ] Verify email notifications
- [ ] Test payment processing
- [ ] Monitor error logs

### Post-Launch
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test subdomain routing
- [ ] Verify super admin access

## 🆘 Alternative Solutions

### If Bluehost Doesn't Support Node.js

**Option 1: Hybrid Deployment**
```
Frontend: Bluehost (static files)
Backend: Railway.app or Render.com
Database: PlanetScale or Railway
```

**Option 2: Full Migration**
```
Consider moving to:
- DigitalOcean App Platform
- Railway.app
- Render.com
- Vercel + PlanetScale
```

**Option 3: Static Export**
```bash
# Export as static site
npm run build:static
# Upload only frontend files
# Use serverless functions for API
```

## 📚 Additional Resources

- [Bluehost Node.js Documentation](https://www.bluehost.com/help/article/nodejs-support)
- [Bluehost cPanel Guide](https://www.bluehost.com/help/cpanel)
- [Bluehost SSL Setup](https://www.bluehost.com/help/article/ssl-certificates)

---

🎉 **Ready to deploy to Bluehost!** Follow these steps and your VenueFlow SaaS platform will be live!