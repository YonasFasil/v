#!/bin/bash

# Venuine Production Deployment Script
# Run this script on your BlueHost server

echo "🚀 Starting Venuine deployment..."

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Setup database schema
echo "🗄️  Setting up database..."
npm run db:push

# Setup PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📋 Installing PM2..."
    npm install -g pm2
fi

# Stop any existing instance
echo "🛑 Stopping existing instances..."
pm2 stop venuine-production 2>/dev/null || true
pm2 delete venuine-production 2>/dev/null || true

# Start the application
echo "🟢 Starting application..."
pm2 start ecosystem.config.js --env production

# Setup PM2 startup script
echo "⚙️  Setting up startup script..."
pm2 startup
pm2 save

echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status

echo ""
echo "🔗 Your application should now be running at your domain"
echo "📝 Check logs with: pm2 logs venuine-production"
echo "🔄 Restart with: pm2 restart venuine-production"
echo "📊 Monitor with: pm2 monit"