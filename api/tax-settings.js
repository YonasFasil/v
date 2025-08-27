module.exports = async function handler(req, res) {
  // Dedicated tax-settings endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'tax-settings' };
  
  return tenantHandler(req, res);
};