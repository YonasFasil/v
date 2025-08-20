# 🚀 Bluehost Deployment Guide

## Overview
This guide will help you deploy your Event Venue Management System to Bluehost with MySQL database.

## Prerequisites
- Bluehost hosting account
- Node.js 18+ support (check with Bluehost)
- MySQL database access
- Domain name configured

## Step 1: Database Setup on Bluehost

### 1.1 Create MySQL Database
1. Log into your Bluehost cPanel
2. Go to "MySQL Databases"
3. Create a new database: `your_domain_venues`
4. Create a database user with full privileges
5. Note down:
   - Database name
   - Username
   - Password
   - Host (usually `localhost`)

### 1.2 Get Database URL
Format: `mysql://username:password@host:3306/database_name`
Example: `mysql://venues_user:mypassword@localhost:3306/venues_db`

## Step 2: Code Preparation

### 2.1 Complete MySQL Schema Conversion
The schema conversion has been started but needs completion. Run this script to convert all tables:

```bash
# Install dependencies
npm install mysql2 drizzle-orm

# Update remaining schema files
npm run convert-schema
```

### 2.2 Environment Variables
Create `.env.production` file:
```env
NODE_ENV=production
DATABASE_URL=mysql://your_user:your_password@localhost:3306/your_database
PORT=3000
SESSION_SECRET=your-super-secure-session-secret-here
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your_email_password
SMTP_FROM=noreply@your-domain.com
```

### 2.3 Build for Production
```bash
npm run build
```

## Step 3: Bluehost Deployment

### 3.1 Upload Files
Using File Manager or FTP:
1. Upload `dist/` folder contents to your domain's public folder
2. Upload `node_modules/` (or run `npm install` on server)
3. Upload `.env.production` as `.env`

### 3.2 Bluehost Node.js Setup
1. In cPanel, find "Node.js" or "Node.js Selector"
2. Create new Node.js app:
   - Node.js version: 18+ 
   - Application root: `/public_html/your-domain`
   - Application URL: your domain
   - Startup file: `dist/index.js`

### 3.3 Install Dependencies
In Bluehost terminal or SSH:
```bash
cd /home/your-username/public_html/your-domain
npm install --production
```

### 3.4 Database Migration
```bash
npx drizzle-kit push
```

## Step 4: Configure Domain & SSL

### 4.1 DNS Setup
Point your domain to Bluehost nameservers:
- ns1.bluehost.com
- ns2.bluehost.com

### 4.2 SSL Certificate
1. In cPanel, go to "SSL/TLS"
2. Enable "Let's Encrypt" free SSL
3. Force HTTPS redirects

## Step 5: Application Configuration

### 5.1 Create Super Admin User
```bash
npm run create-super-admin
```

### 5.2 Test Application
Visit: `https://your-domain.com`
- Test registration
- Test tenant creation
- Test package creation

## Step 6: Monitoring & Maintenance

### 6.1 Error Logs
Check logs in cPanel "Error Logs" section

### 6.2 Database Backups
Set up automatic MySQL backups in cPanel

### 6.3 Updates
To update the application:
```bash
# Pull latest code
git pull origin main

# Build
npm run build

# Restart Node.js app in cPanel
```

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
- Run `npm install` in the correct directory
- Check Node.js version compatibility

**2. Database connection errors**
- Verify DATABASE_URL format
- Check MySQL user permissions
- Ensure database exists

**3. "Port already in use"**
- Bluehost assigns ports automatically
- Don't specify PORT in startup

**4. 502 Bad Gateway**
- Check Node.js app status in cPanel
- Review error logs
- Verify startup file path

### Performance Optimization

1. **Enable gzip compression** in cPanel
2. **Set up CloudFlare** for CDN
3. **Optimize images** before upload
4. **Enable browser caching** via .htaccess

## Security Checklist

- ✅ SSL certificate enabled
- ✅ Strong database passwords
- ✅ Environment variables secured
- ✅ Regular security updates
- ✅ Database backups automated

## Support

For deployment issues:
1. Check Bluehost documentation
2. Contact Bluehost support for server issues
3. Review application error logs
4. Test locally first

---

**Next Steps:** Follow this guide step by step. The most critical part is completing the MySQL schema conversion before deployment.