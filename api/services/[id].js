module.exports = async function handler(req, res) {
  // Handle service-specific operations by ID
  const tenantHandler = require('../tenant.js');

  // Extract the service ID from the URL
  const { id } = req.query;

  // Route to tenant handler with proper parameters
  req.query = { ...req.query, resource: 'services', id };

  return tenantHandler(req, res);
};