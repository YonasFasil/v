// Ultra simple serverless function
export default function handler(req: any, res: any) {
  console.log('Handler called');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(200).json({
    message: 'Simple function works',
    timestamp: new Date().toISOString(),
    url: req.url,
    env: !!process.env.DATABASE_URL
  });
}