module.exports = async function handler(req, res) {
  // Calendar events endpoint  
  const tenantHandler = require('../tenant.js');
  
  // Determine resource type based on query params
  const mode = req.query?.mode || 'events';
  
  if (mode === 'events') {
    req.query = { ...req.query, resource: 'events' };
  } else {
    req.query = { ...req.query, resource: 'calendar-events' };
  }
  
  return tenantHandler(req, res);
};