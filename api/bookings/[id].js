export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract booking ID from query parameters
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  // Handle single booking operations
  const tenantHandler = require('../tenant.js');

  // Set the resource and booking ID for tenant handler
  req.query = { ...req.query, resource: 'bookings', bookingId: id };

  console.log('🎯 SINGLE BOOKING UPDATE:', {
    bookingId: id,
    url: req.url,
    method: req.method,
    query: req.query
  });

  return tenantHandler(req, res);
}