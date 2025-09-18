// Vercel Serverless Function for Email Status
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
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
    let configSource = 'none';

    // Check environment variables first (Vercel production)
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
      configSource = 'environment';
      console.log('Email config loaded from environment variables');
    } else {
      // Try to load from file (local/development)
      try {
        const configPath = path.join('/tmp', '.email-config.json');
        if (fs.existsSync(configPath)) {
          const fileContent = fs.readFileSync(configPath, 'utf8');
          emailConfig = JSON.parse(fileContent);
          configSource = 'file';
          console.log('Email config loaded from file');
        }
      } catch (fileError) {
        console.log('Could not load from file:', fileError.message);
      }
    }

    const isConfigured = !!(emailConfig && emailConfig.provider && emailConfig.email && emailConfig.password);

    console.log('Email status check:', {
      configured: isConfigured,
      source: configSource,
      provider: emailConfig?.provider || null,
      email: emailConfig?.email ? '***' : null,
      enabled: emailConfig?.enabled || false
    });

    return res.status(200).json({
      configured: isConfigured,
      provider: emailConfig?.provider || null,
      email: emailConfig?.email || null,
      enabled: emailConfig?.enabled || false,
      source: configSource,
      note: !isConfigured && configSource === 'none' ?
        'To configure email service, set GLOBAL_EMAIL_PROVIDER, GLOBAL_EMAIL_ADDRESS, GLOBAL_EMAIL_PASSWORD environment variables in Vercel dashboard' :
        undefined
    });

  } catch (error) {
    console.error('Email status error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};