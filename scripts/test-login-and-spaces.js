const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testLoginAndSpaces() {
  console.log('🔍 Testing login and spaces API with provided credentials...\n');
  
  const baseUrl = 'http://localhost:5006';
  
  try {
    console.log('1️⃣ Testing login with tenant admin credentials:');
    
    // Try login with the tenant admin we found in the database
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
    
    console.log(`Login response status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`❌ Login failed: ${errorText}`);
      
      console.log('\n2️⃣ Trying with super admin credentials:');
      
      // Try super admin login
      const superAdminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@yourdomain.com',
          password: 'VenueAdmin2024!'
        })
      });
      
      console.log(`Super admin login status: ${superAdminLogin.status}`);
      
      if (!superAdminLogin.ok) {
        const superErrorText = await superAdminLogin.text();
        console.log(`❌ Super admin login also failed: ${superErrorText}`);
        return;
      }
      
      const superLoginData = await superAdminLogin.json();
      console.log('✅ Super admin login successful!');
      console.log(`User: ${superLoginData.user?.name} (${superLoginData.user?.email})`);
      console.log(`Role: ${superLoginData.user?.role}`);
      
      return; // Super admin won't have spaces, so exit here
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Tenant admin login successful!');
    console.log(`User: ${loginData.user?.name} (${loginData.user?.email})`);
    console.log(`Role: ${loginData.user?.role}`);
    console.log(`Tenant: ${loginData.user?.tenantId}`);
    
    const token = loginData.token;
    
    if (!token) {
      console.log('❌ No token received from login');
      return;
    }
    
    console.log('\n3️⃣ Testing spaces fetch WITH proper authentication:');
    
    const spacesWithAuth = await fetch(`${baseUrl}/api/spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Spaces with auth status: ${spacesWithAuth.status}`);
    
    if (!spacesWithAuth.ok) {
      const errorText = await spacesWithAuth.text();
      console.log(`❌ Spaces with auth failed: ${errorText}`);
    } else {
      const spacesData = await spacesWithAuth.json();
      console.log(`✅ Spaces with auth successful: ${spacesData.length} spaces found`);
      spacesData.forEach((space, index) => {
        console.log(`   ${index + 1}. "${space.name}" in venue ${space.venueId}`);
      });
    }
    
    console.log('\n4️⃣ Testing spaces fetch WITHOUT authentication (simulating your bug):');
    
    const spacesWithoutAuth = await fetch(`${baseUrl}/api/spaces`);
    
    console.log(`Spaces without auth status: ${spacesWithoutAuth.status}`);
    
    if (!spacesWithoutAuth.ok) {
      const errorText = await spacesWithoutAuth.text();
      console.log(`❌ Spaces without auth failed: ${errorText}`);
      console.log('🎯 THIS IS EXPECTED - API should reject requests without auth');
    } else {
      const noAuthData = await spacesWithoutAuth.json();
      console.log(`⚠️  Spaces without auth returned: ${noAuthData.length} spaces`);
      if (noAuthData.length === 0) {
        console.log('🎯 THIS IS YOUR BUG - API returns empty array without auth!');
      }
    }
    
    console.log('\n5️⃣ Testing space creation:');
    
    // First get venues for this tenant
    const venuesResponse = await fetch(`${baseUrl}/api/venues`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (venuesResponse.ok) {
      const venuesData = await venuesResponse.json();
      console.log(`Found ${venuesData.length} venues for this tenant`);
      
      if (venuesData.length > 0) {
        const firstVenue = venuesData[0];
        console.log(`Using venue: ${firstVenue.name} (${firstVenue.id})`);
        
        // Create a test space
        const createSpaceResponse = await fetch(`${baseUrl}/api/spaces`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            venueId: firstVenue.id,
            name: 'API Test Space - Delete Me',
            description: 'This is a test space created via API',
            capacity: 30,
            pricePerHour: 20.00,
            amenities: ['WiFi', 'Projector']
          })
        });
        
        console.log(`Space creation status: ${createSpaceResponse.status}`);
        
        if (createSpaceResponse.ok) {
          const newSpace = await createSpaceResponse.json();
          console.log(`✅ Space created successfully: ${newSpace.name} (${newSpace.id})`);
          
          // Now fetch spaces again to see if it appears
          console.log('\n6️⃣ Fetching spaces again after creation:');
          
          const updatedSpacesResponse = await fetch(`${baseUrl}/api/spaces`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (updatedSpacesResponse.ok) {
            const updatedSpaces = await updatedSpacesResponse.json();
            console.log(`✅ Updated spaces list: ${updatedSpaces.length} spaces found`);
            
            const foundNewSpace = updatedSpaces.find(s => s.id === newSpace.id);
            if (foundNewSpace) {
              console.log('🎉 SUCCESS: Newly created space appears in the list!');
            } else {
              console.log('❌ PROBLEM: Newly created space does NOT appear in the list!');
            }
            
            updatedSpaces.forEach((space, index) => {
              const isNew = space.id === newSpace.id ? ' [JUST CREATED]' : '';
              console.log(`   ${index + 1}. "${space.name}"${isNew}`);
            });
          }
          
          // Cleanup - delete the test space
          await fetch(`${baseUrl}/api/spaces/${newSpace.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('🧹 Test space cleaned up');
          
        } else {
          const createError = await createSpaceResponse.text();
          console.log(`❌ Space creation failed: ${createError}`);
        }
      } else {
        console.log('❌ No venues found for this tenant');
      }
    }
    
    console.log('\n🎯 FINAL DIAGNOSIS:');
    console.log('If the API test above works but your frontend doesn\'t:');
    console.log('1. ❓ Your frontend is missing the Authorization header');
    console.log('2. ❓ Your frontend is calling the wrong endpoint');
    console.log('3. ❓ Your frontend token is expired or invalid');
    console.log('4. ❓ Your frontend state management is not updating');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running on port 5006');
      console.log('Please start the server first');
    }
  }
}

testLoginAndSpaces();