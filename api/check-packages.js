const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check existing packages
    const packages = await sql`
      SELECT id, name, description, category, price, pricing_model, 
             tenant_id, is_active, created_at
      FROM packages 
      ORDER BY created_at DESC
    `;
    
    // Check table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'packages'
      ORDER BY ordinal_position
    `;
    
    res.json({
      existingPackages: packages,
      totalCount: packages.length,
      tableStructure: tableInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Package check error:', error);
    res.status(500).json({
      message: 'Failed to check packages',
      error: error.message
    });
  }
};