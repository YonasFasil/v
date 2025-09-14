module.exports = async function handler(req, res) {
  // Handle specific contract operations by ID
  const { id } = req.query;
  const tenantHandler = require('../../tenant.js');

  // Set the resource and contract ID for tenant handler
  req.query = { ...req.query, resource: 'contracts', contractId: id };

  return tenantHandler(req, res);
};