const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'DATABASE_URL not configured' 
      });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Test database connection
    const result = await sql`SELECT 1 as test`;
    
    // Check if super admin user exists
    const users = await sql`
      SELECT id, email, role 
      FROM users 
      WHERE role = 'super_admin' 
      LIMIT 1
    `;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      superAdminExists: users.length > 0,
      superAdminEmail: users.length > 0 ? users[0].email : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      database: 'failed'
    });
  }
};