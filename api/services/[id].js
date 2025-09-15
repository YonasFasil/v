const tenantHandler = require('../tenant.js');

module.exports = async function handler(req, res) {
  req.query = { ...req.query, resource: 'services' };
  return tenantHandler(req, res);
};
