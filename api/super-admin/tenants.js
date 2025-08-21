const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const { action, tenantId, userId } = req.query;
    
    // Route based on action parameter or path
    if (req.method === 'GET' && !action) {
      // Get all tenants
      const tenants = await sql`
        SELECT 
          t.id, t.name, t.slug, t.subscription_package_id,
          t.subscription_status, t.trial_ends_at, t.stripe_customer_id,
          t.is_active, t.created_at, sp.name as package_name,
          sp.price as package_price, COUNT(u.id) as user_count
        FROM tenants t
        LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
        LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
        GROUP BY t.id, sp.id, sp.name, sp.price
        ORDER BY t.created_at DESC
      `;
      return res.json(tenants);
      
    } else if (req.method === 'GET' && action === 'tenant' && tenantId) {
      // Get single tenant
      const tenants = await sql`
        SELECT t.*, sp.name as package_name, sp.price as package_price,
               COUNT(u.id) as user_count
        FROM tenants t
        LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
        LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
        WHERE t.id = ${tenantId}
        GROUP BY t.id, sp.id, sp.name, sp.price
      `;
      
      if (tenants.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      return res.json(tenants[0]);
      
    } else if (req.method === 'GET' && action === 'users' && tenantId) {
      // Get tenant users
      const users = await sql`
        SELECT id, username, name, email, role, permissions, 
               is_active, last_login_at, created_at
        FROM users 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      return res.json(users);
      
    } else if (req.method === 'POST' && action === 'create') {
      // Create tenant
      const { name, slug, subscriptionPackageId, subscriptionStatus = 'trial', adminUser } = req.body;
      
      if (!name || !slug || !adminUser?.email || !adminUser?.password) {
        return res.status(400).json({ message: 'Name, slug, and admin user details are required' });
      }
      
      // Check if slug already exists
      const existingTenant = await sql`
        SELECT id FROM tenants WHERE slug = ${slug}
      `;
      
      if (existingTenant.length > 0) {
        return res.status(400).json({ message: 'Slug already exists' });
      }
      
      // Create tenant
      const newTenant = await sql`
        INSERT INTO tenants (
          name, slug, subscription_package_id, subscription_status, 
          trial_ends_at, is_active, created_at
        ) VALUES (
          ${name}, ${slug}, ${subscriptionPackageId}, ${subscriptionStatus}, 
          ${subscriptionStatus === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null},
          true, NOW()
        ) RETURNING *
      `;
      
      const tenantId = newTenant[0].id;
      const hashedPassword = await bcrypt.hash(adminUser.password, 12);
      
      // Create admin user
      const newAdminUser = await sql`
        INSERT INTO users (
          username, password, name, email, tenant_id, role, 
          permissions, is_active, created_at
        ) VALUES (
          ${adminUser.username || adminUser.email.split('@')[0]}, ${hashedPassword},
          ${adminUser.name || 'Admin User'}, ${adminUser.email}, ${tenantId},
          'tenant_admin', '["all_tenant_permissions"]', true, NOW()
        ) RETURNING id, username, name, email, role
      `;
      
      return res.status(201).json({
        tenant: newTenant[0],
        adminUser: newAdminUser[0],
        message: 'Tenant and admin user created successfully'
      });
      
    } else if (req.method === 'POST' && action === 'createUser' && tenantId) {
      // Create user for tenant
      const { username, name, email, password, role = 'tenant_user' } = req.body;
      
      if (!username || !name || !email || !password) {
        return res.status(400).json({ message: 'Username, name, email, and password are required' });
      }
      
      const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = await sql`
        INSERT INTO users (
          username, password, name, email, tenant_id, role,
          permissions, is_active, created_at
        ) VALUES (
          ${username}, ${hashedPassword}, ${name}, ${email}, ${tenantId}, ${role},
          '["basic_permissions"]', true, NOW()
        ) RETURNING id, username, name, email, role, permissions, is_active, created_at
      `;
      
      return res.status(201).json(newUser[0]);
      
    } else if (req.method === 'PUT' && action === 'tenant' && tenantId) {
      // Update tenant
      const { name, slug, subscriptionPackageId, subscriptionStatus, isActive } = req.body;
      
      const updatedTenant = await sql`
        UPDATE tenants 
        SET name = COALESCE(${name}, name), slug = COALESCE(${slug}, slug),
            subscription_package_id = COALESCE(${subscriptionPackageId}, subscription_package_id),
            subscription_status = COALESCE(${subscriptionStatus}, subscription_status),
            is_active = COALESCE(${isActive}, is_active), updated_at = NOW()
        WHERE id = ${tenantId} RETURNING *
      `;
      
      if (updatedTenant.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      return res.json(updatedTenant[0]);
      
    } else if (req.method === 'PUT' && action === 'user' && tenantId && userId) {
      // Update user
      const { name, email, role, permissions } = req.body;
      
      const updatedUser = await sql`
        UPDATE users 
        SET name = COALESCE(${name}, name), email = COALESCE(${email}, email),
            role = COALESCE(${role}, role), 
            permissions = COALESCE(${JSON.stringify(permissions)}, permissions),
            updated_at = NOW()
        WHERE id = ${userId} AND tenant_id = ${tenantId}
        RETURNING id, username, name, email, role, permissions, is_active, created_at
      `;
      
      if (updatedUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(updatedUser[0]);
      
    } else if (req.method === 'PUT' && action === 'permissions' && tenantId && userId) {
      // Update user permissions
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Permissions must be an array' });
      }
      
      const updatedUser = await sql`
        UPDATE users 
        SET permissions = ${JSON.stringify(permissions)}, updated_at = NOW()
        WHERE id = ${userId} AND tenant_id = ${tenantId}
        RETURNING id, username, name, email, role, permissions, is_active, created_at
      `;
      
      if (updatedUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(updatedUser[0]);
      
    } else if (req.method === 'DELETE' && action === 'tenant' && tenantId) {
      // Deactivate tenant
      const deactivatedTenant = await sql`
        UPDATE tenants SET is_active = false, updated_at = NOW()
        WHERE id = ${tenantId} RETURNING *
      `;
      
      if (deactivatedTenant.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      return res.json({ message: 'Tenant deactivated successfully' });
      
    } else if (req.method === 'DELETE' && action === 'user' && tenantId && userId) {
      // Deactivate user
      const deactivatedUser = await sql`
        UPDATE users SET is_active = false, updated_at = NOW()
        WHERE id = ${userId} AND tenant_id = ${tenantId} RETURNING *
      `;
      
      if (deactivatedUser.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ message: 'User deactivated successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed or invalid action' });
    }
    
  } catch (error) {
    console.error('Tenants API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};