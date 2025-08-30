const https = require('https');

const BASE_URL = 'https://venuinenew-hmxx4r1mb-yonasfasils-projects.vercel.app';

async function testRoute(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'SPA-Fixed-Test/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path: path,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          isHtml: data.includes('<!DOCTYPE html>') || data.includes('<html'),
          hasReactRoot: data.includes('<div id="root">'),
          body: data.substring(0, 200)
        });
      });
    });

    req.on('error', (err) => {
      reject({ path, error: err.message });
    });
    
    req.end();
  });
}

async function testSPARouting() {
  console.log('🔍 Testing SPA Routing on:', BASE_URL);
  console.log('=====================================\n');

  const routesToTest = [
    '/',
    '/super-admin-login',
    '/super-admin-dashboard', 
    '/login',
    '/dashboard'
  ];

  for (const route of routesToTest) {
    console.log(`🧪 Testing: ${route}`);
    try {
      const result = await testRoute(route);
      console.log(`   Status: ${result.status} ${result.success ? '✅' : '❌'}`);
      
      if (result.success && result.isHtml && result.hasReactRoot) {
        console.log(`   🎉 SPA ROUTING WORKING! React app served correctly`);
      } else if (result.success && result.isHtml) {
        console.log(`   📄 HTML served but no React root found`);
      } else {
        console.log(`   ❌ Not serving React app properly`);
        console.log(`   Body: ${result.body}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.error || error.message}`);
    }
    console.log('');
  }

  // Test API endpoint to ensure it still works
  console.log('🧪 Testing API endpoint (should still work)...');
  try {
    const loginData = {
      username: 'superadmin',
      password: 'VenueAdmin2024!'
    };
    
    const postData = JSON.stringify(loginData);
    const url = new URL('/api/super-admin/login', BASE_URL);
    
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'API-Test/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            body: data
          });
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    console.log(`   Status: ${response.status} ${response.success ? '✅' : '❌'}`);
    if (response.success) {
      console.log(`   🎉 API STILL WORKING!`);
    } else {
      console.log(`   ❌ API broken: ${response.body.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.log(`   ❌ API Error: ${error.message}`);
  }

  console.log('\n=====================================');
  console.log('🏁 SPA routing test completed!');
}

testSPARouting().catch(console.error);