module.exports = async function handler(req, res) {
  // Dedicated venues-with-spaces endpoint
  const tenantHandler = require('./tenant.js');
  
  req.query = { ...req.query, resource: 'venues-with-spaces' };
  
  return tenantHandler(req, res);
};