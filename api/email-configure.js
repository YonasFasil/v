// Vercel Serverless Function for Email Configuration
import fs from 'fs';
import path from 'path';

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

    // Save configuration data
    const configData = {
      provider,
      email,
      password,
      enabled: enabled !== false,
      configuredAt: new Date().toISOString()
    };

    // For serverless environments, we need to set environment variables
    // Note: This only works within the current function execution
    process.env.GLOBAL_EMAIL_PROVIDER = provider;
    process.env.GLOBAL_EMAIL_ADDRESS = email;
    process.env.GLOBAL_EMAIL_PASSWORD = password;
    process.env.GLOBAL_EMAIL_ENABLED = enabled !== false ? 'true' : 'false';
    process.env.EMAIL_CONFIG_TIMESTAMP = new Date().toISOString();

    try {
      // Try to save to file system as backup (works locally)
      const configPath = path.join('/tmp', '.email-config.json');
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      console.log('Email config saved to file system');
    } catch (fileError) {
      console.warn('Could not save to file system:', fileError.message);
      // Continue anyway - environment variables are set
    }

    console.log('Email configuration processed successfully', {
      provider,
      email: email ? 'SET' : 'NOT_SET',
      enabled: enabled !== false
    });

    return res.status(200).json({
      success: true,
      message: 'Email configuration saved successfully',
      data: {
        provider,
        email,
        enabled: enabled !== false,
        configured: true
      },
      instructions: {
        message: 'To complete setup in production, add these environment variables in your Vercel dashboard:',
        variables: [
          { name: 'GLOBAL_EMAIL_PROVIDER', value: provider },
          { name: 'GLOBAL_EMAIL_ADDRESS', value: email },
          { name: 'GLOBAL_EMAIL_PASSWORD', value: '[YOUR_APP_PASSWORD]' },
          { name: 'GLOBAL_EMAIL_ENABLED', value: enabled !== false ? 'true' : 'false' }
        ],
        link: 'https://vercel.com/docs/projects/environment-variables'
      }
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