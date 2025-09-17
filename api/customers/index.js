module.exports = async function handler(req, res) {
  // Handle different customer routes
  const tenantHandler = require('../tenant.js');
  
  req.query = { ...req.query, resource: 'customers' };
  
  return tenantHandler(req, res);
};