module.exports = async function handler(req, res) {
  // Dedicated packages endpoint  
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'packages' };
  
  return tenantHandler(req, res);
};