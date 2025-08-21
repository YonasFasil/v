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
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    if (req.method === 'GET') {
      // Get single tenant with details
      const tenants = await sql`
        SELECT 
          t.*,
          sp.name as package_name,
          sp.price as package_price,
          COUNT(u.id) as user_count
        FROM tenants t
        LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
        LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
        WHERE t.id = ${id}
        GROUP BY t.id, sp.id, sp.name, sp.price
      `;
      
      if (tenants.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      res.json(tenants[0]);
      
    } else if (req.method === 'PUT') {
      // Update tenant
      const {
        name,
        slug,
        subdomain,
        subscriptionPackageId,
        subscriptionStatus,
        isActive
      } = req.body;
      
      const updatedTenant = await sql`
        UPDATE tenants 
        SET 
          name = COALESCE(${name}, name),
          slug = COALESCE(${slug}, slug),
          subdomain = COALESCE(${subdomain}, subdomain),
          subscription_package_id = COALESCE(${subscriptionPackageId}, subscription_package_id),
          subscription_status = COALESCE(${subscriptionStatus}, subscription_status),
          is_active = COALESCE(${isActive}, is_active),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (updatedTenant.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      res.json(updatedTenant[0]);
      
    } else if (req.method === 'DELETE') {
      // Deactivate tenant (soft delete)
      const deactivatedTenant = await sql`
        UPDATE tenants 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (deactivatedTenant.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      res.json({ message: 'Tenant deactivated successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Tenant operation error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};