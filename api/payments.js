module.exports = async function handler(req, res) {
  // Dedicated payments endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'payments' };
  
  return tenantHandler(req, res);
};