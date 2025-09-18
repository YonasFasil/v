export default function handler(req: any, res: any) {
  // Minimal function to test if basic execution works
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({
        message: `Method ${req.method} not allowed. Only POST is supported.`
      });
    }

    // Return minimal success response
    return res.status(200).json({
      message: "BASIC ROUTE WORKING",
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body
    });

  } catch (error) {
    return res.status(500).json({
      message: "Basic function error",
      error: String(error)
    });
  }
}