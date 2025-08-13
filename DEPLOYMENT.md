# 🚀 VenueFlow SaaS Platform - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### Environment Setup
- [ ] Set up production PostgreSQL database
- [ ] Configure environment variables (copy from `.env.example`)
- [ ] Set up Stripe account and obtain API keys
- [ ] Configure SMTP service for email notifications
- [ ] Set up SSL certificate for HTTPS
- [ ] Configure domain and subdomain DNS

### Security Configuration
- [ ] Generate strong JWT secret
- [ ] Hash super admin password with bcrypt
- [ ] Configure CORS origins for production domains
- [ ] Set up rate limiting for production traffic
- [ ] Configure Content Security Policy headers

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:5432/venueflow_prod

# JWT & Authentication
JWT_SECRET=your-256-bit-secret-key-here
SUPER_ADMIN_EMAIL=admin@yourcompany.com
SUPER_ADMIN_PASSWORD_HASH=your-bcrypt-hashed-password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Stripe Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://*.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_REQUEST_SIZE=10mb

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/venueflow/app.log
```

## 🗄️ Database Setup

### PostgreSQL Installation & Configuration

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres createuser --interactive venueflow
sudo -u postgres createdb venueflow_prod
sudo -u postgres psql -c "ALTER USER venueflow PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE venueflow_prod TO venueflow;"
```

### Run Database Migrations

```bash
# Install dependencies
npm install

# Run database migrations (if using a migration system)
npm run db:migrate

# Seed initial data
npm run db:seed
```

## 🎯 Stripe Configuration

### 1. Create Stripe Products and Prices

```bash
# Create products for each subscription tier
stripe products create --name="Starter Plan" --description="Perfect for small venues"
stripe products create --name="Professional Plan" --description="For growing businesses"
stripe products create --name="Enterprise Plan" --description="For large organizations"

# Create recurring prices for each product
stripe prices create --product=prod_starter --unit-amount=2999 --currency=usd --recurring interval=month
stripe prices create --product=prod_professional --unit-amount=7999 --currency=usd --recurring interval=month
stripe prices create --product=prod_enterprise --unit-amount=19999 --currency=usd --recurring interval=month
```

### 2. Configure Webhooks

Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

Required events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 🌐 DNS & Domain Setup

### Main Domain
```
yourdomain.com → Your application server
www.yourdomain.com → Redirect to yourdomain.com
```

### Subdomain Wildcard
```
*.yourdomain.com → Your application server
```

### SSL Certificate
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d *.yourdomain.com
```

## 🚢 Deployment Options

### Option 1: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: venueflow_prod
      POSTGRES_USER: venueflow
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Option 2: Traditional Server Deployment

```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Deploy application
git clone https://github.com/yourusername/venueflow.git
cd venueflow
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Cloud Deployment (AWS/GCP/Azure)

#### AWS with Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init
eb create production
eb deploy
```

## 🔒 Security Hardening

### Server Security
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Application Security
- [ ] Enable HTTPS only
- [ ] Configure security headers (already implemented)
- [ ] Set up rate limiting (already implemented)
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install -g @newrelic/cli
newrelic install

# Set up log rotation
sudo vim /etc/logrotate.d/venueflow
```

### Health Checks
```javascript
// Add to your Express app
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 🔄 Backup Strategy

### Database Backups
```bash
# Daily automated backups
crontab -e
# Add: 0 2 * * * pg_dump venueflow_prod | gzip > /backups/db_$(date +%Y%m%d).sql.gz
```

### File Backups
```bash
# Backup uploaded files
rsync -av /app/uploads/ /backups/uploads/
```

## 🚀 Post-Deployment

### 1. Verify Deployment
- [ ] Test landing page loads
- [ ] Test signup flow
- [ ] Test super admin login
- [ ] Test Stripe webhooks
- [ ] Test email notifications
- [ ] Test subdomain routing

### 2. Create Super Admin Account
```bash
# Generate password hash
node -e "console.log(require('bcryptjs').hashSync('your-secure-password', 10))"

# Update environment variable
SUPER_ADMIN_PASSWORD_HASH=generated-hash
```

### 3. Configure DNS
- [ ] Set up wildcard subdomain
- [ ] Configure SSL for subdomains
- [ ] Test tenant subdomain access

### 4. Test Payment Flow
- [ ] Create test subscription
- [ ] Verify webhook delivery
- [ ] Test trial expiration
- [ ] Test payment failure handling

## 📈 Scaling Considerations

### Performance Optimization
- Implement Redis for caching
- Use CDN for static assets
- Database query optimization
- Load balancing for multiple instances

### High Availability
- Multi-region deployment
- Database replication
- Automated failover
- Regular disaster recovery testing

## 🐛 Troubleshooting

### Common Issues

1. **Subdomain not resolving**
   - Check DNS wildcard configuration
   - Verify SSL certificate covers subdomains

2. **Stripe webhooks failing**
   - Verify webhook URL is accessible
   - Check webhook secret matches

3. **Email notifications not working**
   - Verify SMTP credentials
   - Check spam folder
   - Verify email service allows app passwords

4. **Rate limiting too strict**
   - Adjust `RATE_LIMIT_MAX_REQUESTS`
   - Implement user-specific rate limiting

### Log Analysis
```bash
# View application logs
pm2 logs venueflow

# Check system logs
sudo journalctl -u venueflow -f

# Database logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

## 📞 Support

For deployment support:
- Email: support@venueflow.com
- Documentation: https://docs.venueflow.com
- Issues: https://github.com/venueflow/platform/issues

---

🎉 **Congratulations!** Your VenueFlow SaaS platform is now ready for production customers!