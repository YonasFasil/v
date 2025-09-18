// Vercel Serverless Function for Email Status
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowedMethods: ['GET']
    });
  }

  try {
    let emailConfig = null;

    // Try to load from file first
    try {
      const configPath = path.join('/tmp', '.email-config.json');
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        emailConfig = JSON.parse(fileContent);
        console.log('Email config loaded from file');
      }
    } catch (fileError) {
      console.log('Could not load from file, checking environment variables');
    }

    // Fall back to environment variables
    if (!emailConfig) {
      const provider = process.env.GLOBAL_EMAIL_PROVIDER;
      const email = process.env.GLOBAL_EMAIL_ADDRESS;
      const password = process.env.GLOBAL_EMAIL_PASSWORD;
      const enabled = process.env.GLOBAL_EMAIL_ENABLED !== 'false';

      if (provider && email && password) {
        emailConfig = {
          provider,
          email,
          password,
          enabled
        };
        console.log('Email config loaded from environment variables');
      }
    }

    const isConfigured = !!(emailConfig && emailConfig.provider && emailConfig.email && emailConfig.password);

    console.log('Email status check:', {
      configured: isConfigured,
      provider: emailConfig?.provider || null,
      email: emailConfig?.email ? '***' : null,
      enabled: emailConfig?.enabled || false
    });

    return res.status(200).json({
      configured: isConfigured,
      provider: emailConfig?.provider || null,
      email: emailConfig?.email || null,
      enabled: emailConfig?.enabled || false
    });

  } catch (error) {
    console.error('Email status error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}