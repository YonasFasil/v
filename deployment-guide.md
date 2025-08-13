# Venuine Deployment Guide

## Overview
This guide covers deploying your Venuine venue management system to your own infrastructure using GitHub and BlueHost.

## Prerequisites
- GitHub account
- BlueHost hosting account with Node.js support
- Domain configured on BlueHost
- PostgreSQL database access

## Deployment Steps

### 1. Prepare for Production

#### Environment Variables
Create a `.env.production` file with:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=your_production_postgresql_url
CORS_ORIGINS=https://yourdomain.com
SESSION_SECRET=your_secure_session_secret_here
MAX_REQUEST_SIZE=10mb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Email configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@yourdomain.com
SMTP_PASS=your_email_password

# Optional: AI features (if using Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Optional: Stripe payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

#### Package.json Scripts
Your package.json already includes production scripts:
- `npm run build` - Builds the client
- `npm start` - Starts production server
- `npm run db:push` - Pushes database schema

### 2. Database Setup

#### Option A: Use BlueHost PostgreSQL
1. Create a PostgreSQL database in your BlueHost control panel
2. Note the connection details (host, database name, username, password)
3. Update DATABASE_URL in your environment variables

#### Option B: External PostgreSQL Service
Consider using:
- **Neon** (recommended) - Serverless PostgreSQL
- **Supabase** - PostgreSQL with additional features
- **ElephantSQL** - PostgreSQL as a service

### 3. GitHub Repository Setup

1. **Initialize Git Repository**
```bash
git init
git add .
git commit -m "Initial commit - Venuine venue management system"
```

2. **Create GitHub Repository**
- Go to GitHub and create a new repository
- Follow the instructions to push your code

3. **Add Production Environment File**
- Add `.env.production` to your repository (remove sensitive values)
- Use GitHub Secrets for sensitive environment variables

### 4. BlueHost Deployment

#### Method A: Direct Upload
1. Build your application locally:
```bash
npm install
npm run build
```

2. Upload files to your BlueHost account:
- Upload all files except `node_modules/`
- Upload to your domain's public folder

3. Install dependencies on BlueHost:
```bash
npm install --production
```

4. Start your application:
```bash
npm start
```

#### Method B: Git Deployment (if supported)
1. Clone your repository on BlueHost:
```bash
git clone https://github.com/yourusername/venuine-app.git
cd venuine-app
```

2. Install and build:
```bash
npm install
npm run build
npm run db:push
```

3. Start the application:
```bash
npm start
```

### 5. Domain Configuration

1. **DNS Setup**
- Point your domain to BlueHost servers
- Configure A records or CNAME as needed

2. **SSL Certificate**
- Enable SSL through BlueHost control panel
- Update CORS_ORIGINS to use https://yourdomain.com

3. **Process Management**
Consider using PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "venuine" -- start
pm2 startup
pm2 save
```

### 6. Security Considerations

1. **Environment Variables**
- Never commit sensitive data to GitHub
- Use environment variables for all secrets
- Update CORS_ORIGINS for production domain

2. **Database Security**
- Use strong database passwords
- Restrict database access to your server IP
- Enable SSL for database connections

3. **Application Security**
- The app includes security middleware (helmet, rate limiting)
- Consider additional firewall rules on BlueHost

### 7. Monitoring and Maintenance

1. **Logs**
- Monitor application logs regularly
- Set up log rotation

2. **Backups**
- Regular database backups
- Code backups through GitHub

3. **Updates**
- Keep dependencies updated
- Monitor for security updates

## Troubleshooting

### Common Issues

1. **Port Issues**
- Ensure BlueHost supports your chosen port
- Some shared hosting uses specific ports

2. **Node.js Version**
- Verify BlueHost supports Node.js 18+
- Update if necessary

3. **Database Connection**
- Check DATABASE_URL format
- Verify database credentials
- Test connection separately

4. **Static Files**
- Ensure build process completed
- Check file permissions

### Performance Optimization

1. **Caching**
- Enable compression (already included)
- Consider CDN for static assets

2. **Database**
- Monitor query performance
- Add indexes as needed

3. **Monitoring**
- Set up uptime monitoring
- Monitor response times

## Support

For deployment issues:
1. Check BlueHost documentation for Node.js hosting
2. Verify all environment variables are set
3. Check application logs for errors
4. Test database connectivity separately

The application is designed to be production-ready with proper security, error handling, and performance optimizations already included.