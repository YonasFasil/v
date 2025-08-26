const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testProperAPI() {
  console.log('🎯 Testing the PROPER API design...\\n');
  
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
    
    const token = loginData.token;
    
    console.log('\\n2️⃣ Testing /api/venues (just venues):');
    
    const venuesResponse = await fetch(`${baseUrl}/api/venues`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (venuesResponse.ok) {
      const venuesData = await venuesResponse.json();
      console.log(`✅ /api/venues: ${venuesData.length} venues found (no spaces)`);
    } else {
      console.log(`❌ /api/venues failed: ${venuesResponse.status}`);
    }
    
    console.log('\\n3️⃣ Testing /api/venues?include=spaces (PROPER way):');
    
    const venuesWithSpacesResponse = await fetch(`${baseUrl}/api/venues?include=spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (venuesWithSpacesResponse.ok) {
      const venuesWithSpacesData = await venuesWithSpacesResponse.json();
      console.log(`✅ /api/venues?include=spaces: ${venuesWithSpacesData.length} venues found`);
      let totalSpaces = 0;
      venuesWithSpacesData.forEach((venue, idx) => {
        const spaceCount = venue.spaces?.length || 0;
        totalSpaces += spaceCount;
        console.log(`   ${idx + 1}. Venue "${venue.name}": ${spaceCount} spaces`);
        if (venue.spaces && venue.spaces.length > 0) {
          venue.spaces.slice(0, 3).forEach((space, spaceIdx) => {
            console.log(`      ${spaceIdx + 1}. "${space.name}"`);
          });
          if (venue.spaces.length > 3) {
            console.log(`      ... and ${venue.spaces.length - 3} more spaces`);
          }
        }
      });
      console.log(`   📊 Total spaces: ${totalSpaces}`);
      
      if (totalSpaces > 0) {
        console.log('\\n🎉 SUCCESS! The proper API works!');
        console.log('✨ Your frontend should use: /api/venues?include=spaces');
      }
    } else {
      console.log(`❌ /api/venues?include=spaces failed: ${venuesWithSpacesResponse.status}`);
    }
    
    console.log('\\n4️⃣ Testing old /api/venues-with-spaces (should be removed):');
    
    const oldResponse = await fetch(`${baseUrl}/api/venues-with-spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (oldResponse.ok) {
      const oldData = await oldResponse.json();
      let oldTotalSpaces = 0;
      oldData.forEach(venue => oldTotalSpaces += (venue.spaces?.length || 0));
      console.log(`⚠️  Old API still works: ${oldData.length} venues, ${oldTotalSpaces} spaces`);
      console.log('   This endpoint should be REMOVED after frontend is updated');
    } else {
      console.log(`❌ Old API failed: ${oldResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProperAPI();