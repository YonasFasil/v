module.exports = async function handler(req, res) {
  // Dedicated settings endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'settings' };
  
  return tenantHandler(req, res);
};