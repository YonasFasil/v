module.exports = async function handler(req, res) {
  // Dedicated dashboard/analytics endpoint
  const tenantHandler = require('./tenant.js');
  
  // Parse the URL to handle different dashboard routes
  const url = req.url || '';
  
  if (url.includes('/metrics')) {
    req.query = { ...req.query, resource: 'dashboard', action: 'metrics' };
  } else if (url.includes('/analytics')) {
    req.query = { ...req.query, resource: 'dashboard', action: 'analytics' };
  } else {
    req.query = { ...req.query, resource: 'dashboard' };
  }
  
  return tenantHandler(req, res);
};