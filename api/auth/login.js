const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { requireEnv } = require('../../server/utils/requireEnv');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    
    console.log('Tenant login attempt for:', email);
    
    // Connect to database
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "Database not configured" });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Query for tenant user (not super admin)
    const result = await pool.query(`
      SELECT u.id, u.username, u.password, u.name, u.email, u.role, u.permissions, u.tenant_id,
             t.id as tenant_id_ref, t.name as tenant_name, t.slug as tenant_slug, t.status as tenant_status
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = $1 AND u.is_active = true AND u.role != 'super_admin'
      LIMIT 1
    `, [email]);
    
    await pool.end();
    
    if (result.rows.length === 0) {
      console.log('Tenant user not found with email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const user = result.rows[0];
    
    // Check if tenant is active
    if (!user.tenant_id_ref) {
      console.log('User has no tenant assigned');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    if (user.tenant_status === 'suspended' || user.tenant_status === 'cancelled') {
      console.log('Tenant account is suspended/cancelled');
      return res.status(403).json({ message: "Account suspended. Please contact support." });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('Invalid password for user');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const jwtSecret = requireEnv('JWT_SECRET');
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantSlug: user.tenant_slug,
        permissions: user.permissions || ['basic_permissions']
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
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantSlug: user.tenant_slug,
        permissions: user.permissions || ['basic_permissions']
      }
    });
    
  } catch (error) {
    console.error("Tenant login error:", error);
    res.status(500).json({ 
      message: "Login failed", 
      error: error.message 
    });
  }
};