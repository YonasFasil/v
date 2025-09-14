// API proxy for /api/super-admin/tenants/[tenantId]
// Handles individual tenant operations with REST-style routing

module.exports = async function handler(req, res) {
  const { tenantId } = req.query;

  // Security: Validate UUID format
  if (!tenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
    return res.status(400).json({ error: 'Invalid or missing tenant ID' });
  }

  // Forward to existing secure endpoint with appropriate action
  req.query = { action: 'tenant', tenantId };
  return require('../tenants.js')(req, res);
};