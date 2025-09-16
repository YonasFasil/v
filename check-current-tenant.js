const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkCurrentTenant() {
  try {
    console.log('=== CHECKING CURRENT TENANT SETUP ===');

    // Get all tenants and their packages
    const tenants = await pool.query(`
      SELECT
        t.id, t.name, t.slug,
        sp.name as package_name,
        sp.features,
        sp.max_venues, sp.max_users
      FROM tenants t
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
      ORDER BY t.created_at DESC
    `);

    console.log('Current tenants:');
    tenants.rows.forEach((tenant, i) => {
      const features = JSON.parse(tenant.features || '[]');
      console.log(`${i + 1}. ${tenant.name} (slug: ${tenant.slug})`);
      console.log(`   Package: ${tenant.package_name || 'None'}`);
      console.log(`   Features: ${features.length} total`);
      console.log(`   ID: ${tenant.id}`);
      console.log('');
    });

    // Test the first tenant (most recent)
    if (tenants.rows.length > 0) {
      const testTenant = tenants.rows[0];
      console.log(`Testing API for: ${testTenant.name}`);

      const tenantHandler = require('./api/tenant-features.js');
      const mockReq = { method: 'GET', query: { tenantId: testTenant.id } };
      const mockRes = {
        _data: null, _status: 200, _headers: {},
        setHeader: function(k, v) { this._headers[k] = v; },
        status: function(c) { this._status = c; return this; },
        json: function(d) { this._data = d; return this; },
        end: function() { return this; }
      };

      await tenantHandler(mockReq, mockRes);

      if (mockRes._status === 200 && mockRes._data?.success) {
        console.log('✅ API Response successful');
        console.log('Package:', mockRes._data.package.name);
        console.log('Features enabled:', mockRes._data.features.summary.enabled, '/', mockRes._data.features.summary.total);
        console.log('Sidebar permissions:', mockRes._data.sidebarPermissions.join(', '));
      } else {
        console.log('❌ API failed:', mockRes._status, mockRes._data);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCurrentTenant();