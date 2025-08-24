const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const BASE_URL = 'http://localhost:5006';
const TENANT_SLUG = 'test';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function testTenantFeatureAccess() {
  try {
    console.log('🧪 Testing Tenant-Specific Feature Access Control\n');

    // Get current tenant package info
    const tenantResult = await pool.query(`
      SELECT t.name, t.slug, sp.name as package_name, sp.features 
      FROM tenants t 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id 
      WHERE t.slug = 'test'
    `);

    const tenant = tenantResult.rows[0];
    console.log(`🏢 Tenant: ${tenant.name} (/${tenant.slug})`);
    console.log(`📦 Current Package: ${tenant.package_name}`);
    console.log(`✅ Enabled Features: ${tenant.features ? tenant.features.join(', ') : 'None'}`);
    console.log(`🌍 Testing URL: ${BASE_URL}/${TENANT_SLUG}\n`);

    // Login to get auth token
    console.log('🔐 Logging in...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'yonasfasil.sl@gmail.com',
        password: 'VenueAdmin2024!'
      });
      
      authToken = loginResponse.data.token;
      console.log('✅ Login successful\n');
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test tenant-specific routes
    const testRoutes = [
      {
        route: `/api/tenant/${TENANT_SLUG}/features`,
        description: 'Get Tenant Features (should always work)',
        feature: null,
        expectSuccess: true
      },
      {
        route: `/api/ai/analytics`,
        description: 'AI Analytics',
        feature: 'ai_analytics',
        requiresTenant: true
      },
      {
        route: `/api/reports/analytics`,
        description: 'Advanced Reports', 
        feature: 'advanced_reports',
        requiresTenant: true
      },
      {
        route: `/api/ai/process-voice-booking`,
        description: 'Voice Booking',
        feature: 'voice_booking',
        method: 'POST',
        body: { transcript: 'test booking for tomorrow at 2pm' },
        requiresTenant: true
      }
    ];

    console.log('📋 TESTING ROUTES:\n');

    for (const test of testRoutes) {
      const hasFeature = test.feature ? (tenant.features && tenant.features.includes(test.feature)) : true;
      const shouldWork = test.expectSuccess || hasFeature;

      console.log(`🔍 ${test.description}`);
      console.log(`   Route: ${test.route}`);
      if (test.feature) {
        console.log(`   Required Feature: ${test.feature}`);
        console.log(`   Has Feature: ${hasFeature ? '✅' : '❌'}`);
      }
      console.log(`   Expected: ${shouldWork ? 'SUCCESS' : 'BLOCKED (403)'}`);

      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        };

        // Add tenant context to headers for routes that need it
        if (test.requiresTenant) {
          config.headers['x-tenant-slug'] = TENANT_SLUG;
        }

        let response;
        if (test.method === 'POST') {
          response = await axios.post(`${BASE_URL}${test.route}`, test.body || {}, config);
        } else {
          response = await axios.get(`${BASE_URL}${test.route}`, config);
        }

        if (shouldWork) {
          console.log(`   ✅ PASSED - Route accessible (${response.status})`);
          
          // Show special info for features endpoint
          if (test.route.includes('/features')) {
            const features = response.data.features;
            console.log(`   📋 Available Features: ${features.enabled.length}`);
            console.log(`   🚫 Blocked Features: ${features.disabled.length}`);
          }
        } else {
          console.log(`   ⚠️  UNEXPECTED - Route worked but should be blocked (${response.status})`);
        }

      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 403) {
          if (shouldWork) {
            console.log(`   ❌ FAILED - Route blocked but should work (403)`);
            console.log(`   Error: ${message}`);
          } else {
            console.log(`   ✅ PASSED - Route correctly blocked (403)`);
            console.log(`   Block Reason: ${message}`);
          }
        } else if (status === 401) {
          console.log(`   🔑 AUTH ISSUE - Authentication required (401)`);
        } else {
          console.log(`   ❓ UNKNOWN ERROR - Status: ${status || 'No response'}`);
          console.log(`   Error: ${message}`);
        }
      }

      console.log(''); // Empty line
    }

    // Summary
    console.log('🎯 TESTING SUMMARY:');
    console.log(`Current Package: "${tenant.package_name}" has ${tenant.features ? tenant.features.length : 0} optional features`);
    console.log('Default features (always available): Dashboard, Venue Management, Customer Management, Payment Processing');
    console.log('\n💡 To test different packages:');
    console.log('   node scripts/switch-package.js "Basic Test"');
    console.log('   node scripts/switch-package.js "Pro Test"'); 
    console.log('   node scripts/switch-package.js "Enterprise Test"');

  } catch (error) {
    console.error('❌ Testing Error:', error.message);
  } finally {
    await pool.end();
  }
}

testTenantFeatureAccess();