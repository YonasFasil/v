const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testIsolatedCalls() {
  console.log('🔬 Testing isolated API calls to debug the tenant context issue...\\n');
  
  const baseUrl = 'http://localhost:5006';
  
  try {
    console.log('1️⃣ Login:');
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'yonasfasinnl.sl@gmail.com',
        password: 'VenueAdmin2024!'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log(`✅ Login successful: ${loginData.user.tenantId}`);
    
    // Test 1: Call /api/spaces by itself (this works)
    console.log('\\n2️⃣ Test /api/spaces alone:');
    const spacesResponse = await fetch(`${baseUrl}/api/spaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const spacesData = await spacesResponse.json();
    console.log(`   Result: ${spacesData.length} spaces`);
    
    // Test 2: Call /api/venues by itself 
    console.log('\\n3️⃣ Test /api/venues alone:');
    const venuesResponse = await fetch(`${baseUrl}/api/venues`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const venuesData = await venuesResponse.json();
    console.log(`   Result: ${venuesData.length} venues`);
    
    // Test 3: Call /api/spaces again (to see if it still works)
    console.log('\\n4️⃣ Test /api/spaces again:');
    const spacesResponse2 = await fetch(`${baseUrl}/api/spaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const spacesData2 = await spacesResponse2.json();
    console.log(`   Result: ${spacesData2.length} spaces`);
    
    // Test 4: Now call venues with spaces
    console.log('\\n5️⃣ Test /api/venues?include=spaces:');
    const venuesWithSpacesResponse = await fetch(`${baseUrl}/api/venues?include=spaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const venuesWithSpacesData = await venuesWithSpacesResponse.json();
    let totalSpaces = 0;
    venuesWithSpacesData.forEach(v => totalSpaces += (v.spaces?.length || 0));
    console.log(`   Result: ${venuesWithSpacesData.length} venues, ${totalSpaces} spaces`);
    
    // Test 5: Call /api/spaces one more time
    console.log('\\n6️⃣ Test /api/spaces after venues call:');
    const spacesResponse3 = await fetch(`${baseUrl}/api/spaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const spacesData3 = await spacesResponse3.json();
    console.log(`   Result: ${spacesData3.length} spaces`);
    
    console.log('\\n🔍 ANALYSIS:');
    console.log(`   - Spaces alone works: ${spacesData.length} spaces`);
    console.log(`   - Venues alone works: ${venuesData.length} venues`);
    console.log(`   - Venues+spaces works: ${totalSpaces} spaces`);
    console.log(`   - Spaces still works after: ${spacesData3.length} spaces`);
    
    if (spacesData.length > 0 && totalSpaces === 0) {
      console.log('\\n❌ BUG CONFIRMED: Spaces work alone but not when called from venues endpoint');
      console.log('   This suggests a tenant context isolation bug in storage.getSpaces()');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIsolatedCalls();