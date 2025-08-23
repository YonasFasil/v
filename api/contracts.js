module.exports = async function handler(req, res) {
  // Dedicated contracts endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'contracts' };
  
  return tenantHandler(req, res);
};