module.exports = async function handler(req, res) {
  // Handle bookings and companies through same endpoint
  const tenantHandler = require('./tenant.js');
  
  // Check URL to determine resource type
  if (req.url === '/api/companies' || req.url.startsWith('/api/companies?')) {
    req.query = { ...req.query, resource: 'companies' };
  } else {
    req.query = { ...req.query, resource: 'bookings' };
  }
  
  return tenantHandler(req, res);
};