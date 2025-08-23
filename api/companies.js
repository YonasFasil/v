module.exports = async function handler(req, res) {
  // Dedicated companies endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'companies' };
  
  return tenantHandler(req, res);
};