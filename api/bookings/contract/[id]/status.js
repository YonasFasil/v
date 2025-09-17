module.exports = async function handler(req, res) {
  // Handle contract status updates
  const { id } = req.query;
  const tenantHandler = require('../../../tenant.js');

  // Set the resource and contract ID for tenant handler
  req.query = { ...req.query, resource: 'contracts', contractId: id, action: 'status' };

  return tenantHandler(req, res);
};