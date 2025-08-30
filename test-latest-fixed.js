const https = require('https');

const BASE_URL = 'https://venuinenew-avrby1dl8-yonasfasils-projects.vercel.app';

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
        'User-Agent': 'Test-Fixed/1.0'
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

async function testFixedDeployment() {
  console.log('🔍 Testing FIXED deployment:', BASE_URL);
  console.log('=====================================\n');

  // Test super admin login POST
  console.log('🧪 Testing super admin login POST...');
  try {
    const loginData = {
      username: 'superadmin',
      password: 'VenueAdmin2024!'
    };
    const response = await makeRequest('/api/super-admin/login', 'POST', loginData);
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    
    if (response.success) {
      console.log(`   🎉 SUPER ADMIN LOGIN WORKING!`);
      try {
        const result = JSON.parse(response.body);
        console.log(`   User: ${result.user?.name || 'Unknown'}`);
        console.log(`   Role: ${result.user?.role || 'Unknown'}`);
      } catch (e) {
        console.log(`   Response: ${response.body.substring(0, 100)}...`);
      }
    } else {
      console.log(`   Error: ${response.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test regular API endpoint
  console.log('\n🧪 Testing /api/test...');
  try {
    const response = await makeRequest('/api/test');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Fixed deployment test completed!');
}

testFixedDeployment().catch(console.error);