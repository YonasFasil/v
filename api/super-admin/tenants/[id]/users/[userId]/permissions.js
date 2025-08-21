const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const { id: tenantId, userId } = req.query;
    const { permissions } = req.body;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ message: 'Tenant ID and User ID are required' });
    }
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array' });
    }
    
    // Update user permissions
    const updatedUser = await sql`
      UPDATE users 
      SET 
        permissions = ${JSON.stringify(permissions)},
        updated_at = NOW()
      WHERE id = ${userId} AND tenant_id = ${tenantId}
      RETURNING id, username, name, email, role, permissions, is_active, created_at
    `;
    
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser[0]);
    
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};