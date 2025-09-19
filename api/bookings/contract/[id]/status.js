module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle contract status updates
  const { id } = req.query;
  const tenantHandler = require('../../../tenant.js');

  // Set the resource and contract ID for tenant handler
  req.query = { ...req.query, resource: 'contracts', contractId: id, action: 'status' };

  return tenantHandler(req, res);
};