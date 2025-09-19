export default async function handler(req, res) {
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

  // Extract contract ID from query parameters
  const { contractId } = req.query;

  if (!contractId) {
    return res.status(400).json({ error: 'Contract ID is required' });
  }

  // Handle contract status updates
  const tenantHandler = require('../../tenant.js');

  // Set the resource and contract ID for tenant handler
  req.query = { ...req.query, resource: 'contracts', contractId: contractId, action: 'status' };

  console.log('🎯 CONTRACT STATUS UPDATE:', {
    contractId,
    url: req.url,
    method: req.method,
    query: req.query
  });

  return tenantHandler(req, res);
}