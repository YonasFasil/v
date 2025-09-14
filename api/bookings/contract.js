module.exports = async function handler(req, res) {
  // Handle contract booking creation
  const tenantHandler = require('../tenant.js');

  req.query = { ...req.query, resource: 'contracts' };

  return tenantHandler(req, res);
};