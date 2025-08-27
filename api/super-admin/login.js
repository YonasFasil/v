const { Pool } = require('pg');
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
    // Parse request body for serverless function
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Parsed body:', body);
    
    const { email, password } = body;
    
    console.log('Extracted email:', email);
    console.log('Extracted password length:', password ? password.length : 'undefined');
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    console.log('Super admin login attempt for:', email);
    
    // Connect to database directly
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "Database not configured" });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Query for super admin user
    const result = await pool.query(`
      SELECT id, username, password, name, email, role, permissions 
      FROM users 
      WHERE email = $1 AND role = 'super_admin' AND is_active = true
      LIMIT 1
    `, [email]);
    
    await pool.end();
    
    if (result.rows.length === 0) {
      console.log('Super admin user not found with email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for super admin');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }
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