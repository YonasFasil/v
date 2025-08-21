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
    
    console.log('Creating test tenant...');
    
    // Create test tenant
    const tenantResult = await sql`
      INSERT INTO tenants (
        name, slug, subscription_package_id, status, 
        trial_ends_at, created_at
      ) VALUES (
        'Test Venue Company', 
        'test-venue-company', 
        (SELECT id FROM subscription_packages LIMIT 1),
        'trial', 
        ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()},
        NOW()
      )
      RETURNING *
    `;
    
    console.log('Tenant created:', tenantResult[0]);
    
    const tenantId = tenantResult[0].id;
    
    // Create test admin user
    const hashedPassword = await bcrypt.hash('TestAdmin123!', 12);
    
    const userResult = await sql`
      INSERT INTO users (
        username, password, name, email, tenant_id, role, 
        permissions, is_active, created_at
      ) VALUES (
        'testadmin',
        ${hashedPassword},
        'Test Admin User',
        'test@example.com',
        ${tenantId},
        'tenant_admin',
        '["all_tenant_permissions"]',
        true,
        NOW()
      )
      RETURNING id, username, name, email, role
    `;
    
    console.log('Admin user created:', userResult[0]);
    
    res.json({
      success: true,
      tenant: tenantResult[0],
      adminUser: userResult[0],
      message: 'Test tenant and admin user created successfully'
    });
    
  } catch (error) {
    console.error('Test tenant creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test tenant',
      error: error.message
    });
  }
};