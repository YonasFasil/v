module.exports = async function handler(req, res) {
  // Dedicated campaign sources endpoint
  const tenantHandler = require('./tenant.js');

  req.query = { ...req.query, resource: 'campaign-sources' };

  return tenantHandler(req, res);
};