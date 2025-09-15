module.exports = async function handler(req, res) {
  // Dedicated contracts endpoint
  const tenantHandler = require('./tenant.js');

  // DEBUGGING: Log contracts endpoint usage
  console.log('📋 /api/contracts endpoint called');
  console.log('   Method:', req.method);
  console.log('   Query params:', JSON.stringify(req.query, null, 2));
  console.log('   URL:', req.url);

  // For PATCH requests with id parameter, set contractId
  if (req.method === 'PATCH' && req.query.id) {
    req.query.contractId = req.query.id;
    console.log('   ✅ Set contractId to:', req.query.contractId);
  }

  req.query = { ...req.query, resource: 'contracts' };

  return tenantHandler(req, res);
};