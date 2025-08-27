const https = require('https');

const BASE_URL = 'https://venuinenew-avrby1dl8-yonasfasils-projects.vercel.app';

async function testRoute(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Frontend-Route-Test/1.0',
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
          headers: res.headers,
          body: data.substring(0, 500),
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', (err) => {
      reject({ path, error: err.message });
    });
    
    req.end();
  });
}

async function testFrontendRoutes() {
  console.log('🔍 Testing Frontend Routes on:', BASE_URL);
  console.log('=====================================\n');

  const routesToTest = [
    '/',
    '/super-admin-login',
    '/super-admin-dashboard',
    '/login',
    '/dashboard',
    '/some-non-existent-route'
  ];

  for (const route of routesToTest) {
    console.log(`🧪 Testing: ${route}`);
    try {
      const result = await testRoute(route);
      console.log(`   Status: ${result.status} ${result.success ? '✅' : '❌'}`);
      console.log(`   Content-Type: ${result.headers['content-type'] || 'unknown'}`);
      
      // Check if it's HTML or shows 404 content
      if (result.body.includes('<!DOCTYPE html>')) {
        if (result.body.includes('404') || result.body.includes('Page Not Found') || result.body.includes('not found')) {
          console.log(`   🚨 Contains 404 content`);
        } else if (result.body.includes('<div id="root">')) {
          console.log(`   ✅ Valid React app HTML`);
        } else {
          console.log(`   📄 HTML response`);
        }
      } else {
        console.log(`   📄 Non-HTML response: ${result.body.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.error || error.message}`);
    }
    console.log('');
  }

  console.log('=====================================');
  console.log('🏁 Frontend routes test completed!');
}

testFrontendRoutes().catch(console.error);