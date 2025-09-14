module.exports = async function handler(req, res) {
  // Handle specific communication by ID
  const { id } = req.query;
  const tenantHandler = require('../tenant.js');

  req.query = { ...req.query, resource: 'communications', id };

  return tenantHandler(req, res);
};