module.exports = async function handler(req, res) {
  // Dedicated tasks endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'tasks' };
  
  return tenantHandler(req, res);
};