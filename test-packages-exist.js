const https = require('https');

const BASE_URL = 'https://venuinenew.vercel.app';

async function testPackagesExist() {
  console.log('🔍 Testing if subscription packages exist:', BASE_URL);
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
      console.log(`   ✅ Login successful!`);
      
      // Test subscription packages endpoint
      console.log('\n2. Testing subscription packages...');
      try {
        const packagesUrl = new URL('/api/super-admin/packages', BASE_URL);
        
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
          console.log(`   🎉 Found ${packages.length} subscription packages`);
          if (packages.length > 0) {
            console.log('   Available packages:');
            packages.slice(0, 3).forEach(pkg => {
              console.log(`     - ${pkg.name} (ID: ${pkg.id}, Price: $${pkg.price})`);
            });
          } else {
            console.log('   ⚠️  No subscription packages available!');
          }
        } else {
          console.log(`   Response: ${packagesResponse.body.substring(0, 200)}...`);
        }
        
      } catch (error) {
        console.log(`   ❌ Packages API Error: ${error.message}`);
      }
      
    } else {
      console.log(`   Error: ${loginResponse.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('   ❌ Login Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Package check completed!');
}

testPackagesExist().catch(console.error);