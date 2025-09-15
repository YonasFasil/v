module.exports = async function handler(req, res) {
  // Dedicated bookings endpoint
  const tenantHandler = require('./tenant.js');

  // DEBUGGING: Log bookings endpoint usage
  console.log('📝 /api/bookings endpoint called');
  console.log('   Method:', req.method);
  console.log('   Query params:', JSON.stringify(req.query, null, 2));
  console.log('   URL:', req.url);
  console.log('   Body keys:', req.body ? Object.keys(req.body) : 'No body');

  if (req.method === 'PATCH' && req.query.id) {
    console.log('   🔍 INDIVIDUAL BOOKING EDIT via /api/bookings');
    if (req.body && req.body.bookingsData) {
      console.log('   🚨 Individual booking endpoint got bookingsData - this is wrong!');
    }
  }

  req.query = { ...req.query, resource: 'bookings' };

  return tenantHandler(req, res);
};