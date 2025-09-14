// API proxy for /api/super-admin/tenants/[tenantId]/users
// Handles tenant user operations with REST-style routing

module.exports = async function handler(req, res) {
  const { tenantId } = req.query;

  // Security: Validate UUID format
  if (!tenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
    return res.status(400).json({ error: 'Invalid or missing tenant ID' });
  }

  // Determine the action based on HTTP method
  let action;
  switch (req.method) {
    case 'GET':
      action = 'users';
      break;
    case 'POST':
      action = 'createUser';
      break;
    case 'PUT':
      // For PUT requests, we need to check if there's a userId in the request body or query
      const { userId } = req.body || req.query;
      if (userId) {
        req.query.userId = userId;
        action = 'user';
      } else {
        return res.status(400).json({ error: 'User ID required for update operations' });
      }
      break;
    case 'DELETE':
      const { userId: deleteUserId } = req.body || req.query;
      if (deleteUserId) {
        req.query.userId = deleteUserId;
        action = 'user';
      } else {
        return res.status(400).json({ error: 'User ID required for delete operations' });
      }
      break;
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }

  // Forward to existing secure endpoint
  req.query.action = action;
  req.query.tenantId = tenantId;
  return require('../../tenants.js')(req, res);
};