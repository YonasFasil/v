// Vercel Serverless Function for Email Configuration
export default function handler(req, res) {
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

    // For now, return success (we'll implement actual email service later)
    return res.status(200).json({
      success: true,
      message: 'Email configuration saved successfully',
      data: {
        provider,
        email,
        enabled: enabled || false,
        configured: true
      }
    });

  } catch (error) {
    console.error('Email configuration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}