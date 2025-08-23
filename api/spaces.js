module.exports = async function handler(req, res) {
  // Dedicated spaces endpoint
  const tenantHandler = require('./tenant.js');
  
  // Parse the URL to extract space ID if present
  const url = req.url || '';
  const pathMatch = url.match(/^\/api\/spaces(?:\/([^/?]+))?/);
  const spaceId = pathMatch ? pathMatch[1] : null;
  
  req.query = { ...req.query, resource: 'spaces' };
  
  // Add space ID to query if present
  if (spaceId) {
    req.query.id = spaceId;
  }
  
  return tenantHandler(req, res);
};