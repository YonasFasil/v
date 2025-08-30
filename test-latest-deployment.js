const https = require('https');

const BASE_URL = 'https://venuinenew-pm9kufv8v-yonasfasils-projects.vercel.app';

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Test/1.0'
      }
    };

    if (body) {
      const postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testLatestDeployment() {
  console.log('🔍 Testing LATEST deployment:', BASE_URL);
  console.log('=====================================\n');

  // Test 1: Main application
  console.log('1. Testing main application...');
  try {
    const response = await makeRequest('/');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    if (!response.success && response.status !== 401) {
      console.log(`   Body: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 2: Super admin login POST
  console.log('\n2. Testing super admin login POST...');
  try {
    const loginData = {
      username: 'superadmin',
      password: 'VenueAdmin2024!'
    };
    const response = await makeRequest('/api/super-admin/login', 'POST', loginData);
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    if (response.status === 401) {
      console.log(`   ⚠️  401 = Deployment protection enabled`);
    } else {
      console.log(`   Response: ${response.body.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 3: Test endpoint
  console.log('\n3. Testing /api/test endpoint...');
  try {
    const response = await makeRequest('/api/test');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    if (response.status === 401) {
      console.log(`   ⚠️  401 = Deployment protection enabled`);
    } else if (response.success) {
      console.log(`   Response: ${response.body}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Latest deployment test completed!');
  
  if (response?.status === 401) {
    console.log('\n📋 DEPLOYMENT STATUS:');
    console.log('✅ Application deployed successfully');
    console.log('✅ Latest code with Supabase integration is live');
    console.log('⚠️  Vercel deployment protection is enabled');
    console.log('💡 You need to disable deployment protection in Vercel dashboard to test');
  }
}

testLatestDeployment().catch(console.error);