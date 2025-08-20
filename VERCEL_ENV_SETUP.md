# Vercel Environment Variables Setup

## 🚀 Add These to Your Vercel Project

Go to your Vercel project dashboard → **Settings** → **Environment Variables** and add:

### Required Database Variables:
```
DATABASE_URL=postgres://neondb_owner:npg_nuIpDQGvW2h0@ep-super-poetry-adclvsy8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Super Admin Configuration:
```
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=VenueAdmin2024!
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_NAME=Super Administrator
```

### Optional Production Settings:
```
NODE_ENV=production
MAX_REQUEST_SIZE=10mb
```

## 🎯 After Setting Environment Variables:

1. **Redeploy your Vercel project** to pick up the new environment variables
2. **Visit your deployed site** and go to `/super-admin-login`
3. **Use the credentials** above to login

The database tables will be created automatically when the application starts up!

## 🔑 Login Credentials:
- **Username**: `superadmin`
- **Password**: `VenueAdmin2024!`
- **URL**: `https://your-domain.vercel.app/super-admin-login`