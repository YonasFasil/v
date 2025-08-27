const https = require('https');

const BASE_URL = 'https://venuinenew.vercel.app';

async function testPackagesAPI() {
  console.log('🔍 Testing Packages API on:', BASE_URL);
  console.log('=====================================\n');

  // Test super admin login first to get token
  console.log('1. Testing super admin login...');
  try {
    const loginData = {
      email: 'admin@yourdomain.com',
      password: 'VenueAdmin2024!'
    };
    
    const postData = JSON.stringify(loginData);
    const url = new URL('/api/super-admin/login', BASE_URL);
    
    const loginResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
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
    
    console.log(`   Status: ${loginResponse.status} ${loginResponse.success ? '✅' : '❌'}`);
    
    if (loginResponse.success) {
      const result = JSON.parse(loginResponse.body);
      const token = result.token;
      console.log(`   ✅ Login successful! Got token: ${token.substring(0, 20)}...`);
      
      // Test packages API
      console.log('\n2. Testing /api/packages endpoint...');
      try {
        const packagesUrl = new URL('/api/packages', BASE_URL);
        
        const packagesResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: packagesUrl.hostname,
            port: 443,
            path: packagesUrl.pathname,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
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
          req.end();
        });
        
        console.log(`   Status: ${packagesResponse.status} ${packagesResponse.success ? '✅' : '❌'}`);
        if (packagesResponse.success) {
          const packages = JSON.parse(packagesResponse.body);
          console.log(`   🎉 PACKAGES API WORKING! Found ${packages.length} packages`);
        } else {
          console.log(`   Response: ${packagesResponse.body.substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Packages API Error: ${error.message}`);
      }
      
      // Test services API
      console.log('\n3. Testing /api/services endpoint...');
      try {
        const servicesUrl = new URL('/api/services', BASE_URL);
        
        const servicesResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: servicesUrl.hostname,
            port: 443,
            path: servicesUrl.pathname,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
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
          req.end();
        });
        
        console.log(`   Status: ${servicesResponse.status} ${servicesResponse.success ? '✅' : '❌'}`);
        if (servicesResponse.success) {
          const services = JSON.parse(servicesResponse.body);
          console.log(`   🎉 SERVICES API WORKING! Found ${services.length} services`);
        } else {
          console.log(`   Response: ${servicesResponse.body.substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Services API Error: ${error.message}`);
      }
      
      // Test tax-settings API
      console.log('\n4. Testing /api/tax-settings endpoint...');
      try {
        const taxUrl = new URL('/api/tax-settings', BASE_URL);
        
        const taxResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: taxUrl.hostname,
            port: 443,
            path: taxUrl.pathname,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
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
          req.end();
        });
        
        console.log(`   Status: ${taxResponse.status} ${taxResponse.success ? '✅' : '❌'}`);
        if (taxResponse.success) {
          const taxSettings = JSON.parse(taxResponse.body);
          console.log(`   🎉 TAX SETTINGS API WORKING! Found ${taxSettings.length} tax settings`);
        } else {
          console.log(`   Response: ${taxResponse.body.substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Tax Settings API Error: ${error.message}`);
      }
      
    } else {
      console.log(`   Error: ${loginResponse.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('   ❌ Login Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Packages API test completed!');
}

testPackagesAPI().catch(console.error);