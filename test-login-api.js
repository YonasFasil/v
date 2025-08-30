// Test if the login API can be loaded without errors
try {
  console.log('Testing login API import...');
  const loginHandler = require('./api/super-admin/login.js');
  console.log('✅ Login API imported successfully');
  console.log('Handler type:', typeof loginHandler);
} catch (error) {
  console.error('❌ Error importing login API:', error.message);
  console.error('Full error:', error);
}

// Test if regular login works too
try {
  console.log('Testing regular login API import...');
  const regularLoginHandler = require('./api/auth/login.js');
  console.log('✅ Regular login API imported successfully');
  console.log('Handler type:', typeof regularLoginHandler);
} catch (error) {
  console.error('❌ Error importing regular login API:', error.message);
  console.error('Full error:', error);
}