const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const { id: tenantId } = req.query;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    if (req.method === 'GET') {
      // Get all users for this tenant
      const users = await sql`
        SELECT 
          id, username, name, email, role, permissions, 
          is_active, last_login_at, created_at
        FROM users 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      
      res.json(users);
      
    } else if (req.method === 'POST') {
      // Create new user for this tenant
      const {
        username,
        name,
        email,
        password,
        role = 'tenant_user'
      } = req.body;
      
      if (!username || !name || !email || !password) {
        return res.status(400).json({ 
          message: 'Username, name, email, and password are required' 
        });
      }
      
      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;
      
      if (existingUser.length > 0) {
        return res.status(400).json({ 
          message: 'User with this email already exists' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const newUser = await sql`
        INSERT INTO users (
          username, password, name, email, tenant_id, role,
          permissions, is_active, created_at
        ) VALUES (
          ${username}, ${hashedPassword}, ${name}, ${email}, ${tenantId}, ${role},
          '["basic_permissions"]', true, NOW()
        )
        RETURNING id, username, name, email, role, permissions, is_active, created_at
      `;
      
      res.status(201).json(newUser[0]);
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Tenant users API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};