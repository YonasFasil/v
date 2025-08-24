const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const BASE_URL = 'http://localhost:5006';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function testFeatureAccess() {
  try {
    console.log('🧪 Testing Feature Access Control System\n');

    // Get current tenant package info
    const tenantResult = await pool.query(`
      SELECT t.name, t.slug, sp.name as package_name, sp.features 
      FROM tenants t 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id 
      WHERE t.slug = 'test'
    `);

    const tenant = tenantResult.rows[0];
    console.log(`🏢 Tenant: ${tenant.name}`);
    console.log(`📦 Current Package: ${tenant.package_name}`);
    console.log(`✅ Enabled Features: ${tenant.features ? tenant.features.join(', ') : 'None'}\n`);

    // Test routes that should work
    console.log('📋 TESTING ROUTES:\n');

    const testRoutes = [
      {
        route: '/api/ai/analytics',
        feature: 'ai_analytics',
        description: 'AI Analytics'
      },
      {
        route: '/api/reports/analytics',
        feature: 'advanced_reports', 
        description: 'Advanced Reports'
      },
      {
        route: '/api/ai/process-voice-booking',
        feature: 'voice_booking',
        method: 'POST',
        body: { transcript: 'test booking' },
        description: 'Voice Booking'
      }
    ];

    // First, we need to login to get an auth token
    console.log('🔐 Logging in to get auth token...');
    
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

    // Test each route
    for (const test of testRoutes) {
      const hasFeature = tenant.features && tenant.features.includes(test.feature);
      const shouldWork = hasFeature;

      console.log(`🔍 Testing ${test.description} (${test.route})`);
      console.log(`   Feature required: ${test.feature}`);
      console.log(`   Has feature: ${hasFeature ? '✅' : '❌'}`);
      console.log(`   Expected result: ${shouldWork ? 'SUCCESS' : 'BLOCKED (403)'}`);

      try {
        const config = {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        };

        let response;
        if (test.method === 'POST') {
          response = await axios.post(`${BASE_URL}${test.route}`, test.body || {}, config);
        } else {
          response = await axios.get(`${BASE_URL}${test.route}`, config);
        }

        if (shouldWork) {
          console.log(`   ✅ PASSED - Route worked as expected (${response.status})`);
        } else {
          console.log(`   ⚠️  UNEXPECTED - Route worked but should have been blocked (${response.status})`);
        }

      } catch (error) {
        if (error.response?.status === 403) {
          if (shouldWork) {
            console.log(`   ❌ FAILED - Route blocked but should have worked (403)`);
            console.log(`   Error: ${error.response.data.message}`);
          } else {
            console.log(`   ✅ PASSED - Route correctly blocked (403)`);
            console.log(`   Message: ${error.response.data.message}`);
          }
        } else if (error.response?.status === 401) {
          console.log(`   🔑 AUTH ISSUE - Authentication problem (401)`);
        } else {
          console.log(`   ❓ UNKNOWN - Unexpected error (${error.response?.status || 'No response'})`);
          if (error.response?.data?.message) {
            console.log(`   Error: ${error.response.data.message}`);
          }
        }
      }

      console.log(''); // Empty line between tests
    }

    console.log('🎯 SUMMARY:');
    console.log('- Green ✅ = Test passed as expected');
    console.log('- Red ❌ = Test failed (feature access not working correctly)'); 
    console.log('- Yellow ⚠️ = Unexpected behavior (needs investigation)');
    console.log('\n💡 Use "node scripts/switch-package.js" to test different packages');

  } catch (error) {
    console.error('❌ Testing Error:', error.message);
  } finally {
    await pool.end();
  }
}

testFeatureAccess();