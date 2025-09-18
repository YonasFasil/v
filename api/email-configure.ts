export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      message: `Method ${req.method} not allowed. Only POST is supported.`
    });
  }

  return res.status(200).json({
    message: "Email configuration endpoint working!",
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
}