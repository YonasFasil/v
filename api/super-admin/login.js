module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    console.log('Super admin login attempt for:', email);
    
    // Import authentication function
    const { authenticateSuperAdmin } = require('../server/middleware/auth');
    const result = await authenticateSuperAdmin(email, password);
    
    if (!result) {
      console.log('Authentication failed for:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    console.log('Authentication successful for:', email);
    res.json(result);
    
  } catch (error) {
    console.error("Super admin login error:", error);
    res.status(500).json({ 
      message: "Login failed", 
      error: error.message 
    });
  }
};