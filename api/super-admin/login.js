const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    
    // Connect to database directly
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "Database not configured" });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Query for super admin user
    const users = await sql`
      SELECT id, username, password, name, email, role, permissions 
      FROM users 
      WHERE email = ${email} AND role = 'super_admin' AND is_active = true
      LIMIT 1
    `;
    
    if (users.length === 0) {
      console.log('Super admin user not found with email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const user = users[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for super admin');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions || ['all_permissions']
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('Authentication successful for:', email);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions || ['all_permissions']
      }
    });
    
  } catch (error) {
    console.error("Super admin login error:", error);
    res.status(500).json({ 
      message: "Login failed", 
      error: error.message 
    });
  }
};