const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check tenants table structure
    const tenantColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `;
    
    // Check users table structure  
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    // Check subscription_packages table structure
    const packageColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'subscription_packages'
      ORDER BY ordinal_position
    `;
    
    res.json({
      tables: {
        tenants: tenantColumns,
        users: userColumns,
        subscription_packages: packageColumns
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Schema check error:', error);
    res.status(500).json({
      message: 'Failed to check schema',
      error: error.message
    });
  }
};