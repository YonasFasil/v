module.exports = async function handler(req, res) {
  const tenantHandler = require('../tenant.js');
  req.query = { ...req.query, resource: 'services' };
  return tenantHandler(req, res);
};