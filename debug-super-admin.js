const https = require('https');

async function testSuperAdminLogin() {
  console.log('🔧 Debugging Super Admin Login...\n');
  
  const BASE_URL = 'https://venuinenew-pm9kufv8v-yonasfasils-projects.vercel.app';
  
  // Test different endpoints
  const tests = [
    {
      name: 'GET /api/super-admin/login (should return 405)',
      method: 'GET',
      path: '/api/super-admin/login'
    },
    {
      name: 'POST /api/super-admin/login (should work)',
      method: 'POST',
      path: '/api/super-admin/login',
      body: {
        username: 'superadmin',
        password: 'VenueAdmin2024!'
      }
    },
    {
      name: 'OPTIONS /api/super-admin/login (should return 200)',
      method: 'OPTIONS',
      path: '/api/super-admin/login'
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 ${test.name}`);
    
    try {
      const result = await makeRequest(BASE_URL + test.path, test.method, test.body);
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Headers:`, JSON.stringify(result.headers, null, 2));
      
      if (result.body && result.body.length < 500) {
        console.log(`   Body: ${result.body}`);
      } else if (result.body) {
        console.log(`   Body: ${result.body.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Test/1.0'
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
          body: data
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

testSuperAdminLogin().catch(console.error);