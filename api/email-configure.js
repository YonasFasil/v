// Vercel Serverless Function for Email Configuration
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

  console.log('Email configure endpoint hit:', req.method, req.url);
  console.log('Request body:', req.body);

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowedMethods: ['POST']
    });
  }

  try {
    const { provider, email, password, enabled } = req.body || {};

    console.log('Parsed data:', { provider, email, enabled, hasPassword: !!password });

    // Validate required fields
    if (!provider || !email) {
      return res.status(400).json({
        error: 'Provider and email are required',
        received: { provider, email, enabled }
      });
    }

    if (provider === 'gmail' && !password) {
      return res.status(400).json({
        error: 'App password is required for Gmail'
      });
    }

    // Basic email validation
    if (!email.includes('@')) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Save configuration to a JSON file
    const configData = {
      provider,
      email,
      password,
      enabled: enabled !== false,
      configuredAt: new Date().toISOString()
    };

    try {
      // Try to save to file system (works locally and some serverless environments)
      const configPath = path.join('/tmp', '.email-config.json');
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      console.log('Email config saved to file system');
    } catch (fileError) {
      console.warn('Could not save to file system:', fileError.message);
      // Continue anyway - we'll rely on environment variables in production
    }

    console.log('Email configuration processed successfully');

    return res.status(200).json({
      success: true,
      message: 'Email configuration saved successfully',
      data: {
        provider,
        email,
        enabled: enabled !== false,
        configured: true
      },
      notice: 'For production use, set GLOBAL_EMAIL_PROVIDER, GLOBAL_EMAIL_ADDRESS, GLOBAL_EMAIL_PASSWORD, GLOBAL_EMAIL_ENABLED in Vercel environment variables'
    });

  } catch (error) {
    console.error('Email configuration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}