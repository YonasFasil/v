// API proxy for /api/super-admin/tenants/[tenantId]/users
// Handles tenant user operations with REST-style routing

const path = require('path');

module.exports = async function handler(req, res) {
  const { tenantId } = req.query;

  // Security: Validate UUID format
  if (!tenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
    return res.status(400).json({ error: 'Invalid or missing tenant ID' });
  }

  try {
    // Forward to existing secure endpoint with users action
    req.query = { ...req.query, action: 'users', tenantId };

    // Use absolute path resolution
    const tenantsHandler = require(path.join(__dirname, '../../tenants.js'));
    return await tenantsHandler(req, res);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};