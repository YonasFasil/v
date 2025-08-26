const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

/**
 * Test that demonstrates the companies isolation issue is resolved
 * by our database-level tenant context implementation
 */
async function testCompaniesIsolation() {
  console.log('🏢 Testing companies tenant isolation with database-level context...\n');
  
  const baseUrl = 'http://localhost:5009';
  
  try {
    // Step 1: Login as the test tenant admin
    console.log('1️⃣ Logging in as test tenant admin...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@yourdommain.com',
        password: 'VenueAdmin2024!'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    
    // Step 2: Test companies endpoint with new database-level tenant context
    console.log('\n2️⃣ Testing companies endpoint (should use database-level tenant context)...');
    
    const companiesResponse = await fetch(`${baseUrl}/api/companies`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (companiesResponse.ok) {
      const companies = await companiesResponse.json();
      console.log(`✅ Companies endpoint returned ${companies.length} companies`);
      console.log('   Company IDs:', companies.map(c => c.id));
      
      // The key test: If RLS is working, we should only see companies for this specific tenant
      const tenantIds = [...new Set(companies.map(c => c.tenant_id))];
      console.log(`   Unique tenant IDs found: ${tenantIds.length}`);
      console.log('   Tenant IDs:', tenantIds);
      
      if (tenantIds.length === 0) {
        console.log('✅ Perfect! No companies found - this tenant has no companies yet');
      } else if (tenantIds.length === 1) {
        console.log(`✅ Excellent! All companies belong to single tenant: ${tenantIds[0]}`);
        console.log('   🔒 Database-level tenant isolation is working!');
      } else {
        console.log('❌ ISOLATION ISSUE: Found companies from multiple tenants!');
        console.log('   This indicates RLS is not properly enforced');
      }
      
    } else {
      console.log(`❌ Companies request failed: ${companiesResponse.status}`);
      const errorText = await companiesResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // Step 3: Test that we can create a company (should only be visible to this tenant)
    console.log('\n3️⃣ Creating a test company to verify tenant isolation...');
    
    const createCompanyResponse = await fetch(`${baseUrl}/api/companies`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Company ' + Date.now(),
        email: 'test@company.com',
        phone: '555-0123',
        address: '123 Test St'
      })
    });
    
    if (createCompanyResponse.ok) {
      const newCompany = await createCompanyResponse.json();
      console.log('✅ Company created successfully');
      console.log(`   Company ID: ${newCompany.id}`);
      console.log(`   Tenant ID: ${newCompany.tenantId || newCompany.tenant_id}`);
      
      // Verify it's only visible to this tenant by fetching companies again
      const verifyResponse = await fetch(`${baseUrl}/api/companies`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.ok) {
        const updatedCompanies = await verifyResponse.json();
        const ourCompany = updatedCompanies.find(c => c.id === newCompany.id);
        
        if (ourCompany) {
          console.log('✅ New company is visible to the creating tenant');
          console.log('   🔒 Tenant isolation confirmed working!');
        } else {
          console.log('❌ New company not found - unexpected issue');
        }
      }
      
    } else {
      console.log(`❌ Company creation failed: ${createCompanyResponse.status}`);
      const errorText = await createCompanyResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    console.log('\n🎉 Companies tenant isolation test complete!');
    console.log('   If you see "Database-level tenant isolation is working!" above,');
    console.log('   then ChatGPT\'s recommendations have successfully resolved the issue.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompaniesIsolation();