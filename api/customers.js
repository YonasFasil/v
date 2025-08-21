module.exports = async function handler(req, res) {
  // Handle different customer routes
  const tenantHandler = require('./tenant.js');
  
  // Check if this is analytics route
  if (req.url.includes('/analytics')) {
    req.query = { ...req.query, resource: 'customer-analytics' };
  } else {
    req.query = { ...req.query, resource: 'customers' };
  }
  
  return tenantHandler(req, res);
};