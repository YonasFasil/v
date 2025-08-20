# Neon PostgreSQL Database Setup Guide

## 🎯 Overview
Your application is now configured to use **Neon PostgreSQL** instead of MySQL. This guide will help you set up your database and create a super-admin user.

## 📋 Prerequisites
1. **Neon Account**: Sign up at [neon.tech](https://neon.tech)
2. **Database URL**: Get your connection string from Neon dashboard

## 🚀 Setup Steps

### 1. Create Your Neon Database
1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Create a new project
3. Copy your **Database URL** (looks like: `postgresql://username:password@host/database?sslmode=require`)

### 2. Configure Environment Variables

#### For Local Development:
Create a `.env` file in your project root:
```bash
DATABASE_URL=your_neon_database_url_here

# Optional: Customize super admin credentials
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=your_secure_password_here  
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_NAME=Super Administrator
```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `DATABASE_URL` = your Neon database URL
   - `SUPER_ADMIN_USERNAME` = your preferred admin username
   - `SUPER_ADMIN_PASSWORD` = your secure admin password
   - `SUPER_ADMIN_EMAIL` = your admin email
   - `SUPER_ADMIN_NAME` = your admin display name

### 3. Generate and Push Database Schema

#### Local Development:
```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Set up initial data and super admin user
npm run db:setup
```

#### Production (after Vercel deployment):
The database will be created automatically when you first access the API endpoints, but you'll need to run the setup script manually for the super admin user.

### 4. Super Admin Access

After setup, you can login to the super admin panel:
- **URL**: `your-domain.com/super-admin-login`
- **Default Credentials**: 
  - Username: `superadmin`
  - Password: `admin123` (or your custom password)

### 5. Creating Tenant Users

Once logged in as super admin, you can:
1. Create tenant organizations
2. Create tenant admin users
3. Manage subscription packages
4. Monitor system usage

## 🔧 Database Commands

```bash
# Generate new migrations after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push  

# Run database migration
npm run db:migrate

# Set up initial data and super admin
npm run db:setup

# Check database connection
npm run check
```

## 🔒 Security Best Practices

1. **Change Default Password**: Immediately change the super admin password after first login
2. **Strong Passwords**: Use complex passwords for all admin accounts
3. **Environment Variables**: Never commit credentials to your repository
4. **SSL Connection**: Neon uses SSL by default - keep it enabled

## 🐛 Troubleshooting

### Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that Neon database is running
- Ensure SSL mode is enabled in connection string

### Schema Issues
- Run `npm run db:generate` after schema changes
- Use `npm run db:push` to sync with database

### Super Admin Login Issues  
- Verify super admin user was created: run `npm run db:setup`
- Check that user role is `super_admin` in database
- Ensure password matches what you set in environment variables

## 📞 Support

If you encounter issues:
1. Check the Vercel function logs in dashboard
2. Verify database connection in Neon console
3. Test API endpoints locally first
4. Check environment variables are set correctly

## ✅ Verification Checklist

- [ ] Neon database created
- [ ] `DATABASE_URL` set in environment variables
- [ ] Schema pushed to database (`npm run db:push`)
- [ ] Super admin user created (`npm run db:setup`)
- [ ] Super admin login works
- [ ] Application deploys successfully on Vercel

---

🎉 **You're all set!** Your venue management application is now running on Neon PostgreSQL with a proper super admin system.