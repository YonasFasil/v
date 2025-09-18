import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[EMAIL-CONFIGURE-DIRECT] Function started');
  console.log('[EMAIL-CONFIGURE-DIRECT] Method:', req.method);
  console.log('[EMAIL-CONFIGURE-DIRECT] Headers:', JSON.stringify(req.headers, null, 2));
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('[EMAIL-CONFIGURE-DIRECT] Route hit:', req.method, req.url);
  console.log('[EMAIL-CONFIGURE-DIRECT] Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({
      message: `Method ${req.method} not allowed. Only POST is supported.`,
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('[EMAIL-CONFIGURE-DIRECT] Raw body:', req.body);
    console.log('[EMAIL-CONFIGURE-DIRECT] Body type:', typeof req.body);

    const { provider, email, password, enabled } = req.body || {};

    console.log('[EMAIL-CONFIGURE-DIRECT] Extracted values:', { provider, email, password: password ? '***' : 'none', enabled });

    // Validate required fields
    if (!provider || !email) {
      console.log('[EMAIL-CONFIGURE-DIRECT] Validation failed - missing required fields');
      return res.status(400).json({
        message: "Provider and email are required",
        received: { provider, email, hasPassword: !!password, enabled }
      });
    }

    if (provider === 'gmail' && !password) {
      console.log('[EMAIL-CONFIGURE-DIRECT] Validation failed - Gmail needs password');
      return res.status(400).json({ message: "App password is required for Gmail" });
    }

    console.log('[EMAIL-CONFIGURE-DIRECT] Validation passed, returning success');

    // For now, just return success to test if the route works
    return res.status(200).json({
      message: "Global email configuration updated successfully (TEST)",
      configured: true,
      provider: provider,
      testMode: true,
      receivedData: { provider, email, enabled }
    });

  } catch (error: any) {
    console.error('[EMAIL-CONFIGURE-DIRECT] Error:', error);
    console.error('[EMAIL-CONFIGURE-DIRECT] Error stack:', error.stack);
    return res.status(500).json({
      message: "Failed to configure global email",
      error: error.message,
      stack: error.stack
    });
  }
}