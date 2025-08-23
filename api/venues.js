module.exports = async function handler(req, res) {
  // Handle venues and venues-with-spaces
  const tenantHandler = require('./tenant.js');
  
  // Parse the URL to extract venue ID if present
  const url = req.url || '';
  const pathMatch = url.match(/^\/api\/venues(?:-with-spaces)?(?:\/([^/?]+))?/);
  const venueId = pathMatch ? pathMatch[1] : null;
  
  // Check URL to determine resource type
  if (req.url === '/api/venues-with-spaces' || req.url.startsWith('/api/venues-with-spaces?')) {
    req.query = { ...req.query, resource: 'venues-with-spaces' };
  } else {
    req.query = { ...req.query, resource: 'venues' };
  }
  
  // Add venue ID to query if present
  if (venueId) {
    req.query.id = venueId;
  }
  
  return tenantHandler(req, res);
};