const https = require('https');

const BASE_URL = 'https://venuinenew.vercel.app';

async function testTenantCreation() {
  console.log('🔍 Testing Tenant Creation on:', BASE_URL);
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
      
      // Test tenant creation
      console.log('\n2. Testing tenant creation...');
      const tenantData = {
        name: 'Test Venue Company',
        slug: `test-venue-${Date.now()}`, // Unique slug using timestamp
        subscriptionPackageId: null,
        subscriptionStatus: 'active',
        adminUser: {
          email: 'admin@testvenue.com',
          password: 'TestPassword123!',
          name: 'Test Admin',
          username: 'testadmin'
        }
      };
      
      console.log(`   Creating tenant with slug: ${tenantData.slug}`);
      
      try {
        const tenantPostData = JSON.stringify(tenantData);
        const tenantUrl = new URL('/api/super-admin/tenants', BASE_URL);
        
        const tenantResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: tenantUrl.hostname,
            port: 443,
            path: tenantUrl.pathname,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(tenantPostData)
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
          req.write(tenantPostData);
          req.end();
        });
        
        console.log(`   Status: ${tenantResponse.status} ${tenantResponse.success ? '✅' : '❌'}`);
        
        if (tenantResponse.success) {
          const tenantResult = JSON.parse(tenantResponse.body);
          console.log(`   🎉 TENANT CREATION SUCCESSFUL!`);
          console.log(`   Tenant ID: ${tenantResult.tenant?.id}`);
          console.log(`   Admin User: ${tenantResult.adminUser?.email}`);
          
        } else {
          console.log(`   ❌ Tenant creation failed`);
          console.log(`   Response: ${tenantResponse.body}`);
          
          try {
            const errorResult = JSON.parse(tenantResponse.body);
            console.log(`   Error details:`, errorResult);
          } catch (e) {
            // Not JSON
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Tenant Creation Error: ${error.message}`);
      }
      
    } else {
      console.log(`   Error: ${loginResponse.body.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log('   ❌ Login Error:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Tenant creation test completed!');
}

testTenantCreation().catch(console.error);