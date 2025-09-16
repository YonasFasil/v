const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = new Pool({
    connectionString: getDatabaseUrl()
  });

  try {
    console.log('📦 Package upgrade API called');

    const { packageId, tenantId } = req.body;

    if (!packageId || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Package ID and Tenant ID are required'
      });
    }

    console.log(`🔄 Upgrading tenant ${tenantId} to package ${packageId}`);

    // First, verify the package exists and is active
    const packageResult = await pool.query(`
      SELECT id, name, price, features, max_venues, max_users, max_bookings_per_month, max_spaces
      FROM subscription_packages
      WHERE id = $1 AND is_active = true
    `, [packageId]);

    if (packageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Package not found or not active'
      });
    }

    const targetPackage = packageResult.rows[0];

    // Verify the tenant exists
    const tenantResult = await pool.query(`
      SELECT id, name, subscription_package_id
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    const tenant = tenantResult.rows[0];

    // Check if tenant is already on this package
    if (tenant.subscription_package_id === packageId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant is already on this package'
      });
    }

    // Update the tenant's subscription package
    const updateResult = await pool.query(`
      UPDATE tenants
      SET subscription_package_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, subscription_package_id
    `, [packageId, tenantId]);

    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update tenant package'
      });
    }

    const updatedTenant = updateResult.rows[0];

    console.log(`✅ Successfully upgraded tenant ${tenant.name} to package ${targetPackage.name}`);

    // Return success response with updated information
    res.json({
      success: true,
      message: `Successfully upgraded to ${targetPackage.name}`,
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        subscriptionPackageId: updatedTenant.subscription_package_id
      },
      package: {
        id: targetPackage.id,
        name: targetPackage.name,
        price: parseFloat(targetPackage.price),
        features: targetPackage.features,
        limits: {
          maxVenues: targetPackage.max_venues,
          maxUsers: targetPackage.max_users,
          maxBookingsPerMonth: targetPackage.max_bookings_per_month,
          maxSpaces: targetPackage.max_spaces
        }
      }
    });

  } catch (error) {
    console.error('❌ Package upgrade API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade package',
      details: error.message
    });
  } finally {
    await pool.end();
  }
};