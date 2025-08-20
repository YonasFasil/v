#!/bin/bash

# Production Setup Script for Bluehost Deployment
# Run this script to prepare your application for production deployment

echo "🚀 Setting up production deployment..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Convert schema to MySQL
echo "🔄 Converting database schema to MySQL..."
if [ -f "scripts/convert-to-mysql.js" ]; then
    node scripts/convert-to-mysql.js
else
    echo "❌ MySQL conversion script not found"
    exit 1
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm install --production

# Install MySQL driver
echo "🗄️ Installing MySQL driver..."
npm install mysql2

# Create production environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating environment configuration..."
    cp .env.production.example .env
    echo "⚠️  Please edit .env file with your Bluehost database credentials"
else
    echo "ℹ️  .env file already exists"
fi

# Build application
echo "🔨 Building application for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deployment-package.tar.gz \
    dist/ \
    node_modules/ \
    .env \
    package.json \
    package-lock.json \
    drizzle.config.ts \
    migrations/ \
    --exclude="node_modules/.cache" \
    --exclude="dist/*.map"

echo "✅ Deployment package created: deployment-package.tar.gz"

# Display next steps
echo ""
echo "🎉 Production setup completed!"
echo ""
echo "📋 Next steps for Bluehost deployment:"
echo "1. Upload deployment-package.tar.gz to your Bluehost server"
echo "2. Extract in your domain's root directory"
echo "3. Configure your MySQL database in Bluehost cPanel"
echo "4. Update .env file with your database credentials"
echo "5. Run: npx drizzle-kit push (to create database tables)"
echo "6. Set up Node.js app in Bluehost cPanel"
echo "7. Point startup file to: dist/index.js"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
echo "🔗 Your application will be available at: https://your-domain.com"