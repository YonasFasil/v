const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Get all tenants with user counts and subscription info
    const tenants = await sql`
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.subdomain,
        t.subscription_package_id,
        t.subscription_status,
        t.trial_ends_at,
        t.stripe_customer_id,
        t.is_active,
        t.created_at,
        sp.name as package_name,
        sp.price as package_price,
        COUNT(u.id) as user_count
      FROM tenants t
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
      LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
      GROUP BY t.id, sp.id, sp.name, sp.price
      ORDER BY t.created_at DESC
    `;
    
    res.json(tenants);
    
  } catch (error) {
    console.error('Tenants API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};