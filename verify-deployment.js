const https = require('https');

const BASE_URL = 'https://venuinenew-gtuhyu9ws-yonasfasils-projects.vercel.app';

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

async function testDeployment() {
  console.log('🔍 Testing deployment:', BASE_URL);
  console.log('=====================================\n');

  // Test 1: Main application
  console.log('1. Testing main application...');
  try {
    const response = await makeRequest('/');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    if (!response.success) {
      console.log(`   Body: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 2: Test API endpoint
  console.log('\n2. Testing /api/test endpoint...');
  try {
    const response = await makeRequest('/api/test');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    if (response.success) {
      console.log(`   Response: ${response.body}`);
    } else {
      console.log(`   Error body: ${response.body.substring(0, 200)}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 3: Super admin login (GET - should return 405)
  console.log('\n3. Testing super admin login GET (should return 405)...');
  try {
    const response = await makeRequest('/api/super-admin/login', 'GET');
    console.log(`   Status: ${response.status}`);
    console.log(`   Expected 405: ${response.status === 405 ? '✅' : '❌'}`);
    if (response.body) {
      console.log(`   Response: ${response.body}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 4: Super admin login POST (should work)
  console.log('\n4. Testing super admin login POST...');
  try {
    const loginData = {
      username: 'superadmin',
      password: 'VenueAdmin2024!'
    };
    const response = await makeRequest('/api/super-admin/login', 'POST', loginData);
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    console.log(`   Response: ${response.body}`);
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 5: Simple super admin login POST  
  console.log('\n5. Testing simple super admin login POST...');
  try {
    const loginData = {
      username: 'superadmin',
      password: 'VenueAdmin2024!'
    };
    const response = await makeRequest('/api/super-admin/login-simple', 'POST', loginData);
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    console.log(`   Response: ${response.body}`);
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Deployment test completed!');
}

testDeployment().catch(console.error);