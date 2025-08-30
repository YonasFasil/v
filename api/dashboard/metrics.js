module.exports = async function handler(req, res) {
  // Dashboard metrics endpoint
  const tenantHandler = require('../tenant.js');
  
  req.query = { ...req.query, resource: 'dashboard', subresource: 'metrics' };
  
  return tenantHandler(req, res);
};