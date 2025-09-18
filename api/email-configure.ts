// Vercel Serverless Function for Email Configuration
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { configureGlobalEmail } from '../server/services/global-email-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log for debugging
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
    // Parse request body
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

    // Use the actual GlobalEmailService to save configuration
    const result = await configureGlobalEmail({
      provider,
      email,
      password,
      enabled: enabled !== false // Default to true if not specified
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          provider,
          email,
          enabled: enabled !== false,
          configured: true
        }
      });
    } else {
      return res.status(400).json({
        error: result.message,
        success: false
      });
    }

  } catch (error: any) {
    console.error('Email configuration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}