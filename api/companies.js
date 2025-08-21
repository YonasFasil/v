module.exports = async function handler(req, res) {
  // Redirect to consolidated tenant API
  const tenantHandler = require('./tenant.js');
  req.query = { ...req.query, resource: 'companies' };
  return tenantHandler(req, res);
};