export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    message: "Simple test route working",
    method: req.method,
    timestamp: new Date().toISOString()
  });
}