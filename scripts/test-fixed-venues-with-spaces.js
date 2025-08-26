const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testFixedVenuesWithSpaces() {
  console.log('🔧 Testing FIXED /api/venues-with-spaces endpoint...\n');
  
  const baseUrl = 'http://localhost:5006';
  
  try {
    console.log('1️⃣ Login as tenant admin:');
    
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
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`❌ Login failed: ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Login successful: ${loginData.user.name}`);
    console.log(`   Tenant: ${loginData.user.tenantId}`);
    
    const token = loginData.token;
    
    console.log('\n2️⃣ Testing FIXED /api/venues-with-spaces:');
    
    const venuesResponse = await fetch(`${baseUrl}/api/venues-with-spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${venuesResponse.status}`);
    
    let venuesData = null;
    if (!venuesResponse.ok) {
      const errorText = await venuesResponse.text();
      console.log(`❌ Failed: ${errorText}`);
    } else {
      venuesData = await venuesResponse.json();
      console.log(`✅ Success: ${venuesData.length} venues found`);
      
      let totalSpaces = 0;
      venuesData.forEach((venue, index) => {
        const spaceCount = venue.spaces?.length || 0;
        totalSpaces += spaceCount;
        console.log(`   ${index + 1}. Venue: "${venue.name}" with ${spaceCount} spaces`);
        
        if (venue.spaces && venue.spaces.length > 0) {
          venue.spaces.forEach((space, spaceIndex) => {
            console.log(`      ${spaceIndex + 1}. Space: "${space.name}" (${space.id})`);
          });
        }
      });
      
      console.log(`\n📊 Total spaces across all venues: ${totalSpaces}`);
      
      if (totalSpaces > 0) {
        console.log('🎉 SUCCESS: Spaces are now showing up in the API response!');
        console.log('💡 Your frontend should now display the spaces.');
      } else {
        console.log('🤔 Still no spaces - there might be another issue.');
      }
    }
    
    console.log('\n3️⃣ Quick verification - check database directly:');
    
    // Test creating and immediately seeing a space
    if (venuesData && venuesData.length > 0) {
      const firstVenue = venuesData[0];
      console.log(`Using venue: ${firstVenue.name} (${firstVenue.id})`);
      
      const createSpaceResponse = await fetch(`${baseUrl}/api/spaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venueId: firstVenue.id,
          name: 'Fix Verification Space',
          description: 'Testing the fix',
          capacity: 20,
          pricePerHour: 10.00,
          amenities: ['Test']
        })
      });
      
      if (createSpaceResponse.ok) {
        const newSpace = await createSpaceResponse.json();
        console.log(`✅ Created test space: ${newSpace.name} (${newSpace.id})`);
        
        // Immediately fetch venues-with-spaces again
        const refreshResponse = await fetch(`${baseUrl}/api/venues-with-spaces`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const refreshVenue = refreshData.find(v => v.id === firstVenue.id);
          
          if (refreshVenue) {
            console.log(`After creation, venue "${refreshVenue.name}" has ${refreshVenue.spaces?.length || 0} spaces:`);
            refreshVenue.spaces?.forEach((space, idx) => {
              const isNew = space.id === newSpace.id ? ' [JUST CREATED]' : '';
              console.log(`   ${idx + 1}. ${space.name}${isNew}`);
            });
            
            const foundNewSpace = refreshVenue.spaces?.find(s => s.id === newSpace.id);
            if (foundNewSpace) {
              console.log('🎉 PERFECT: New space appears immediately!');
            } else {
              console.log('❌ Issue: New space still not appearing');
            }
          }
        }
        
        // Cleanup
        await fetch(`${baseUrl}/api/spaces/${newSpace.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('🧹 Test space cleaned up');
      }
    }
    
    console.log('\n🎯 WHAT TO DO NOW:');
    console.log('1. If spaces are showing in this test, the fix worked!');
    console.log('2. Refresh your frontend application (hard refresh: Ctrl+F5)');
    console.log('3. Login with: yonasfasinnl.sl@gmail.com / VenueAdmin2024!');
    console.log('4. Navigate to venues page - you should now see spaces!');
    console.log('5. Try creating a new space - it should appear immediately');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixedVenuesWithSpaces();