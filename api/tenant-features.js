module.exports = async function handler(req, res) {
  // Dedicated tenant-features endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'tenant-features' };
  
  return tenantHandler(req, res);
};