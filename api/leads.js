module.exports = async function handler(req, res) {
  // Dedicated leads endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'leads' };
  
  return tenantHandler(req, res);
};