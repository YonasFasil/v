module.exports = async function handler(req, res) {
  // Handle package-specific operations by ID
  const tenantHandler = require('../tenant.js');

  // Extract the package ID from the URL
  const { id } = req.query;

  // Route to tenant handler with proper parameters
  req.query = { ...req.query, resource: 'packages', id };

  return tenantHandler(req, res);
};