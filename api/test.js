// Plain JavaScript Vercel serverless function
export default function handler(req, res) {
  console.log('Test function called');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    message: 'Test function working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    hasEnv: !!process.env.DATABASE_URL
  });
}