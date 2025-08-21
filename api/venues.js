module.exports = async function handler(req, res) {
  // Handle venues and venues-with-spaces
  const tenantHandler = require('./tenant.js');
  
  // Check URL to determine resource type
  if (req.url === '/api/venues-with-spaces' || req.url.startsWith('/api/venues-with-spaces?')) {
    req.query = { ...req.query, resource: 'venues-with-spaces' };
  } else {
    req.query = { ...req.query, resource: 'venues' };
  }
  
  return tenantHandler(req, res);
};