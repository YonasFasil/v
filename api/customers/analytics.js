const tenantHandler = require('../tenant.js');

module.exports = async function handler(req, res) {
  req.query = { ...req.query, resource: 'customer-analytics' };
  return tenantHandler(req, res);
};
