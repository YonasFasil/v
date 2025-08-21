const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if super admin already exists
    const existingAdmin = await sql`
      SELECT id, email FROM users WHERE email = 'admin@yourdomain.com' AND role = 'super_admin'
    `;
    
    if (existingAdmin.length > 0) {
      return res.json({
        message: 'Super admin already exists',
        email: 'admin@yourdomain.com',
        status: 'exists'
      });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('VenueAdmin2024!', 12);
    
    // Create super admin user
    await sql`
      INSERT INTO users (
        id, username, password, name, email, role, permissions, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        'superadmin',
        ${hashedPassword},
        'Super Administrator',
        'admin@yourdomain.com',
        'super_admin',
        '["all_permissions"]',
        true,
        NOW(),
        NOW()
      )
    `;
    
    res.json({
      message: 'Super admin created successfully',
      email: 'admin@yourdomain.com',
      password: 'VenueAdmin2024!',
      status: 'created'
    });
    
  } catch (error) {
    console.error('Super admin initialization error:', error);
    res.status(500).json({
      message: 'Failed to initialize super admin',
      error: error.message
    });
  }
};