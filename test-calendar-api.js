// Test the calendar/events API with authentication

console.log('🔍 Testing the calendar/events API...');

const API_BASE = 'https://venuine-pro.vercel.app';

// First, let's check if we can access it without auth
fetch(`${API_BASE}/api/calendar/events`)
  .then(response => {
    console.log('❌ No auth - Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('❌ No auth response:', data);
  })
  .catch(error => {
    console.log('❌ No auth error:', error.message);
  });

console.log('\nThis API requires authentication. The issue is likely:');
console.log('1. Frontend authentication not working');
console.log('2. JWT token expired or invalid');
console.log('3. API deployment not updated');
console.log('4. Caching issues');

console.log('\n💡 To debug further, check:');
console.log('- Browser Network tab for actual API calls');
console.log('- Console errors for auth issues');
console.log('- If user is logged in properly');
console.log('- If the API is returning 401 (auth) or 500 (server) errors');