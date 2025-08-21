const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check existing subscription packages
    const packages = await sql`
      SELECT id, name, description, price, billing_interval, 
             trial_days, max_venues, max_users, max_bookings_per_month,
             features, is_active, sort_order, created_at
      FROM subscription_packages 
      ORDER BY created_at DESC
    `;
    
    // Check table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'subscription_packages'
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