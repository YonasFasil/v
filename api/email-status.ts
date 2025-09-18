// Vercel Serverless Function for Email Status
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGlobalEmailStatus } from '../server/services/global-email-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    // Use the actual GlobalEmailService to get status
    const status = await getGlobalEmailStatus();

    console.log('Email status check:', {
      configured: status.configured,
      provider: status.provider,
      email: status.email ? '***' : null,
      enabled: status.enabled
    });

    return res.status(200).json(status);

  } catch (error: any) {
    console.error('Email status error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}