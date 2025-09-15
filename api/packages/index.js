module.exports = async function handler(req, res) {
  const tenantHandler = require('../tenant.js');
  req.query = { ...req.query, resource: 'packages' };
  return tenantHandler(req, res);
};