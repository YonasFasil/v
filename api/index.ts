// Minimal serverless function for Vercel
export default function handler(req: any, res: any) {
  try {
    console.log('Function called:', req.method, req.url);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    if (req.url === '/health' || req.url === '/api/health') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        hasDatabase: !!process.env.DATABASE_URL,
        method: req.method,
        url: req.url
      });
      return;
    }
    
    if (req.url === '/super-admin/login' && req.method === 'POST') {
      res.status(200).json({
        message: 'Login endpoint reached',
        hasDatabase: !!process.env.DATABASE_URL,
        body: req.body || 'No body'
      });
      return;
    }
    
    res.status(404).json({ 
      message: 'Endpoint not found',
      url: req.url,
      method: req.method 
    });
    
  } catch (error: any) {
    console.error('Function error:', error);
    res.status(500).json({ 
      error: 'Function crashed',
      message: error.message 
    });
  }
}