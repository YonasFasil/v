const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    const {
      name,
      slug,
      subdomain,
      subscriptionPackageId,
      subscriptionStatus = 'trial',
      adminUser
    } = req.body;
    
    if (!name || !slug || !adminUser?.email || !adminUser?.password) {
      return res.status(400).json({ 
        message: 'Name, slug, and admin user details are required' 
      });
    }
    
    // Check if slug or subdomain already exists
    const existingTenant = await sql`
      SELECT id FROM tenants 
      WHERE slug = ${slug} OR subdomain = ${subdomain}
    `;
    
    if (existingTenant.length > 0) {
      return res.status(400).json({ 
        message: 'Slug or subdomain already exists' 
      });
    }
    
    // Create tenant
    const newTenant = await sql`
      INSERT INTO tenants (
        name, slug, subdomain, subscription_package_id, 
        subscription_status, trial_ends_at, is_active, created_at
      ) VALUES (
        ${name}, ${slug}, ${subdomain}, ${subscriptionPackageId},
        ${subscriptionStatus}, 
        ${subscriptionStatus === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null},
        true, NOW()
      )
      RETURNING *
    `;
    
    const tenantId = newTenant[0].id;
    
    // Hash admin password
    const hashedPassword = await bcrypt.hash(adminUser.password, 12);
    
    // Create admin user
    const newAdminUser = await sql`
      INSERT INTO users (
        username, password, name, email, tenant_id, role, 
        permissions, is_active, created_at
      ) VALUES (
        ${adminUser.username || adminUser.email.split('@')[0]},
        ${hashedPassword},
        ${adminUser.name || 'Admin User'},
        ${adminUser.email},
        ${tenantId},
        'tenant_admin',
        '["all_tenant_permissions"]',
        true,
        NOW()
      )
      RETURNING id, username, name, email, role
    `;
    
    res.status(201).json({
      tenant: newTenant[0],
      adminUser: newAdminUser[0],
      message: 'Tenant and admin user created successfully'
    });
    
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ 
      message: 'Failed to create tenant', 
      error: error.message 
    });
  }
};