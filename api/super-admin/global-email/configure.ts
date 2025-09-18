import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { provider, email, password, enabled } = req.body;

    // Validate required fields
    if (!provider || !email) {
      return res.status(400).json({ message: "Provider and email are required" });
    }

    if (provider === 'gmail' && !password) {
      return res.status(400).json({ message: "App password is required for Gmail" });
    }

    // For now, just return success to test if the route works
    return res.json({
      message: "Global email configuration updated successfully (TEST)",
      configured: true,
      provider: provider,
      testMode: true,
      receivedData: { provider, email, enabled }
    });

  } catch (error: any) {
    console.error("Error configuring global email:", error);
    return res.status(500).json({
      message: "Failed to configure global email",
      error: error.message
    });
  }
}