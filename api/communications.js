module.exports = async function handler(req, res) {
  // Dedicated communications endpoint
  const tenantHandler = require('./tenant.js');

  req.query = { ...req.query, resource: 'communications' };

  return tenantHandler(req, res);
};