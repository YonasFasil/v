const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const { id: tenantId, userId } = req.query;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Tenant ID and User ID are required' });
    }
    
    if (req.method === 'GET') {
      // Get single user
      const users = await sql`
        SELECT 
          id, username, name, email, role, permissions, 
          is_active, last_login_at, created_at
        FROM users 
        WHERE id = ${userId} AND tenant_id = ${tenantId}
      `;
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(users[0]);
      
    } else if (req.method === 'PUT') {
      // Update user
      const { name, email, role, permissions } = req.body;
      
      const updatedUser = await sql`
        UPDATE users 
        SET 
          name = COALESCE(${name}, name),
          email = COALESCE(${email}, email),
          role = COALESCE(${role}, role),
          permissions = COALESCE(${JSON.stringify(permissions)}, permissions),
          updated_at = NOW()
        WHERE id = ${userId} AND tenant_id = ${tenantId}
        RETURNING id, username, name, email, role, permissions, is_active, created_at
      `;
      
      if (updatedUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(updatedUser[0]);
      
    } else if (req.method === 'DELETE') {
      // Deactivate user (soft delete)
      const deactivatedUser = await sql`
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${userId} AND tenant_id = ${tenantId}
        RETURNING *
      `;
      
      if (deactivatedUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'User deactivated successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('User operation error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};