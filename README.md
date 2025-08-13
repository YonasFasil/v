# Venuine - Event Venue Management System

A comprehensive event venue management system designed for venue owners and event managers. Built with React, Express, TypeScript, and PostgreSQL.

## Features

- **Event Management**: Create, edit, and track events with detailed information
- **Customer Management**: Comprehensive customer database with communication history
- **Venue Management**: Multiple venue support with space-specific booking
- **Proposals**: Generate and send professional event proposals
- **Payments**: Integrated payment processing with Stripe
- **Tasks**: Task management for event coordination
- **AI Integration**: Smart scheduling, automated email replies, and lead scoring
- **Reports & Analytics**: Comprehensive dashboard with insights
- **Multi-tenant**: Support for multiple venue organizations

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication
- **Payments**: Stripe integration
- **AI**: Google Gemini API integration

## Quick Start (Development)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5000`

## Production Deployment

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Domain with SSL certificate
- (Optional) Stripe account for payments
- (Optional) Google Gemini API key for AI features

### Deployment Options

#### 1. GitHub + BlueHost Deployment

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/venuine.git
   git push -u origin main
   ```

2. **Setup Production Environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your production values
   ```

3. **Deploy to BlueHost**
   ```bash
   # On your BlueHost server
   git clone https://github.com/yourusername/venuine.git
   cd venuine
   ./deploy.sh
   ```

#### 2. Manual Deployment

1. **Build Application**
   ```bash
   npm install
   npm run build
   npm run db:push
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

   Or with PM2:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/dbname
CORS_ORIGINS=https://yourdomain.com
SESSION_SECRET=your-secure-session-secret
```

Optional environment variables:

```env
# Email
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password

# AI Features
GEMINI_API_KEY=your-gemini-api-key

# Payments
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### Database Setup

The application supports multiple database options:

- **Neon** (Recommended): Serverless PostgreSQL
- **Supabase**: PostgreSQL with additional features  
- **Traditional PostgreSQL**: Self-hosted or managed

Run `npm run db:push` to setup the database schema.

### Security

The application includes comprehensive security measures:

- Helmet.js for security headers
- CORS protection
- Rate limiting
- Input sanitization
- Session security
- SQL injection prevention

### Monitoring

Use PM2 for production process management:

```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart venuine # Restart application
pm2 monit           # Monitor resources
```

### Troubleshooting

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check database credentials
   - Ensure database is accessible from your server

2. **Port Issues**
   - Verify BlueHost supports your chosen port
   - Check firewall settings

3. **Build Issues**
   - Ensure Node.js version is 18+
   - Clear node_modules and reinstall

4. **SSL/HTTPS Issues**
   - Update CORS_ORIGINS to use https://
   - Verify SSL certificate is properly configured

## Development

### Project Structure

```
venuine/
├── client/                 # React frontend
│   ├── src/
│   └── public/
├── server/                 # Express backend
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   └── routes.ts          # API routes
├── shared/                # Shared types and schemas
└── deployment files
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

### API Documentation

The application provides RESTful APIs for:

- `/api/tenant/*` - Tenant-specific operations
- `/api/public/*` - Public endpoints
- `/api/super-admin/*` - Super admin operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For deployment assistance:
1. Check the deployment-guide.md
2. Verify all environment variables
3. Check application logs
4. Test database connectivity

The application is designed to be production-ready with proper error handling, security, and performance optimizations.