module.exports = async function handler(req, res) {
  // Handle specific contract operations by ID
  const { id } = req.query;

  // Check if this is a status update request
  if (req.url && req.url.includes('/status')) {
    // Redirect to the status handler
    const statusHandler = require('./[id]/status.js');
    return statusHandler.default(req, res);
  }

  const tenantHandler = require('../../tenant.js');

  // DEBUGGING: Log contract endpoint routing
  console.log('🚦 CONTRACT ENDPOINT ROUTING:');
  console.log('   Request URL:', req.url);
  console.log('   Original req.query:', JSON.stringify(req.query, null, 2));
  console.log('   Extracted ID:', id);
  console.log('   Method:', req.method);

  // Set the resource and contract ID for tenant handler
  req.query = { ...req.query, resource: 'contracts', contractId: id };

  console.log('   Modified req.query:', JSON.stringify(req.query, null, 2));

  return tenantHandler(req, res);
};