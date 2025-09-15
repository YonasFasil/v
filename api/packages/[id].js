const tenantHandler = require('../tenant.js');

module.exports = async function handler(req, res) {
  req.query = { ...req.query, resource: 'packages' };
  return tenantHandler(req, res);
};
