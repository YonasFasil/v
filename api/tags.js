module.exports = async function handler(req, res) {
  // Dedicated tags endpoint
  const tenantHandler = require('./tenant.js');

  req.query = { ...req.query, resource: 'tags' };

  return tenantHandler(req, res);
};