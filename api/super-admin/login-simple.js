module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log('Super admin login called with method:', req.method);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Just test if we can get here
  const { username, password } = req.body;
  
  console.log('Login attempt for:', username);
  
  if (username === 'superadmin' && password === 'VenueAdmin2024!') {
    return res.json({
      success: true,
      message: 'Login API is working',
      user: { username: 'superadmin', role: 'super_admin' }
    });
  }
  
  return res.status(401).json({ message: 'Invalid credentials' });
};