const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { getDatabaseUrl } = require('../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  let pool;
  
  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    const { action, tenantId, userId } = req.query;
    
    // Route based on action parameter or path
    if (req.method === 'GET' && !action) {
      // Get all tenants
      const result = await pool.query(`
        SELECT 
          t.id, t.name, t.slug, t.subscription_package_id,
          t.status, t.stripe_customer_id,
          t.created_at, sp.name as package_name,
          sp.price as package_price, COUNT(u.id) as user_count
        FROM tenants t
        LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
        LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
        GROUP BY t.id, sp.id, sp.name, sp.price
        ORDER BY t.created_at DESC
      `);
      return res.json(result.rows);
      
    } else if (req.method === 'GET' && action === 'tenant' && tenantId) {
      // Get single tenant
      const result = await pool.query(`
        SELECT t.*, sp.name as package_name, sp.price as package_price,
               COUNT(u.id) as user_count
        FROM tenants t
        LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
        LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = true
        WHERE t.id = $1
        GROUP BY t.id, sp.id, sp.name, sp.price
      `, [tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      return res.json(result.rows[0]);
      
    } else if (req.method === 'GET' && action === 'users' && tenantId) {
      // Get tenant users
      const result = await pool.query(`
        SELECT id, username, name, email, role, permissions, 
               is_active, last_login, created_at
        FROM users 
        WHERE tenant_id = $1
        ORDER BY created_at DESC
      `, [tenantId]);
      return res.json(result.rows);
      
    } else if (req.method === 'POST' && (action === 'create' || !action)) {
      // Create tenant
      const { name, slug, subscriptionPackageId, subscriptionStatus = 'trial', adminUser } = req.body;
      
      if (!name || !slug || !adminUser?.email || !adminUser?.password) {
        return res.status(400).json({ message: 'Name, slug, and admin user details are required' });
      }
      
      // Check if slug already exists
      console.log('Checking if slug exists:', slug);
      const existingResult = await pool.query(`
        SELECT id FROM tenants WHERE slug = $1
      `, [slug]);
      
      console.log('Slug check result:', { 
        slug, 
        existingCount: existingResult.rows.length, 
        existing: existingResult.rows 
      });
      
      if (existingResult.rows.length > 0) {
        console.log('Slug already exists:', slug, existingResult.rows[0]);
        return res.status(400).json({ 
          message: 'Slug already exists',
          existingTenant: existingResult.rows[0]
        });
      }
      
      // Get a default subscription package if none provided
      let finalPackageId = subscriptionPackageId;
      if (!finalPackageId) {
        console.log('No subscription package ID provided, getting default...');
        const defaultPackageResult = await pool.query(`
          SELECT id FROM subscription_packages 
          WHERE is_active = true 
          ORDER BY sort_order ASC, created_at ASC 
          LIMIT 1
        `);
        
        if (defaultPackageResult.rows.length > 0) {
          finalPackageId = defaultPackageResult.rows[0].id;
          console.log('Using default subscription package:', finalPackageId);
        } else {
          console.log('No subscription packages found, creating tenant without package...');
          // We'll need to handle this case
        }
      }
      
      // Create tenant
      console.log('Creating tenant with package ID:', finalPackageId);
      const tenantResult = await pool.query(`
        INSERT INTO tenants (
          name, slug, subscription_package_id, status, created_at
        ) VALUES (
          $1, $2, $3, $4, NOW()
        ) RETURNING *
      `, [name, slug, finalPackageId, subscriptionStatus]);
      
      const tenantId = tenantResult.rows[0].id;
      const hashedPassword = await bcrypt.hash(adminUser.password, 12);
      
      // Create admin user
      const userResult = await pool.query(`
        INSERT INTO users (
          username, password, name, email, tenant_id, role, 
          permissions, is_active, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true, NOW()
        ) RETURNING id, username, name, email, role
      `, [
        adminUser.username || adminUser.email.split('@')[0], 
        hashedPassword,
        adminUser.name || 'Admin User', 
        adminUser.email, 
        tenantId,
        'tenant_admin', 
        JSON.stringify(["view_dashboard","manage_events","view_events","manage_customers","view_customers","manage_venues","view_venues","manage_payments","view_payments","manage_proposals","view_proposals","manage_settings","view_reports","manage_leads","use_ai_features","dashboard","users","venues","bookings","customers","proposals","tasks","payments","settings"])
      ]);
      
      return res.status(201).json({
        tenant: tenantResult.rows[0],
        adminUser: userResult.rows[0],
        message: 'Tenant and admin user created successfully'
      });
      
    } else if (req.method === 'POST' && action === 'createUser' && tenantId) {
      // Create user for tenant
      const { username, name, email, password, role = 'tenant_user' } = req.body;
      
      if (!username || !name || !email || !password) {
        return res.status(400).json({ message: 'Username, name, email, and password are required' });
      }
      
      const existingResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await pool.query(`
        INSERT INTO users (
          username, password, name, email, tenant_id, role,
          permissions, is_active, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true, NOW()
        ) RETURNING id, username, name, email, role, permissions, is_active, created_at
      `, [username, hashedPassword, name, email, tenantId, role, JSON.stringify(["basic_permissions"])]);
      
      return res.status(201).json(result.rows[0]);
      
    } else if (req.method === 'PUT' && action === 'tenant' && tenantId) {
      // Update tenant
      const { name, slug, subscriptionPackageId, subscriptionStatus } = req.body;
      
      const result = await pool.query(`
        UPDATE tenants 
        SET name = COALESCE($1, name), slug = COALESCE($2, slug),
            subscription_package_id = COALESCE($3, subscription_package_id),
            status = COALESCE($4, status), created_at = NOW()
        WHERE id = $5 RETURNING *
      `, [name, slug, subscriptionPackageId, subscriptionStatus, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      return res.json(result.rows[0]);
      
    } else if (req.method === 'PUT' && action === 'user' && tenantId && userId) {
      // Update user
      const { name, email, role, permissions } = req.body;
      
      const result = await pool.query(`
        UPDATE users 
        SET name = COALESCE($1, name), email = COALESCE($2, email),
            role = COALESCE($3, role), 
            permissions = COALESCE($4, permissions),
            created_at = NOW()
        WHERE id = $5 AND tenant_id = $6
        RETURNING id, username, name, email, role, permissions, is_active, created_at
      `, [name, email, role, permissions ? JSON.stringify(permissions) : null, userId, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(result.rows[0]);
      
    } else if (req.method === 'PUT' && action === 'permissions' && tenantId && userId) {
      // Update user permissions
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Permissions must be an array' });
      }
      
      const result = await pool.query(`
        UPDATE users 
        SET permissions = $1, created_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING id, username, name, email, role, permissions, is_active, created_at
      `, [JSON.stringify(permissions), userId, tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(result.rows[0]);
      
    } else if (req.method === 'DELETE' && action === 'tenant' && tenantId) {
      // Change tenant status to suspended
      const result = await pool.query(`
        UPDATE tenants SET status = 'suspended', created_at = NOW()
        WHERE id = $1 RETURNING *
      `, [tenantId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      return res.json({ message: 'Tenant suspended successfully' });
      
    } else if (req.method === 'DELETE' && action === 'user' && tenantId && userId) {
      // Deactivate user
      const result = await pool.query(`
        UPDATE users SET is_active = false, created_at = NOW()
        WHERE id = $1 AND tenant_id = $2 RETURNING *
      `, [userId, tenantId]);
      
      if (result.rows.length === 0) {
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
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};